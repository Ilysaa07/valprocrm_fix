# Invoice Generator Setup Guide

## 🎯 Fitur yang Telah Diimplementasikan

### ✅ Preview dan PDF 1:1
- Tampilan preview di web identik dengan hasil PDF
- PDF berukuran A4 (210mm x 297mm) dengan orientasi portrait
- Elemen-elemen invoice responsif di web, tetap fix A4 di PDF

### ✅ Teknologi yang Digunakan
- **html2pdf.js** untuk konversi HTML ke PDF
- **jsPDF** dengan konfigurasi unit mm, format 'a4', orientation portrait
- **Tailwind CSS** untuk styling dengan @media print & @page CSS

### ✅ Fitur Invoice
- **Role-based access**: Admin dapat melihat semua invoice, karyawan hanya invoice miliknya
- **Tombol Download PDF** dan **Print** di setiap invoice
- **Multi-page support** untuk data panjang
- **Responsive design** untuk desktop/mobile

## 📁 Struktur File yang Dibuat

```
src/
├── app/
│   ├── admin/invoices/
│   │   ├── page.tsx                    # Halaman list invoice admin
│   │   └── create/page.tsx             # Halaman create invoice admin
│   ├── employee/invoices/
│   │   └── page.tsx                    # Halaman list invoice employee
│   ├── invoices/[id]/
│   │   └── page.tsx                    # Halaman detail invoice
│   └── api/invoices/
│       ├── route.ts                    # API CRUD invoices
│       ├── [id]/route.ts               # API detail invoice
│       └── my-invoices/route.ts        # API invoice user
├── components/invoices/
│   └── InvoicePreview.tsx              # Komponen preview invoice
├── lib/
│   └── pdf-utils.ts                    # Utility functions PDF
└── styles/
    └── invoice-print.css               # CSS print styles A4
```

## 🚀 Instalasi dan Setup

### 1. Install Dependencies
```bash
npm install html2pdf.js @types/html2pdf.js
```

### 2. Update Prisma Schema
Schema sudah diupdate dengan model Invoice dan InvoiceItem. Jalankan migration:

```bash
# Jika ada data existing, backup dulu
npx prisma db push
```

### 3. Import CSS Print Styles
CSS print styles sudah diimport otomatis di `src/app/globals.css`:

```css
/* Invoice Print Styles */
@import '../styles/invoice-print.css';
```

**Note**: Import sudah dikonfigurasi otomatis, tidak perlu menambahkan manual.

### 4. Update Next.js Config (jika diperlukan)
Pastikan dynamic import untuk html2pdf.js:

```javascript
// next.config.js
module.exports = {
  experimental: {
    esmExternals: 'loose'
  }
}
```

## 🎨 Komponen Utama

### InvoicePreview Component
```typescript
import InvoicePreview, { InvoiceData } from '@/components/invoices/InvoicePreview';

// Usage
<InvoicePreview
  data={invoiceData}
  showActions={true}
  onDownload={handleDownloadPDF}
  onPrint={handlePrint}
/>
```

### PDF Utility Functions
```typescript
import { downloadPDF, printPDF, generateFilename } from '@/lib/pdf-utils';

// Download PDF
await downloadPDF('invoice-content', { 
  filename: 'invoice_2024.pdf' 
});

// Print PDF
await printPDF('invoice-content');
```

## 📱 Responsive Design

### Desktop (1024px+)
- Invoice container: 210mm width (A4)
- Full table layout
- Side-by-side header layout

### Tablet (768px - 1023px)
- Invoice container: 100% width
- Responsive table
- Stacked header layout

### Mobile (< 768px)
- Invoice container: 100% width
- Horizontal scroll table
- Single column layout

## 🖨️ Print Styles

### A4 Format
```css
@page {
  size: A4;
  margin: 10mm;
}
```

### Print-specific Styles
- Hide action buttons saat print
- Ensure proper page breaks
- Black text untuk kualitas print
- Remove background colors

## 🔐 Role-based Access

### Admin
- `/admin/invoices` - Lihat semua invoice
- `/admin/invoices/create` - Buat invoice baru
- `/admin/invoices/[id]/edit` - Edit invoice

### Employee
- `/employee/invoices` - Lihat invoice miliknya
- `/invoices/[id]` - Lihat detail invoice

## 📊 API Endpoints

### GET /api/invoices
- **Admin only**: Get all invoices
- **Response**: Array of invoices with items

### POST /api/invoices
- **Admin only**: Create new invoice
- **Body**: InvoiceData object

### GET /api/invoices/[id]
- **Role-based**: Get specific invoice
- **Admin**: Can view any invoice
- **Employee**: Can view own invoices only

### GET /api/invoices/my-invoices
- **Employee only**: Get user's invoices

## 🎯 Best Practices

### 1. PDF Generation
- Selalu gunakan `id="invoice-content"` untuk element yang akan di-PDF
- Pastikan element memiliki dimensi sebelum generate PDF
- Gunakan loading state saat generate PDF

### 2. Responsive Design
- Gunakan Tailwind responsive classes
- Test di berbagai ukuran layar
- Pastikan print styles tidak mempengaruhi web view

### 3. Performance
- Lazy load html2pdf.js
- Cache PDF generation jika memungkinkan
- Optimize images untuk PDF

### 4. Error Handling
- Validasi input sebelum submit
- Handle PDF generation errors
- Show user-friendly error messages

## 🐛 Troubleshooting

### PDF tidak generate
1. Pastikan element dengan id="invoice-content" ada
2. Check console untuk error html2pdf.js
3. Pastikan element memiliki konten dan dimensi

### Layout tidak sesuai A4
1. Check CSS print styles
2. Pastikan @page rule sudah benar
3. Test dengan browser print preview

### Responsive tidak bekerja
1. Check Tailwind responsive classes
2. Pastikan viewport meta tag ada
3. Test di berbagai device

## 📝 Contoh Data Invoice

```typescript
const sampleInvoice: InvoiceData = {
  id: '1',
  invoiceNumber: 'INV-2024-001',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  companyName: 'PT. VALPRO INTERTECH',
  companyAddress: 'JL. Raya Gading Tutuka No.1758, Soreang Kab.Bandung Jawa Barat Indonesia',
  companyPhone: '081399710085',
  companyEmail: 'mail@valprointertech.com',
  clientName: 'John Doe',
  clientAddress: '123 Main St, Jakarta',
  clientPhone: '08123456789',
  clientEmail: 'john@example.com',
  items: [
    {
      id: '1',
      description: 'Web Development',
      quantity: 1,
      unitPrice: 5000000,
      total: 5000000
    }
  ],
  subtotal: 5000000,
  taxRate: 11,
  taxAmount: 550000,
  total: 5550000,
  notes: 'Thank you for your business!',
  status: 'draft'
};
```

## 🎉 Selesai!

Fitur Invoice Generator sudah siap digunakan dengan:
- ✅ Preview dan PDF 1:1
- ✅ A4 format dengan orientasi portrait
- ✅ Responsive design
- ✅ Role-based access
- ✅ Download dan Print functionality
- ✅ Multi-page support
- ✅ Tailwind CSS styling

Silakan test fitur-fitur tersebut dan sesuaikan dengan kebutuhan bisnis Anda!
