# Fitur Slip Gaji - ValproCRM

## Overview
Fitur slip gaji berbasis role yang memungkinkan admin mengelola slip gaji karyawan dan karyawan melihat slip gaji mereka sendiri.

## Fitur Utama

### Role Admin
- ✅ Membuat slip gaji baru untuk karyawan
- ✅ Mengelola komponen gaji (tunjangan dan potongan)
- ✅ Melihat daftar semua slip gaji dengan filter
- ✅ Mengubah status slip gaji (Draft → Approved → Paid)
- ✅ Export data ke Excel/CSV
- ✅ Validasi rekening bank karyawan
- ✅ Hapus slip gaji (hanya yang status Draft)

### Role Karyawan
- ✅ Melihat slip gaji sendiri
- ✅ Filter berdasarkan periode dan status
- ✅ Download slip gaji dalam format PDF
- ✅ Detail lengkap komponen gaji
- ✅ Informasi rekening bank otomatis

## Komponen Gaji

### Tunjangan
- Gaji Pokok
- Tunjangan Transport
- Tunjangan Makan
- Tunjangan Perumahan
- Tunjangan Kesehatan
- Bonus
- Lembur
- Komisi
- Tunjangan Lainnya

### Potongan
- Pajak Penghasilan
- BPJS Ketenagakerjaan
- BPJS Kesehatan
- Dana Pensiun
- Potongan Pinjaman
- Denda Keterlambatan
- Potongan Absen
- Potongan Lainnya

## Validasi & Keamanan

### Validasi Data
- ✅ Karyawan harus memiliki nomor rekening bank
- ✅ Periode harus unik per karyawan
- ✅ Komponen gaji minimal 1 item
- ✅ Jumlah gaji harus valid

### Keamanan
- ✅ Role-based access control
- ✅ Karyawan hanya bisa lihat slip gaji sendiri
- ✅ Admin bisa akses semua slip gaji
- ✅ Validasi session dan authentication

## Database Schema

### Tabel Payroll
```sql
- id (Primary Key)
- employeeId (Foreign Key ke User)
- period (Format: YYYY-MM)
- basicSalary
- totalAllowances
- totalDeductions
- grossSalary
- netSalary
- status (DRAFT, APPROVED, PAID, CANCELLED)
- paidAt
- notes
- createdById
- updatedById
- createdAt
- updatedAt
```

### Tabel PayrollComponent
```sql
- id (Primary Key)
- payrollId (Foreign Key ke Payroll)
- name
- type (enum)
- amount
- isTaxable
- description
- order
- createdAt
```

## API Endpoints

### Admin
- `GET /api/admin/payroll` - List semua payroll dengan filter
- `POST /api/admin/payroll` - Buat payroll baru
- `GET /api/admin/payroll/[id]` - Detail payroll
- `PUT /api/admin/payroll/[id]` - Update payroll
- `DELETE /api/admin/payroll/[id]` - Hapus payroll
- `GET /api/admin/payroll/export` - Export data

### Employee
- `GET /api/employee/payroll` - List payroll karyawan sendiri

## File Structure

```
src/
├── app/
│   ├── admin/payroll/page.tsx          # Halaman admin
│   ├── employee/payroll/page.tsx       # Halaman karyawan
│   └── api/
│       ├── admin/payroll/              # API admin
│       └── employee/payroll/           # API karyawan
├── components/
│   └── payroll/
│       ├── PayrollModal.tsx            # Modal create/edit
│       ├── PayrollPDFGenerator.tsx     # Generate PDF
│       └── EmployeeBankWarning.tsx     # Warning rekening
└── prisma/
    └── schema.prisma                   # Database schema
```

## Cara Penggunaan

### Admin
1. Buka menu "Slip Gaji" di sidebar
2. Klik "Buat Slip Gaji" untuk membuat baru
3. Pilih karyawan (harus ada rekening bank)
4. Isi periode dan gaji pokok
5. Tambahkan komponen gaji (tunjangan/potongan)
6. Simpan dan ubah status sesuai kebutuhan

### Karyawan
1. Buka menu "Slip Gaji" di sidebar
2. Lihat daftar slip gaji dengan filter
3. Klik "Lihat Detail" untuk detail lengkap
4. Klik "Download PDF" untuk unduh slip gaji

## Export Features

### Excel/CSV
- Export semua data payroll
- Filter berdasarkan periode, karyawan, status
- Format CSV dengan header lengkap

### PDF
- Generate PDF slip gaji individual
- Layout profesional dengan logo perusahaan
- Detail lengkap komponen gaji
- Informasi karyawan dan rekening

## Dependencies

```json
{
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
}
```

## Status Implementasi

- ✅ Database schema
- ✅ API endpoints
- ✅ Admin interface
- ✅ Employee interface
- ✅ PDF generation
- ✅ Excel export
- ✅ Validasi data
- ✅ Role-based access
- ✅ UI/UX responsive

## Testing

Untuk test fitur:
1. Login sebagai admin
2. Buka menu "Slip Gaji"
3. Buat slip gaji baru
4. Test filter dan search
5. Test export PDF/Excel
6. Login sebagai karyawan
7. Lihat slip gaji sendiri
8. Test download PDF

## Catatan Penting

- Pastikan karyawan memiliki nomor rekening bank sebelum membuat slip gaji
- Periode harus dalam format YYYY-MM (contoh: 2024-01)
- Status payroll: DRAFT → APPROVED → PAID
- Hanya admin yang bisa hapus payroll (status DRAFT saja)
- PDF generation menggunakan jsPDF library
