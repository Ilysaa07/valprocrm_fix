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
      month: '2-digit',
      day: '2-digit',
    })
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            color: #333;
            line-height: 1.6;
        }
        
        /* A4 Page Size */
        @page {
            size: A4;
            margin: 0.4in;
        }
        
        .invoice-container {
            width: 210mm; /* A4 width */
            min-height: 297mm; /* A4 height */
            margin: 0 auto;
            background: white;
            position: relative;
            overflow: visible;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 0;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            display: flex;
            flex-direction: column;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .invoice-container {
                width: 100%;
                margin: 0;
                box-shadow: none;
                border-radius: 0;
                min-height: auto;
            }
        }
        
        /* Responsive for smaller screens */
        @media screen and (max-width: 900px) {
            .invoice-container {
                width: 100%;
                max-width: 100%;
                margin: 10px;
                min-height: auto;
            }
        }
        
        /* Watermark */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: 800;
            color: rgba(4, 45, 99, 0.05);
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
        }
        
        /* Header */
        .header {
            position: relative;
            z-index: 1;
            padding: 15px 25px 10px;
            background: white;
            color: #374151;
            flex-shrink: 0;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }
        
        .logo-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .logo {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        }
        
        .company-info {
            margin-top: 5px;
        }
        
        .company-info h1 {
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 3px;
            color: #042d63;
        }
        
        .company-info .tagline {
            font-size: 11px;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .company-info .address {
            font-size: 10px;
            color: #6b7280;
            line-height: 1.3;
        }
        
        .invoice-title {
            text-align: right;
        }
        
        .invoice-title h2 {
            font-size: 24px;
            font-weight: 800;
            color: #042d63;
            margin-bottom: 6px;
        }
        
        .invoice-title .invoice-number {
            font-size: 14px;
            font-weight: 700;
            color: #042d63;
            margin-bottom: 3px;
        }
        
        .invoice-title .invoice-date {
            font-size: 14px;
            font-weight: 700;
            color: #042d63;
        }
        
        /* Invoice Details */
        .invoice-details {
            padding: 20px 25px;
            background: white;
            position: relative;
            z-index: 1;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .invoice-info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .client-info {
            flex: 1;
        }
        
        .client-info h3 {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }
        
        .client-name {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 4px;
        }
        
        .client-details {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .invoice-meta {
            text-align: right;
        }
        
        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            flex-shrink: 0;
        }
        
        .items-table thead {
            background: #042d63;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
        }
        
        .items-table th {
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .items-table th:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 12px;
            color: #374151;
        }
        
        .items-table td:last-child {
            text-align: right;
            font-weight: 600;
        }
        
        .item-description {
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
        }
        
        .item-details {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .item-details ul {
            margin: 4px 0 0 16px;
            padding: 0;
        }
        
        .item-details li {
            margin-bottom: 2px;
        }
        
        /* Totals */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 15px;
            flex-shrink: 0;
        }
        
        .totals {
            width: 300px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 14px;
        }
        
        .total-label {
            color: #6b7280;
        }
        
        .total-value {
            font-weight: 600;
            color: #111827;
        }
        
        .grand-total {
            border-top: 2px solid #042d63;
            padding-top: 12px;
            margin-top: 8px;
            font-size: 18px;
            font-weight: 800;
            color: #042d63;
        }
        
        /* Payment Details */
        .payment-section {
            margin-bottom: 15px;
            flex-shrink: 0;
        }
        
        .payment-info {
            width: 100%;
        }
        
        .payment-info h3 {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
        }
        
        .bank-accounts {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .bank-account {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 13px;
            color: #374151;
            min-width: 200px;
            border: 1px solid #e5e7eb;
        }
        
        .bank-logo {
            width: 20px;
            height: 20px;
            background: #042d63;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 8px;
            flex-shrink: 0;
        }
        
        .account-number {
            font-weight: 600;
            color: #111827;
            margin-bottom: 1px;
            font-size: 12px;
        }
        
        .account-name {
            font-size: 10px;
            color: #6b7280;
            margin: 0;
            line-height: 1.2;
        }
        
        /* Footer */
        .footer {
            background: #042d63;
            color: white;
            padding: 12px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            margin-top: auto;
        }
        
        .contact-info {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: white;
        }
        
        .website {
            font-size: 13px;
            font-weight: 600;
            color: white;
        }
        
        /* Print Styles for A4 */
        @media print {
            body {
                margin: 0;
                padding: 0;
                font-size: 11px;
            }
            
            .invoice-container {
                width: 100%;
                margin: 0;
                box-shadow: none;
                border-radius: 0;
                min-height: auto;
            }
            
            .header, .invoice-details, .footer {
                padding: 10px 15px;
            }
            
            .items-table {
                font-size: 9px;
            }
            
            .items-table th,
            .items-table td {
                padding: 5px 6px;
            }
            
            .watermark {
                font-size: 60px;
            }
            
            .company-info h1 {
                font-size: 16px;
            }
            
            .invoice-title h2 {
                font-size: 20px;
            }
            
            .bank-account {
                min-width: 160px;
                padding: 5px 8px;
            }
            
            .bank-logo {
                width: 18px;
                height: 18px;
                font-size: 7px;
            }
            
            .logo {
                width: 40px;
                height: 40px;
            }
            
            .logo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            /* Ensure colors print correctly */
            .items-table thead {
                background: #042d63 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .invoice-number, .invoice-date {
                color: #042d63 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .footer {
                background: #042d63 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .invoice-container {
                margin: 0;
                max-width: 100%;
                width: 100%;
                min-height: auto;
            }
            
            .header, .invoice-details, .footer {
                padding: 15px;
            }
            
            .header-top {
                flex-direction: column;
                gap: 15px;
            }
            
            .invoice-info-section {
                flex-direction: column;
                gap: 15px;
            }
            
            .items-table {
                font-size: 11px;
            }
            
            .items-table th,
            .items-table td {
                padding: 10px 6px;
            }
            
            .bank-accounts {
                flex-direction: column;
                gap: 10px;
            }
            
            .bank-account {
                min-width: auto;
            }
            
            .footer {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Watermark -->
        <div class="watermark">Valpro INTERTECH.</div>
        
        <!-- Header -->
        <div class="header">
            <div class="header-top">
                <div class="logo-section">
                    <div class="logo">
                        <img src="/logo_invoice.png" alt="Valpro INTERTECH Logo" />
                    </div>
                    <div class="company-info">
                        <h1>PT.VALPRO INTER TECH</h1>
                        <div class="tagline">Business Entity Partner</div>
                        <div class="address">
                            JL. Raya Gading Tutuka No.1758<br>
                            Soreang Kab.Bandung Jawa Barat Indonesia
                        </div>
                    </div>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <div class="invoice-number">Invoice No | ${invoice.invoiceNumber}</div>
                    <div class="invoice-date">Tanggal Invoice | ${formatDate(invoice.issueDate)}</div>
                </div>
            </div>
        </div>
        
        <!-- Invoice Details -->
        <div class="invoice-details">
            <div class="invoice-info-section">
                <div class="client-info">
                    <h3>Invoice untuk :</h3>
                    <div class="client-name">${invoice.clientName}</div>
                    ${invoice.clientAddress ? `<div class="client-details">${invoice.clientAddress}</div>` : ''}
                    ${invoice.clientEmail ? `<div class="client-details">Email: ${invoice.clientEmail}</div>` : ''}
                    ${invoice.clientPhone ? `<div class="client-details">Telp: ${invoice.clientPhone}</div>` : ''}
                </div>
                <div class="invoice-meta">
                    <div class="invoice-number">Invoice No | ${invoice.invoiceNumber}</div>
                    <div class="invoice-date">Tanggal Invoice | ${formatDate(invoice.issueDate)}</div>
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Jumlah</th>
                        <th>Harga</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map((item: any, index: number) => `
                        <tr>
                            <td>
                                <div class="item-description">${item.description}</div>
                                ${item.description.includes('Paket') ? `
                                    <div class="item-details">
                                        <ul>
                                            <li>- 5 Subklas SBU Gedung ,termasuk Sewa</li>
                                            <li>tenaga Ahli untuk SKK</li>
                                            <li>- SBU BG 001, 002 ,005 ,006 ,009</li>
                                            <li>- SKK PJTBU Jenjang 6</li>
                                            <li>- SKK PJSKBU Jenjang 4</li>
                                        </ul>
                                    </div>
                                ` : ''}
                            </td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.unitPrice)}</td>
                            <td>${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Totals -->
            <div class="totals-section">
                <div class="totals">
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-value">${formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${invoice.taxAmount > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Pajak:</span>
                            <span class="total-value">${formatCurrency(invoice.taxAmount)}</span>
                        </div>
                    ` : ''}
                    ${invoice.discountAmount > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Diskon:</span>
                            <span class="total-value">-${formatCurrency(invoice.discountAmount)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row grand-total">
                        <span class="total-label">Total</span>
                        <span class="total-value">${formatCurrency(invoice.grandTotal)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Payment Details -->
            <div class="payment-section">
                <div class="payment-info">
                    <h3>Detail Pembayaran</h3>
                    <div class="bank-accounts">
                        <div class="bank-account">
                            <div class="bank-logo">BRI</div>
                            <div>
                                <div class="account-number">2105 0100 0365 563</div>
                                <div class="account-name">a.n PT Valpro Inter Tech</div>
                            </div>
                        </div>
                        <div class="bank-account">
                            <div class="bank-logo">BCA</div>
                            <div>
                                <div class="account-number">4373249575</div>
                                <div class="account-name">a.n PT Valpro Inter Tech</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="contact-info">
                <div class="contact-item">
                    <span>📞</span>
                    <span>081399710085</span>
                </div>
                <div class="contact-item">
                    <span>✉️</span>
                    <span>mail@valprointertech.com</span>
                </div>
            </div>
            <div class="website">www.valprointertech.com</div>
        </div>
    </div>
</body>
</html>
  `
}

