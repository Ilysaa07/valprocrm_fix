import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/invoices/[id]/pdf - Generate and download PDF invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoice with all details
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate HTML content for PDF
    const htmlContent = generateInvoiceHTML(invoice)

    // Return HTML content that can be converted to PDF on client side
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(invoice: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .company-info {
            font-size: 14px;
            color: #666;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-info, .client-info {
            flex: 1;
        }
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8fafc;
            font-weight: bold;
            color: #374151;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-left: auto;
            width: 300px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            padding-top: 10px;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
        }
        .status-unpaid { background-color: #fef3c7; color: #92400e; }
        .status-paid { background-color: #d1fae5; color: #065f46; }
        .status-overdue { background-color: #fee2e2; color: #991b1b; }
        .status-partial { background-color: #dbeafe; color: #1e40af; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .bank-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .bank-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">VALPRO ERP</div>
        <div class="company-info">
            Sistem Manajemen Perusahaan Terpadu<br>
            Email: info@valpro.com | Telp: +62 21 1234 5678<br>
            Alamat: Jl. Sudirman No. 123, Jakarta Pusat
        </div>
    </div>

    <div class="invoice-details">
        <div class="invoice-info">
            <div class="invoice-number">INVOICE #${invoice.invoiceNumber}</div>
            <div class="info-row">
                <span class="label">Tanggal Invoice:</span> ${formatDate(invoice.issueDate)}
            </div>
            <div class="info-row">
                <span class="label">Due Date:</span> ${formatDate(invoice.dueDate)}
            </div>
            <div class="info-row">
                <span class="label">Status:</span> 
                <span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span>
            </div>
        </div>
        <div class="client-info">
            <div class="label">Dibayar Kepada:</div>
            <div class="info-row">${invoice.clientName}</div>
            ${invoice.clientAddress ? `<div class="info-row">${invoice.clientAddress}</div>` : ''}
            ${invoice.clientEmail ? `<div class="info-row">Email: ${invoice.clientEmail}</div>` : ''}
            ${invoice.clientPhone ? `<div class="info-row">Telp: ${invoice.clientPhone}</div>` : ''}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Deskripsi</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map((item: any, index: number) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.total)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${invoice.taxAmount > 0 ? `
            <div class="total-row">
                <span>Pajak:</span>
                <span>${formatCurrency(invoice.taxAmount)}</span>
            </div>
        ` : ''}
        ${invoice.discountAmount > 0 ? `
            <div class="total-row">
                <span>Diskon:</span>
                <span>-${formatCurrency(invoice.discountAmount)}</span>
            </div>
        ` : ''}
        <div class="total-row grand-total">
            <span>Total:</span>
            <span>${formatCurrency(invoice.grandTotal)}</span>
        </div>
        ${invoice.paidAmount > 0 ? `
            <div class="total-row">
                <span>Sudah Dibayar:</span>
                <span>${formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div class="total-row">
                <span>Sisa:</span>
                <span>${formatCurrency(invoice.grandTotal - invoice.paidAmount)}</span>
            </div>
        ` : ''}
    </div>

    ${invoice.notes ? `
        <div style="margin-top: 20px;">
            <div class="label">Catatan:</div>
            <div style="margin-top: 5px; padding: 10px; background-color: #f8fafc; border-radius: 5px;">
                ${invoice.notes}
            </div>
        </div>
    ` : ''}

    <div class="bank-info">
        <div class="bank-title">Informasi Pembayaran:</div>
        <div class="info-row">
            <span class="label">Bank:</span> Bank Central Asia (BCA)
        </div>
        <div class="info-row">
            <span class="label">No. Rekening:</span> 123-456-7890
        </div>
        <div class="info-row">
            <span class="label">Atas Nama:</span> PT. Valpro ERP
        </div>
        <div class="info-row">
            <span class="label">Catatan:</span> Mohon transfer sesuai dengan total invoice
        </div>
    </div>

    <div class="footer">
        <p>Terima kasih telah mempercayai layanan kami.</p>
        <p>Invoice ini dibuat oleh: ${invoice.createdBy.fullName}</p>
        <p>Generated on: ${new Date().toLocaleString('id-ID')}</p>
    </div>
</body>
</html>
  `
}
