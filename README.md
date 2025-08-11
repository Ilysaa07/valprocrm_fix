# Valproltal - Employee Management System

Sistem manajemen karyawan yang komprehensif dengan fitur dashboard admin, manajemen tugas, dan invoice generator.

## Fitur Utama

### Dashboard Admin
- Kelola karyawan dan persetujuan registrasi
- Manajemen tugas dan assignment
- Analisis keuangan dan reporting
- **Invoice Generator** - Buat dan kelola invoice untuk karyawan

### Dashboard Karyawan
- Lihat dan kelola tugas yang diberikan
- Submit hasil pekerjaan
- **Lihat Invoice** - Akses invoice yang diterima
- Notifikasi real-time

### Fitur Baru yang Ditambahkan
1. **Invoice Generator dengan PDF Export**
   - Admin dapat membuat invoice untuk karyawan
   - **PDF Generation**: Menghasilkan PDF sesuai desain PT. Valpro Inter Tech
   - Support multiple currency (IDR, USD, EUR)
   - Status tracking (Pending, Paid, Partial, Unpaid)
   - Multiple items per invoice
   - Karyawan dapat melihat invoice mereka

2. **Invoice History & Management**
   - **Filter & Search**: Pencarian berdasarkan nomor invoice atau klien
   - **Status Management**: Admin dapat mengubah status invoice
   - **Date Range Filter**: Filter berdasarkan rentang waktu
   - **Statistics Dashboard**: Statistik invoice dengan breakdown status



3. **Data Real-time (No Mock Data)**
   - Dashboard menampilkan data aktual dari database
   - Tidak lagi menggunakan mock data
   - Statistik yang akurat dan up-to-date
   - Live updates untuk semua metrics

## Teknologi yang Digunakan

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **PDF Generation**: jsPDF, html2canvas
- **UI Components**: Custom components dengan Lucide React icons

## Persyaratan Sistem

- Node.js 18+ 
- MySQL 8.0+
- npm atau yarn

## Instalasi dan Setup

### 1. Clone atau Extract Project
```bash
# Jika dari zip file, extract terlebih dahulu
unzip valproltal-main.zip
cd valproltal-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database MySQL

#### Opsi A: Menggunakan MySQL Server Lokal
```bash
# Install MySQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation

# Login ke MySQL dan buat database
sudo mysql -u root -p
```

```sql
-- Di MySQL console
CREATE DATABASE valproltal_db;
CREATE USER 'valproltal_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON valproltal_db.* TO 'valproltal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Opsi B: Menggunakan Docker (Alternatif)
```bash
# Jika menggunakan Docker
docker run --name mysql-valproltal -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=valproltal_db -e MYSQL_USER=valproltal_user -e MYSQL_PASSWORD=password -p 3306:3306 -d mysql:8.0
```

### 4. Konfigurasi Environment
```bash
# Copy file .env.example ke .env (jika ada) atau buat file .env baru
cp .env.example .env
```

Edit file `.env`:
```env
# Database
DATABASE_URL="mysql://valproltal_user:password@localhost:3306/valproltal_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Setup Database Schema
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database dengan data demo
npm run db:seed
```

### 6. Jalankan Aplikasi
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## Akun Demo

Setelah menjalankan seed, gunakan akun berikut untuk testing:

### Admin
- **Email**: admin@demo.com
- **Password**: password123
- **Akses**: Dashboard admin, kelola karyawan, tugas, invoice

### Karyawan
- **Email**: employee@demo.com  
- **Password**: password123
- **Akses**: Dashboard karyawan, lihat tugas, lihat invoice

### Karyawan Pending
- **Email**: pending@demo.com
- **Password**: password123
- **Status**: Menunggu persetujuan admin

## Struktur Project

```
valproltal-main/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   │   ├── invoices/      # Invoice management
│   │   │   └── ...
│   │   ├── employee/          # Employee dashboard pages
│   │   │   ├── invoices/      # Employee invoice view
│   │   │   └── ...
│   │   ├── api/               # API routes
│   │   │   ├── invoices/      # Invoice API endpoints
│   │   │   └── ...
│   │   └── auth/              # Authentication pages
│   ├── components/            # Reusable components
│   │   ├── ui/                # UI components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Utilities and configurations
│   └── styles/                # Global styles
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── package.json
```

## Fitur Invoice Generator

