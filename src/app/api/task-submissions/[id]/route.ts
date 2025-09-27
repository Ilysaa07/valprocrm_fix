import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: params.id },
      include: { 
        task: true,
        files: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
            fileType: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const description = (form.get('description') as string) || ''
    const newFiles = form.getAll('attachments') as File[]
    const deleteFileIds = ((form.get('deleteFileIds') as string) || '').split(',').filter(Boolean)
    
    // Validasi file dengan batas yang jelas
    const maxFileSize = 10 * 1024 * 1024 // 10MB per file
    const maxTotalSize = 50 * 1024 * 1024 // 50MB total untuk semua file
    const maxFileCount = 10 // Maksimal 10 file per submission
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
      'application/zip',
      'application/x-zip-compressed',
      'text/plain'
    ]
    
    // Validasi jumlah file
    if (newFiles.length > maxFileCount) {
      return NextResponse.json({ 
        error: `Terlalu banyak file. Maksimal ${maxFileCount} file per submission` 
      }, { status: 400 })
    }
    
    // Validasi ukuran total
    let totalSize = 0
    for (const file of newFiles) {
      totalSize += file.size
    }
    
    if (totalSize > maxTotalSize) {
      return NextResponse.json({ 
        error: `Total ukuran file terlalu besar. Maksimal ${Math.round(maxTotalSize / (1024 * 1024))}MB untuk semua file` 
      }, { status: 400 })
    }
    
    // Validasi setiap file
    for (const file of newFiles) {
      if (file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `File "${file.name}" terlalu besar. Maksimal ${Math.round(maxFileSize / (1024 * 1024))}MB per file` 
        }, { status: 400 })
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Tipe file "${file.name}" tidak didukung. Format yang diperbolehkan: PNG, JPG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, ZIP, TXT` 
        }, { status: 400 })
      }
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: params.id },
      include: { 
        task: true,
        files: true
      }
    })

    if (!submission) return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 })

    // Only owner (employee) can edit
    if (session.user.id !== submission.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Allow edits only when task is in revision or still in progress (before approved)
    if (submission.task.status !== 'REVISION' && submission.task.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Submission tidak dapat diedit pada status tugas saat ini' }, { status: 400 })
    }

    // Validasi total file (existing + new - deleted)
    const existingFileCount = submission.files.length
    const filesToDelete = deleteFileIds.length
    const newFileCount = newFiles.length
    const totalFileCount = existingFileCount - filesToDelete + newFileCount
    
    if (totalFileCount > maxFileCount) {
      return NextResponse.json({ 
        error: `Total file akan melebihi batas. Saat ini ada ${existingFileCount} file, akan ditambah ${newFileCount} file baru, dan dihapus ${filesToDelete} file. Total akan menjadi ${totalFileCount} file, melebihi batas maksimal ${maxFileCount} file.` 
      }, { status: 400 })
    }

    // Upload any new files through existing upload endpoint
    const uploadedFiles: Array<{ url: string; name: string; size: number; type: string }> = []
    for (const f of newFiles) {
      if (!f || f.size === 0) continue
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload`, {
        method: 'POST',
        body: fd,
        headers: { Cookie: request.headers.get('cookie') || '' }
      })
      if (res.ok) {
        const data = await res.json()
        uploadedFiles.push({ url: data.file.url, name: data.file.name, size: data.file.size, type: data.file.type })
      }
    }

    // Apply updates with increased timeout
    await prisma.$transaction(async (tx) => {
      await tx.taskSubmission.update({
        where: { id: params.id },
        data: { description }
      })

      // Hapus file yang dipilih untuk dihapus
      if (deleteFileIds.length > 0) {
        // Jika 'legacy' ada di deleteFileIds, hapus file legacy dari submission
        if (deleteFileIds.includes('legacy')) {
          await tx.taskSubmission.update({
            where: { id: params.id },
            data: {
              documentUrl: null,
              documentName: null,
              documentSize: null
            }
          })
          // Hapus 'legacy' dari deleteFileIds
          const filteredDeleteIds = deleteFileIds.filter(id => id !== 'legacy')
          if (filteredDeleteIds.length > 0) {
            try { await tx.taskSubmissionFile.deleteMany({ where: { id: { in: filteredDeleteIds } } }) } catch {}
          }
        } else {
          // Hapus file dari tabel TaskSubmissionFile
          try { await tx.taskSubmissionFile.deleteMany({ where: { id: { in: deleteFileIds } } }) } catch {}
        }
      }

      // Upload file baru
        if (uploadedFiles.length > 0) {
          // Tidak perlu menyimpan file sebagai legacy file karena akan disimpan di TaskSubmissionFile
          // Hapus kode legacy file untuk menghindari duplikasi file
          
          // Simpan semua file ke dalam tabel TaskSubmissionFile
          const fileData = uploadedFiles.map(f => ({
            submissionId: params.id,
            fileUrl: f.url,
            fileName: f.name,
            fileSize: f.size,
            fileType: f.type
          }))
          
          try { await tx.taskSubmissionFile.createMany({ data: fileData }) } catch (e) { console.error('Error creating files:', e) }
      }
    })

    const updated = await prisma.taskSubmission.findUnique({
      where: { id: params.id }
    })
    return NextResponse.json({ submission: updated })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

