import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = (searchParams.get('format') || 'csv').toLowerCase()
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: Prisma.TransactionWhereInput = {}
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'asc' }
  })

  const rows = transactions.map(t => ({
    Tanggal: t.date.toISOString().slice(0, 10),
    Tipe: t.type,
    Kategori: t.category,
    Deskripsi: t.description,
    Jumlah: Number(t.amount)
  }))

  if (format === 'csv') {
    const header = 'Tanggal,Tipe,Kategori,Deskripsi,Jumlah\n'
    const escape = (s: string) => (s || '').replace(/\"/g, '""')
    const body = rows.map(r => `${r.Tanggal},${r.Tipe},${r.Kategori},"${escape(r.Deskripsi || '')}",${r.Jumlah}`).join('\n')
    const csv = header + body
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="keuangan.csv"'
      }
    })
  }

  if (format === 'pdf') {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 40
    let y = margin
    doc.setFontSize(14)
    doc.text('Laporan Keuangan', margin, y)
    y += 20
    doc.setFontSize(10)
    doc.text(`Periode: ${startDate || '-'} s/d ${endDate || '-'}`, margin, y)
    y += 20
    // Header
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah (IDR)']
    const colWidths = [80, 60, 90, 220, 90]
    let x = margin
    headers.forEach((h, i) => {
      doc.text(h, x, y)
      x += colWidths[i]
    })
    y += 14
    // Rows
    rows.forEach(r => {
      x = margin
      const line = [r.Tanggal, r.Tipe, r.Kategori, r.Deskripsi || '', r.Jumlah.toLocaleString('id-ID')]
      line.forEach((val, i) => {
        const text = String(val)
        doc.text(text.length > 40 && i === 3 ? text.slice(0, 37) + '...' : text, x, y)
        x += colWidths[i]
      })
      y += 14
      if (y > 770) {
        doc.addPage()
        y = margin
      }
    })
    const pdf = doc.output('arraybuffer')
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="keuangan.pdf"'
      }
    })
  }

  if (format === 'excel') {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Keuangan')
    ws.columns = [
      { header: 'Tanggal', key: 'Tanggal', width: 14 },
      { header: 'Tipe', key: 'Tipe', width: 12 },
      { header: 'Kategori', key: 'Kategori', width: 18 },
      { header: 'Deskripsi', key: 'Deskripsi', width: 40 },
      { header: 'Jumlah', key: 'Jumlah', width: 14 },
    ]
    rows.forEach(r => ws.addRow(r))
    const buffer = await wb.xlsx.writeBuffer()
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="keuangan.xlsx"'
      }
    })
  }

  // CSV manual (tanpa xlsx)
  const header = 'Tanggal,Tipe,Kategori,Deskripsi,Jumlah\n'
  const escape = (s: string) => (s || '').replace(/\"/g, '""')
  const body = rows.map(r => `${r.Tanggal},${r.Tipe},${r.Kategori},"${escape(r.Deskripsi || '')}",${r.Jumlah}`).join('\n')
  const csv = header + body
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keuangan.csv"'
    }
  })
}


