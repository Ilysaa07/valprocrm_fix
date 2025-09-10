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
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Add logo
    try {
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = '/logo_invoice.png'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            doc.addImage(logoImg, 'PNG', 20, 10, 30, 20)
            resolve(true)
          } catch (error) {
            console.log('Error adding logo:', error)
            resolve(false)
          }
        }
        logoImg.onerror = () => {
          console.log('Logo not found, continuing without logo')
          resolve(false)
        }
        // Timeout after 2 seconds
        setTimeout(() => resolve(false), 2000)
      })
    } catch (error) {
      console.log('Logo loading failed, continuing without logo')
    }

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
    doc.text('Jl. Raya Gading Tutuka No. 175B Soreang', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    doc.text('Kab. Bandung Jawa Barat, Indonesia', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    doc.text('Telp: 081399710085', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Line separator with color
    doc.setDrawColor(4, 45, 100) // #042d64
    doc.setLineWidth(1)
    doc.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10

    // Employee Info
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 45, 100) // #042d64
    doc.text('INFORMASI KARYAWAN', 20, yPosition)
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
      const x = index % 2 === 0 ? 20 : pageWidth / 2 + 10
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
    doc.text('RINGKASAN GAJI', 20, yPosition)
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

      doc.text(label, 20, yPosition)
      doc.text(amount, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += isTotal ? 7 : 5

      if (isGross) {
        doc.setDrawColor(4, 45, 100) // #042d64 for separator line
        doc.setLineWidth(0.5)
        doc.line(20, yPosition - 2, pageWidth - 20, yPosition - 2)
        yPosition += 3
      }
    })

    yPosition += 8

    // Payroll Components
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 45, 100) // #042d64
    doc.text('DETAIL KOMPONEN GAJI', 20, yPosition)
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    // Table header with color accent
    doc.setFillColor(4, 45, 100) // #042d64 background
    doc.rect(20, yPosition - 4, pageWidth - 40, 7, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255) // White text on colored background
    doc.text('No', 25, yPosition)
    doc.text('Komponen', 35, yPosition)
    doc.text('Jumlah', pageWidth - 60, yPosition, { align: 'right' })
    doc.text('Pajak', pageWidth - 30, yPosition, { align: 'center' })
    yPosition += 7

    // Table rows
    payroll.components.forEach((component, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250) // Light gray for even rows
        doc.rect(20, yPosition - 3, pageWidth - 40, 5, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0) // Black text for table content
      doc.text((index + 1).toString(), 25, yPosition)
      doc.text(component.name, 35, yPosition)
      doc.text(formatCurrency(component.amount), pageWidth - 60, yPosition, { align: 'right' })
      doc.text(component.isTaxable ? 'Ya' : 'Tidak', pageWidth - 30, yPosition, { align: 'center' })
      yPosition += 5
    })

    // Footer
    yPosition = pageHeight - 30
    doc.setDrawColor(4, 45, 100) // #042d64 for footer line
    doc.setLineWidth(0.5)
    doc.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(4, 45, 100) // #042d64 for footer text
    doc.text('Dokumen ini dibuat secara otomatis oleh sistem PT. VALPRO INTERTECH', pageWidth / 2, yPosition, { align: 'center' })
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
