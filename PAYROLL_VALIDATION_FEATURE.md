# Validasi Fitur Slip Gaji - Rekening/E-wallet Karyawan

## Overview
Fitur validasi untuk memastikan hanya karyawan yang memiliki nomor rekening bank atau e-wallet yang dapat dipilih saat membuat slip gaji.

## Ketentuan Validasi

### Data Rekening/E-wallet Karyawan
- **Jika rekening bank atau e-wallet sudah diisi** (salah satu atau keduanya), maka karyawan tersebut dapat dipilih di fitur pembuatan slip gaji
- **Jika rekening bank dan e-wallet belum diisi sama sekali**, maka karyawan tersebut tidak boleh muncul atau tidak bisa dipilih di fitur slip gaji

### Teknis Implementasi
- Relasi data rekening & e-wallet diambil langsung dari data pribadi karyawan yang sudah ada
- Validasi dilakukan baik di backend (API) maupun frontend (UI) untuk menghindari bug
- Notifikasi/error message yang jelas jika admin mencoba memilih karyawan yang tidak memiliki data rekening maupun e-wallet
- Optimasi query/filter untuk performa dengan data karyawan yang banyak

## Perubahan yang Dilakukan

### 1. Backend API Changes

#### `/api/admin/payroll/route.ts`
- **Validasi POST**: Memeriksa apakah karyawan memiliki `bankAccountNumber` ATAU `ewalletNumber`
- **Error Message**: "Employee must have either bank account number or e-wallet number to create payroll"
- **Include Fields**: Menambahkan `ewalletNumber` ke semua query yang mengambil data employee

#### `/api/admin/payroll/eligible-employees/route.ts` (NEW)
- **Endpoint Baru**: API khusus untuk mendapatkan karyawan yang eligible untuk payroll
- **Filter**: Hanya karyawan dengan `role: 'EMPLOYEE'`, `status: 'APPROVED'`, dan memiliki rekening/e-wallet
- **Pagination**: Mendukung pagination untuk performa yang lebih baik
- **Search**: Mendukung pencarian berdasarkan nama atau email

#### `/api/admin/payroll/[id]/route.ts`
- **Include Fields**: Menambahkan `ewalletNumber` ke semua query employee

#### `/api/employee/payroll/route.ts`
- **Include Fields**: Menambahkan `ewalletNumber` ke query employee

#### `/api/admin/payroll/export/route.ts`
- **Export Fields**: Menambahkan kolom E-wallet ke export Excel/CSV

### 2. Frontend Changes

#### `src/components/payroll/PayrollModal.tsx`
- **Interface Update**: Menambahkan `ewalletNumber` ke interface Employee
- **Validasi Frontend**: Memeriksa `bankAccountNumber` ATAU `ewalletNumber`
- **Dropdown Enhancement**: Menampilkan informasi payment method di dropdown
- **Error Message**: "Karyawan yang dipilih belum memiliki nomor rekening bank atau e-wallet"
- **Loading State**: Menambahkan loading state untuk employees

#### `src/components/payroll/EmployeeBankWarning.tsx`
- **Interface Update**: Menambahkan `ewalletNumber` ke interface
- **Logic Update**: Memeriksa `bankAccountNumber` ATAU `ewalletNumber`
- **Message Update**: "Informasi Rekening/E-wallet Belum Lengkap"

#### `src/components/payroll/NoEligibleEmployeesWarning.tsx` (NEW)
- **Komponen Baru**: Warning ketika tidak ada karyawan yang eligible
- **Action Buttons**: Link ke halaman kelola karyawan
- **Informative**: Menjelaskan syarat untuk membuat slip gaji

#### `src/app/admin/payroll/page.tsx`
- **API Integration**: Menggunakan `/api/admin/payroll/eligible-employees`
- **Interface Update**: Menambahkan `ewalletNumber` ke semua interface
- **Display Enhancement**: Menampilkan informasi e-wallet di daftar payroll
- **Button State**: Disable tombol "Buat Slip Gaji" jika tidak ada karyawan eligible
- **Warning Display**: Menampilkan warning jika tidak ada karyawan eligible

#### `src/app/employee/payroll/page.tsx`
- **Interface Update**: Menambahkan `ewalletNumber` ke interface Payroll
- **Display Enhancement**: Menampilkan informasi e-wallet di detail payroll

#### `src/components/payroll/PayrollPDFGenerator.tsx`
- **PDF Fields**: Menambahkan "No. E-wallet" ke PDF slip gaji

### 3. Database Optimization

#### Migration: `20250110000000_add_payroll_validation_indexes`
- **Index 1**: `users_role_status_idx` - untuk filtering karyawan berdasarkan role dan status
- **Index 2**: `users_payment_methods_idx` - untuk filtering berdasarkan rekening/e-wallet
- **Index 3**: `users_payroll_eligible_idx` - composite index untuk query payroll eligible

## Cara Penggunaan

### Admin
1. **Buat Slip Gaji**: Hanya karyawan dengan rekening/e-wallet yang muncul di dropdown
2. **Filter Karyawan**: Dropdown menampilkan status payment method (Rekening Bank, E-wallet, atau Keduanya)
3. **Warning**: Jika tidak ada karyawan eligible, muncul warning dengan link ke kelola karyawan
4. **Error Handling**: Pesan error yang jelas jika mencoba pilih karyawan tanpa payment method

### Karyawan
1. **Lengkapi Profil**: Harus mengisi minimal salah satu (rekening bank atau e-wallet)
2. **Lihat Slip Gaji**: Informasi payment method ditampilkan di detail slip gaji
3. **Download PDF**: PDF menampilkan informasi rekening dan e-wallet

## Error Messages

### Backend
- `"Employee must have either bank account number or e-wallet number to create payroll"`

### Frontend
- `"Karyawan yang dipilih belum memiliki nomor rekening bank atau e-wallet. Harap lengkapi profil karyawan terlebih dahulu."`
- `"Tidak ada karyawan yang memenuhi syarat"`

## Performance Optimizations

1. **Database Indexes**: Index khusus untuk query payroll eligible
2. **API Pagination**: Pagination untuk API eligible employees
3. **Selective Fields**: Hanya mengambil field yang diperlukan
4. **Parallel Queries**: Menggunakan Promise.all untuk query yang tidak bergantung
5. **Frontend Loading States**: Loading states untuk UX yang lebih baik

## Testing Scenarios

### Validasi Backend
1. ✅ Karyawan dengan rekening bank saja - BISA buat payroll
2. ✅ Karyawan dengan e-wallet saja - BISA buat payroll  
3. ✅ Karyawan dengan rekening bank dan e-wallet - BISA buat payroll
4. ❌ Karyawan tanpa rekening bank dan e-wallet - TIDAK BISA buat payroll

### Validasi Frontend
1. ✅ Dropdown hanya menampilkan karyawan eligible
2. ✅ Status payment method ditampilkan di dropdown
3. ✅ Warning muncul jika tidak ada karyawan eligible
4. ✅ Tombol "Buat Slip Gaji" disabled jika tidak ada karyawan eligible

### Performance
1. ✅ Query optimized dengan index
2. ✅ Pagination untuk data besar
3. ✅ Loading states untuk UX yang baik
4. ✅ Error handling yang comprehensive
