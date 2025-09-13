import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSubmissionSchema = z.object({
  taskId: z.string().min(1, 'Task ID harus diisi'),
  content: z.string().min(1, 'Konten submission harus diisi'),
  attachments: z.array(z.string()).default([]),
})

const validateSubmissionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  feedback: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const taskId = formData.get('taskId') as string
    const content = formData.get('content') as string
    const files = formData.getAll('attachments') as File[]

    if (!taskId || !content) {
      return NextResponse.json({ error: 'Task ID dan content harus diisi' }, { status: 400 })
    }

    // Validasi file
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const maxTotalSize = 50 * 1024 * 1024 // 50MB total untuk semua file
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain'
    ]
    
    // Validasi ukuran total
    let totalSize = 0
    for (const file of files) {
      totalSize += file.size
    }
    
    if (totalSize > maxTotalSize) {
      return NextResponse.json({ 
        error: `Total ukuran file terlalu besar. Maksimal 50MB untuk semua file` 
      }, { status: 400 })
    }
    
    // Validasi setiap file
    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `File ${file.name} terlalu besar. Maksimal 10MB per file` 
        }, { status: 400 })
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Tipe file ${file.name} tidak didukung. Gunakan: PNG, JPG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, ZIP, TXT` 
        }, { status: 400 })
      }
    }

    // Check if task exists and user has permission
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })
    }

    // Check if user is assigned to this task
    const isAssignee = task.assigneeId === session.user.id
    const isAllEmployeesTask = task.assignment === 'ALL_EMPLOYEES'
    
    if (!isAssignee && !isAllEmployeesTask) {
      return NextResponse.json({ 
        error: 'Anda tidak diizinkan untuk submit task ini' 
      }, { status: 403 })
    }

    // Check if task can be submitted
    if (task.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Task yang sudah selesai tidak dapat disubmit lagi' 
      }, { status: 400 })
    }

    if (task.status === 'NOT_STARTED') {
      return NextResponse.json({ 
        error: 'Task harus dimulai terlebih dahulu sebelum dapat disubmit' 
      }, { status: 400 })
    }

    // Upload files locally to avoid cross-endpoint dependency and cookie issues
    const uploadedFiles: Array<{ url: string; name: string; size: number; type: string }> = []
    try {
      const { writeFile, mkdir } = await import('fs/promises')
      const { join } = await import('path')
      const { existsSync } = await import('fs')
      const { v4: uuidv4 } = await import('uuid')

      const uploadDir = join(process.cwd(), 'public/uploads/submissions')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

    for (const file of files) {
      if (file.size > 0) {
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const ext = (file.name.split('.').pop() || 'dat').toLowerCase()
          const uniqueFilename = `submission_${taskId}_${session.user.id}_${uuidv4()}.${ext}`
          const uploadPath = join(uploadDir, uniqueFilename)
          await writeFile(uploadPath, buffer)
          const fileUrl = `/uploads/submissions/${uniqueFilename}`
          uploadedFiles.push({ url: fileUrl, name: file.name, size: file.size, type: file.type })
        }
      }
    } catch (e) {
      console.error('Local upload failed:', e)
    }

    // Use transaction for DB operations only
    const result = await prisma.$transaction(async (tx) => {
      // Verify user exists before creating submission
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });
      
      if (!user) {
        throw new Error(`User with ID ${session.user.id} not found. Please log in again.`);
      }
      
      // Upsert-like behavior: if submission exists for (taskId,userId), update instead of create
      const existing = await tx.taskSubmission.findFirst({ where: { taskId, userId: user.id } })
      const submission = existing
        ? await tx.taskSubmission.update({
            where: { id: existing.id },
            data: { description: content },
            include: { user: { select: { id: true, fullName: true, email: true } } }
          })
        : await tx.taskSubmission.create({
            data: {
              taskId: taskId,
              userId: user.id,
              description: content,
              documentUrl: null,
              documentName: null,
              documentSize: null,
            },
            include: { user: { select: { id: true, fullName: true, email: true } } }
          })

      // Save all files in TaskSubmissionFile table
      if (uploadedFiles.length > 0) {
        // Simpan semua file dan integrasikan ke dokumen (public)
        for (const f of uploadedFiles) {
          // Buat dokumen & versi
          const doc = await tx.document.create({
            data: {
              title: f.name,
              description: `Submission untuk ${task.title}`,
              ownerId: session.user.id,
              visibility: 'PUBLIC',
              sizeBytes: f.size,
              mimeType: f.type,
              versions: {
                create: {
                  version: 1,
                  fileUrl: f.url,
                  uploadedBy: session.user.id
                }
              }
            },
            include: { versions: true }
          })
          await tx.document.update({ where: { id: doc.id }, data: { currentVerId: doc.versions[0].id } })

          // Simpan referensi file submission untuk legacy tampilan
          await tx.taskSubmissionFile.create({
            data: {
          submissionId: submission.id,
          fileUrl: f.url,
          fileName: f.name,
          fileSize: f.size,
          fileType: f.type,
            }
          })
          // Also link submission document to task attachments list
          await tx.taskFile.create({ data: { taskId: task.id, documentId: doc.id, uploadedBy: session.user.id } })
        }
      }

      // Update task status to PENDING_VALIDATION
      await tx.task.update({
        where: { id: taskId },
        data: { status: 'PENDING_VALIDATION' }
      })

      return { submission, uploadedFiles }
    })

    return NextResponse.json({
      message: 'Submission berhasil dibuat',
      submission: result.submission,
      files: result.uploadedFiles
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating task submission:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Data tidak valid', 
        details: error.errors 
      }, { status: 400 })
    }
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Submission untuk task ini sudah ada' 
      }, { status: 400 })
    }
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      if (error.message.includes('userId')) {
        return NextResponse.json({ 
          error: 'User ID tidak valid. Silakan login kembali.' 
        }, { status: 400 })
      }
      if (error.message.includes('taskId')) {
        return NextResponse.json({ 
          error: 'Task ID tidak valid atau task tidak ditemukan.' 
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: 'Referensi data tidak valid.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const status = searchParams.get('status')
    const submissionId = searchParams.get('submissionId')

    const where: any = {}

    if (taskId) {
      where.taskId = taskId
    }

    if (status) {
      where.status = status
    }
    
    if (submissionId) {
      where.id = submissionId
    }

    // Role-based filtering
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id
    }

    const submissions = await prisma.taskSubmission.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        files: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
            fileType: true
          }
        } // Include all related files with specific fields
      },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json({ submissions })

  } catch (error) {
    console.error('Error fetching task submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
