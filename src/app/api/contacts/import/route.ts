import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Format file tidak didukung. Gunakan CSV atau Excel.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Ukuran file terlalu besar. Maksimal 5MB.' 
      }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ 
        error: 'File harus memiliki header dan minimal 1 data.' 
      }, { status: 400 })
    }

    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const dataLines = lines.slice(1)

    // Validate required columns
    const requiredColumns = ['Nama Lengkap']
    const missingColumns = requiredColumns.filter(col => !header.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.replace(/"/g, '').trim())
        const rowData: any = {}

        header.forEach((col, index) => {
          rowData[col] = values[index] || ''
        })

        const fullName = rowData['Nama Lengkap']
        if (!fullName) {
          results.errors.push(`Baris ${i + 2}: Nama lengkap wajib diisi`)
          results.failed++
          continue
        }

        // Check for duplicates
        const phoneNumber = rowData['Nomor Telepon'] || null
        const whatsappNumber = rowData['WhatsApp'] || null

        if (phoneNumber || whatsappNumber) {
          const existing = await prisma.contact.findFirst({
            where: {
              OR: [
                phoneNumber ? { phoneNumber } : {},
                whatsappNumber ? { whatsappNumber } : {}
              ].filter(Boolean)
            }
          })

          if (existing) {
            results.errors.push(`Baris ${i + 2}: Nomor telepon/WhatsApp sudah ada`)
            results.failed++
            continue
          }
        }

        const followUpDate = rowData['Tanggal Follow Up']
        let parsedFollowUpDate = null
        if (followUpDate) {
          const date = new Date(followUpDate)
          if (!isNaN(date.getTime())) {
            parsedFollowUpDate = date
          }
        }

        await prisma.contact.create({
          data: {
            fullName,
            phoneNumber: rowData['Nomor Telepon'] || null,
            whatsappNumber: rowData['WhatsApp'] || null,
            instagram: rowData['Instagram'] || null,
            address: rowData['Alamat'] || null,
            companyName: rowData['Perusahaan'] || null,
            position: rowData['Jabatan'] || null,
            notes: rowData['Catatan'] || null,
            clientStatus: rowData['Status Klien'] || 'PROSPECT',
            serviceType: rowData['Jenis Layanan'] || null,
            followUpDate: parsedFollowUpDate,
            createdById: session.user.id
          }
        })

        results.success++
      } catch (error) {
        results.errors.push(`Baris ${i + 2}: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`)
        results.failed++
      }
    }

    return NextResponse.json({
      message: 'Import selesai',
      results
    })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