### Untuk Admin
1. Login sebagai admin
2. Navigasi ke menu "Invoice" 
3. Klik "Create Invoice"
4. Isi detail invoice:
   - Invoice number (auto-generated)
   - Issue date dan due date
   - Pilih karyawan penerima
   - Currency (IDR/USD/EUR)
   - Status (Pending/Paid/Partial/Unpaid)
   - Items dengan deskripsi, quantity, dan harga
5. Klik "Create Invoice"
6. **Generate PDF**: Klik tombol "PDF" untuk download invoice dalam format PDF

### Invoice History Management
1. Navigasi ke menu "Invoice History"
2. Lihat statistik invoice (Total, Paid, Partial, Outstanding)
3. Filter invoice berdasarkan:
   - Status (All, Pending, Paid, Partial, Unpaid)
   - Pencarian (nomor invoice atau nama klien)
   - Rentang tanggal (Today, This Week, This Month, This Year)
4. Update status invoice langsung dari dropdown
5. Generate PDF untuk setiap invoice

### Untuk Karyawan
1. Login sebagai karyawan
2. Navigasi ke menu "Invoice Saya"
3. Lihat daftar invoice yang diterima
4. Klik invoice untuk melihat detail lengkap
5. Download PDF invoice jika diperlukan

### Format PDF Invoice
PDF yang dihasilkan mengikuti desain resmi PT. Valpro Inter Tech dengan:
- Header perusahaan dengan logo dan informasi kontak
- Detail invoice (nomor, tanggal, client)
- Tabel items dengan quantity, harga, dan total
- Total amount dengan currency formatting
- Detail pembayaran (rekening bank, kontak)
- Status pembayaran dengan color coding

## Mode Gelap/Terang

- Toggle theme tersedia di header (ikon sun/moon)
- Setting tersimpan otomatis di localStorage
- Konsisten di seluruh halaman aplikasi
- Mendukung system preference detection

## Troubleshooting

### Database Connection Error
```bash
# Pastikan MySQL service berjalan
sudo systemctl status mysql

# Restart jika perlu
sudo systemctl restart mysql

# Check database exists
mysql -u valproltal_user -p -e "SHOW DATABASES;"
```

### Prisma Issues
```bash
# Reset database (HATI-HATI: akan menghapus semua data)
npx prisma migrate reset

# Generate ulang client
npx prisma generate
```

### Port Already in Use
```bash
# Cek process yang menggunakan port 3000
lsof -i :3000

# Kill process jika perlu
kill -9 <PID>

# Atau gunakan port lain
npm run dev -- -p 3001
```

## Development

### Menambah Fitur Baru
1. Update Prisma schema jika perlu database changes
2. Generate migration: `npx prisma migrate dev --name feature_name`
3. Update API routes di `src/app/api/`
4. Buat/update components di `src/components/`
5. Buat/update pages di `src/app/`

### Database Management
```bash
# Lihat database di browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations ke production
npx prisma migrate deploy
```

## Production Deployment

### Build untuk Production
```bash
npm run build
npm start
```

### Environment Variables untuk Production
```env
DATABASE_URL="mysql://user:password@host:port/database"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
```

### Deployment Options
- **Vercel**: Recommended untuk Next.js apps
- **Docker**: Containerized deployment
- **VPS**: Manual deployment dengan PM2

## Support

Untuk pertanyaan atau issues, silakan buat issue di repository atau hubungi tim development.

## Changelog

### v2.1.0 (Latest - Updated)
- ✅ **Invoice Generator dengan PDF Export** - Generate PDF sesuai desain PT. Valpro Inter Tech
- ✅ **Invoice History & Management** - Filter, search, dan status management
- ✅ **Fixed Dark/Light Mode Toggle** - Theme switching yang berfungsi sempurna
- ✅ **Real-time Data Implementation** - Hapus semua mock data, gunakan data aktual
- ✅ **Multi-currency Support** - IDR, USD, EUR dengan formatting yang tepat
- ✅ **Status Management System** - Paid, Unpaid, Partial, Pending dengan color coding
- ✅ **Enhanced UI/UX** - Konsistensi tema dan responsiveness
- ✅ **Comprehensive Testing** - Semua fitur telah ditest dan berfungsi

### v2.0.0
- ✅ Tambah fitur Invoice Generator
- ✅ Perbaiki mode gelap/terang
- ✅ Implementasi data real-time (hapus mock data)
- ✅ Fix authentication issues
- ✅ Improve UI/UX consistency
- ✅ Add comprehensive documentation

### v1.0.0
- Dashboard admin dan karyawan
- Manajemen tugas
- Sistem notifikasi
- Authentication dengan NextAuth.js

#   c r m  
 