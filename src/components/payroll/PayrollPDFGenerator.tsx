'use client'

import jsPDF from 'jspdf'
import { Payroll } from '@/app/admin/payroll/page'

interface PayrollPDFGeneratorProps {
  payroll: Payroll
}

export default function PayrollPDFGenerator({ payroll }: PayrollPDFGeneratorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generatePDF = async () => {
    // A4 portrait in millimeters ensures predictable sizing
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginLeft = 20
    const marginRight = 20
    const contentWidth = pageWidth - marginLeft - marginRight
    let yPosition = 20

    const ensureSpace = (needed: number) => {
      if (yPosition + needed > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
      }
    }

    // Add logo
    try {
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = '/logo_invoice.png'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            doc.addImage(logoImg, 'PNG', marginLeft, 10, 30, 20)
            resolve(true)
          } catch (error) {
            resolve(false)
          }
        }
        logoImg.onerror = () => { resolve(false) }
        // Timeout after 2 seconds
        setTimeout(() => resolve(false), 2000)
      })
    } catch {}

    // Header with color accent
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 45, 100) // #042d64
    doc.text('SLIP GAJI', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Company Info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(4, 45, 100) // #042d64
    doc.text('PT. VALPRO INTERTECH', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    doc.setTextColor(0, 0, 0) // Reset to black for address
    const address1 = doc.splitTextToSize('Jl. Raya Gading Tutuka No. 175B Soreang', contentWidth)
    doc.text(address1 as string[], pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    const address2 = doc.splitTextToSize('Kab. Bandung Jawa Barat, Indonesia', contentWidth)
    doc.text(address2 as string[], pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    doc.text('Telp: 081399710085', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Line separator with color
    doc.setDrawColor(4, 45, 100) // #042d64
    doc.setLineWidth(1)
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition)
    yPosition += 10

    // Employee Info
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 45, 100) // #042d64
    doc.text('INFORMASI KARYAWAN', marginLeft, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0) // Reset to black for normal text
    
    // Employee details in two columns
    const employeeDetails = [
      ['Nama Lengkap', payroll.employee.fullName],
      ['Email', payroll.employee.email],
      ['No. Rekening Bank', payroll.employee.bankAccountNumber || '-'],
      ['No. E-wallet', payroll.employee.ewalletNumber || '-'],
      ['Periode', payroll.period],
      ['Tanggal Dibuat', formatDate(payroll.createdAt)],
      ['Status', payroll.status]
    ]

    employeeDetails.forEach(([label, value], index) => {
      ensureSpace(7)
      const x = index % 2 === 0 ? marginLeft : pageWidth / 2 + 10
      const y = yPosition + (Math.floor(index / 2) * 7)
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(4, 45, 100) // #042d64 for labels
      doc.text(`${label}:`, x, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0) // Black for values
      doc.text(value, x + 50, y)
    })

    yPosition += 35

    // Salary Summary
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 45, 100) // #042d64
    ensureSpace(18)
    doc.text('RINGKASAN GAJI', marginLeft, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0) // Reset to black for normal text

    const salaryDetails = [
      ['Gaji Pokok', formatCurrency(payroll.basicSalary)],
      ['Total Tunjangan', formatCurrency(payroll.totalAllowances)],
      ['Total Potongan', formatCurrency(payroll.totalDeductions)],
      ['Gaji Kotor', formatCurrency(payroll.grossSalary)],
      ['Gaji Bersih', formatCurrency(payroll.netSalary)]
    ]

    salaryDetails.forEach(([label, amount], index) => {
      const isTotal = index === salaryDetails.length - 1
      const isGross = index === salaryDetails.length - 2
      
      if (isTotal || isGross) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(isTotal ? 12 : 10)
        if (isTotal) {
          doc.setTextColor(4, 45, 100) // #042d64 for final total
        } else {
          doc.setTextColor(0, 0, 0) // Black for gross
        }
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0) // Black for normal items
      }

      ensureSpace(isTotal ? 9 : 7)
      doc.text(label, marginLeft, yPosition)
      doc.text(amount, pageWidth - marginRight, yPosition, { align: 'right' })
      yPosition += isTotal ? 7 : 5

      if (isGross) {
        doc.setDrawColor(4, 45, 100) // #042d64 for separator line
        doc.setLineWidth(0.5)
        doc.line(marginLeft, yPosition - 2, pageWidth - marginRight, yPosition - 2)
        yPosition += 3
      }
    })

    yPosition += 8

    // Payroll Components
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 45, 100) // #042d64
    ensureSpace(15)
    doc.text('DETAIL KOMPONEN GAJI', marginLeft, yPosition)
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    // Table header with color accent
    doc.setFillColor(4, 45, 100) // #042d64 background
    doc.rect(marginLeft, yPosition - 4, contentWidth, 7, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255) // White text on colored background
    const colNoX = marginLeft + 5
    const colNameX = marginLeft + 15
    const colAmountX = pageWidth - marginRight - 30
    const colTaxX = pageWidth - marginRight - 10
    const nameColWidth = colAmountX - colNameX - 5
    doc.text('No', colNoX, yPosition)
    doc.text('Komponen', colNameX, yPosition)
    doc.text('Jumlah', colAmountX, yPosition, { align: 'right' })
    doc.text('Pajak', colTaxX, yPosition, { align: 'center' })
    yPosition += 7

    // Table rows
    payroll.components.forEach((component, index) => {
      // Prepare wrapped name text
      const wrappedName = doc.splitTextToSize(component.name, nameColWidth)
      const rowHeight = Array.isArray(wrappedName) ? Math.max(5, wrappedName.length * 5) : 5
      ensureSpace(rowHeight + 3)

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250) // Light gray for even rows
        doc.rect(marginLeft, yPosition - 3, contentWidth, rowHeight, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0) // Black text for table content
      doc.text((index + 1).toString(), colNoX, yPosition)
      doc.text(wrappedName as string[], colNameX, yPosition)
      doc.text(formatCurrency(component.amount), colAmountX, yPosition, { align: 'right' })
      doc.text(component.isTaxable ? 'Ya' : 'Tidak', colTaxX, yPosition, { align: 'center' })
      yPosition += rowHeight
    })

    // Footer
    yPosition = pageHeight - 30
    doc.setDrawColor(4, 45, 100) // #042d64 for footer line
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition)
    yPosition += 10

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(4, 45, 100) // #042d64 for footer text
    const footerText = doc.splitTextToSize('Dokumen ini dibuat secara otomatis oleh sistem PT. VALPRO INTERTECH', contentWidth)
    doc.text(footerText as string[], pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    doc.setTextColor(0, 0, 0) // Black for date
    doc.text(`Dicetak pada: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPosition, { align: 'center' })

    // Save the PDF
    const fileName = `Slip_Gaji_${payroll.employee.fullName.replace(/\s+/g, '_')}_${payroll.period}.pdf`
    doc.save(fileName)
  }

  return (
    <button
      onClick={() => generatePDF()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF
    </button>
  )
}
