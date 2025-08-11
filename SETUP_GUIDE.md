# Panduan Setup Sistem Dashboard Karyawan

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Persyaratan Sistem](#persyaratan-sistem)
3. [Instalasi Database MySQL](#instalasi-database-mysql)
4. [Setup Proyek](#setup-proyek)
5. [Konfigurasi Environment](#konfigurasi-environment)
6. [Migrasi Database](#migrasi-database)
7. [Menjalankan Aplikasi](#menjalankan-aplikasi)
8. [Fitur-Fitur Sistem](#fitur-fitur-sistem)
9. [Panduan Penggunaan](#panduan-penggunaan)
10. [Troubleshooting](#troubleshooting)
11. [Keamanan](#keamanan)

## Pendahuluan

Sistem Dashboard Karyawan adalah aplikasi web berbasis Next.js yang dirancang untuk mengelola karyawan, tugas, dan keuangan perusahaan. Sistem ini menggunakan teknologi modern dengan keamanan tinggi menggunakan Argon2 untuk hashing password dan MySQL sebagai database utama.

### Fitur Utama

- **Manajemen Karyawan**: Registrasi, persetujuan, dan pengelolaan data karyawan
- **Sistem Tugas**: Pembuatan, penugasan, dan pengumpulan tugas dengan upload dokumen
- **Manajemen Keuangan**: Pencatatan pemasukan dan pengeluaran perusahaan
- **Profil Pengguna**: Pengelolaan profil dan perubahan password
- **Role-based Access**: Dashboard terpisah untuk admin dan karyawan
- **Upload Dokumen**: Fitur upload file untuk pengumpulan tugas
- **Notifikasi**: Sistem notifikasi real-time

## Persyaratan Sistem

### Software yang Diperlukan

- **Node.js**: Versi 18.0 atau lebih baru
- **npm**: Versi 8.0 atau lebih baru (biasanya sudah termasuk dengan Node.js)
- **MySQL**: Versi 8.0 atau lebih baru
- **Git**: Untuk version control

### Spesifikasi Hardware Minimum

- **RAM**: 4GB (8GB direkomendasikan)
- **Storage**: 2GB ruang kosong
- **Processor**: Dual-core 2.0GHz atau lebih cepat

### Sistem Operasi yang Didukung

- Ubuntu 20.04 LTS atau lebih baru
- Windows 10/11
- macOS 10.15 atau lebih baru

## Instalasi Database MySQL

### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation (opsional)
sudo mysql_secure_installation
```

### Windows

1. Download MySQL Installer dari [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Jalankan installer dan pilih "Developer Default"
3. Ikuti wizard instalasi
4. Catat username dan password root yang dibuat

### macOS

```bash
# Menggunakan Homebrew
brew install mysql

# Start MySQL service
brew services start mysql
```

### Konfigurasi Database

Setelah MySQL terinstal, buat database dan user untuk aplikasi:

```sql
-- Login ke MySQL sebagai root
mysql -u root -p

-- Buat database
CREATE DATABASE employee_dashboard;

-- Buat user khusus untuk aplikasi
CREATE USER 'dashboard_user'@'localhost' IDENTIFIED BY 'dashboard_password';

-- Berikan semua privilege pada database
GRANT ALL PRIVILEGES ON employee_dashboard.* TO 'dashboard_user'@'localhost';

-- Berikan privilege untuk membuat database (diperlukan untuk Prisma migrations)
GRANT CREATE ON *.* TO 'dashboard_user'@'localhost';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Keluar dari MySQL
EXIT;
```

## Setup Proyek

### Clone Repository

```bash
# Clone repository (jika menggunakan Git)
git clone <repository-url>
cd employee-dashboard

# Atau ekstrak file zip jika diberikan dalam bentuk archive
unzip employee-dashboard.zip
cd employee-dashboard
```

### Instalasi Dependencies

```bash
# Install semua dependencies
npm install
```

### Struktur Proyek

```
employee-dashboard/
├── prisma/                 # Database schema dan migrations
│   ├── schema.prisma      # Definisi database schema
│   └── migrations/        # File migrasi database
├── public/                # File statis
│   └── uploads/           # Direktori untuk file upload
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API endpoints
│   │   ├── admin/        # Halaman admin
│   │   ├── employee/     # Halaman karyawan
│   │   └── auth/         # Halaman autentikasi
│   ├── components/       # Komponen React
│   │   ├── ui/           # Komponen UI reusable
│   │   └── layout/       # Layout components
│   └── lib/              # Utilities dan konfigurasi
├── .env                  # Environment variables
├── package.json          # Dependencies dan scripts
└── README.md            # Dokumentasi proyek
```

## Konfigurasi Environment

Buat file `.env` di root direktori proyek:

```bash
# Database Configuration
DATABASE_URL="mysql://dashboard_user:dashboard_password@localhost:3306/employee_dashboard"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Penjelasan Environment Variables

- **DATABASE_URL**: Connection string untuk database MySQL
- **NEXTAUTH_SECRET**: Secret key untuk NextAuth.js (harus diganti di production)
- **NEXTAUTH_URL**: URL aplikasi (sesuaikan dengan domain production)

### Keamanan Environment Variables

⚠️ **Penting**: Jangan pernah commit file `.env` ke repository. Pastikan file ini ada di `.gitignore`.

Untuk production, gunakan secret yang kuat:

```bash
# Generate secret yang aman
openssl rand -base64 32
```

## Migrasi Database

### Generate Prisma Client

```bash
# Generate Prisma client
npx prisma generate
```

### Jalankan Migrasi

```bash
# Jalankan migrasi database
npx prisma migrate dev --name init
```

### Verifikasi Database

```bash
# Buka Prisma Studio untuk melihat database
npx prisma studio
```

Prisma Studio akan membuka di `http://localhost:5555` dan memungkinkan Anda melihat struktur database.

### Seed Data (Opsional)

Untuk membuat user admin pertama:

```bash
# Buat file seed.js di direktori prisma/
node -e "
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const prisma = new PrismaClient();
  
  const hashedPassword = await argon2.hash('admin123');
  
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: hashedPassword,
      fullName: 'Administrator',
      address: 'Jakarta',
      gender: 'MALE',
      nikKtp: '1234567890123456',
      phoneNumber: '081234567890',
      role: 'ADMIN',
      status: 'APPROVED'
    }
  });
  
  console.log('Admin user created');
  await prisma.\$disconnect();
}

main();
"
```

## Menjalankan Aplikasi

### Development Mode

```bash
# Jalankan aplikasi dalam mode development
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

### Production Mode

```bash
# Build aplikasi untuk production
npm run build

# Jalankan aplikasi production
npm start
```

### Menggunakan PM2 (Recommended untuk Production)

```bash
# Install PM2 globally
npm install -g pm2

# Build aplikasi
npm run build

# Jalankan dengan PM2
pm2 start npm --name "employee-dashboard" -- start

# Simpan konfigurasi PM2
pm2 save
pm2 startup
```

## Fitur-Fitur Sistem

### 1. Sistem Autentikasi

- **Login/Logout**: Menggunakan NextAuth.js dengan Credentials Provider
- **Password Hashing**: Menggunakan Argon2 untuk keamanan maksimal
- **Session Management**: Session berbasis JWT
- **Role-based Access**: Pemisahan akses admin dan karyawan

### 2. Dashboard Admin

- **Manajemen Karyawan**: Persetujuan registrasi, edit data karyawan
- **Manajemen Tugas**: Buat, edit, hapus, dan monitor tugas
- **Manajemen Keuangan**: Pencatatan pemasukan dan pengeluaran
- **Statistik**: Overview aktivitas sistem

### 3. Dashboard Karyawan

- **Tugas Saya**: Melihat dan mengumpulkan tugas yang ditugaskan
- **Upload Dokumen**: Upload file untuk pengumpulan tugas
- **Notifikasi**: Menerima notifikasi tugas baru
- **Profil**: Mengelola profil dan mengubah password

### 4. Sistem Upload File

- **Format Didukung**: PDF, DOC, DOCX, JPG, JPEG, PNG
- **Ukuran Maksimal**: 10MB per file
- **Keamanan**: Validasi tipe file dan ukuran
- **Storage**: File disimpan di direktori `public/uploads/`

### 5. Manajemen Keuangan

- **Kategori Pemasukan**: Gaji, Bonus, Komisi, Lainnya
- **Kategori Pengeluaran**: Operasional, Marketing, Peralatan, dll
- **Laporan**: Summary pemasukan, pengeluaran, dan saldo bersih
- **Filter**: Filter berdasarkan tanggal, kategori, dan tipe

## Panduan Penggunaan

### Untuk Administrator

#### Login Pertama Kali

1. Akses `http://localhost:3000`
2. Klik "Masuk"
3. Gunakan kredensial admin yang dibuat saat seed data
4. Anda akan diarahkan ke dashboard admin

#### Mengelola Karyawan

1. Klik menu "Kelola Karyawan"
2. Lihat daftar karyawan yang menunggu persetujuan
3. Klik "Setujui" atau "Tolak" untuk setiap registrasi
4. Edit data karyawan jika diperlukan

#### Membuat Tugas

1. Klik menu "Kelola Tugas"
2. Klik tombol "Buat Tugas Baru"
3. Isi detail tugas:
   - Judul tugas
   - Deskripsi
   - Tanggal deadline
   - Pilih karyawan (spesifik atau semua)
4. Klik "Simpan"

#### Mengelola Keuangan

1. Klik menu "Keuangan"
2. Untuk menambah transaksi:
   - Klik "Tambah Transaksi"
   - Pilih tipe (Pemasukan/Pengeluaran)
   - Pilih kategori
   - Isi jumlah dan deskripsi
   - Pilih tanggal
   - Klik "Simpan"
3. Gunakan filter untuk melihat transaksi tertentu

### Untuk Karyawan

#### Registrasi

1. Akses `http://localhost:3000`
2. Klik "Daftar di sini"
3. Isi semua data yang diperlukan:
   - Email dan password
   - Data personal (nama, alamat, NIK, dll)
   - Nomor rekening bank atau e-wallet
4. Klik "Daftar"
5. Tunggu persetujuan dari admin

#### Mengerjakan Tugas

1. Login dengan akun yang sudah disetujui
2. Klik menu "Tugas Saya"
3. Pilih tugas yang ingin dikerjakan
4. Klik "Kumpulkan Tugas"
5. Isi deskripsi pengerjaan
6. Upload dokumen jika diperlukan
7. Klik "Kirim"

#### Mengelola Profil

1. Klik menu "Profil Saya"
2. Edit informasi yang ingin diubah
3. Untuk mengubah password:
   - Klik "Ubah Password"
   - Masukkan password lama
   - Masukkan password baru
   - Konfirmasi password baru
   - Klik "Ubah Password"

## Troubleshooting

### Masalah Database

#### Error: "Access denied for user"

```bash
# Periksa kredensial database di .env
# Pastikan user memiliki privilege yang benar
mysql -u dashboard_user -p
```

#### Error: "Database does not exist"

```bash
# Buat database secara manual
mysql -u root -p
CREATE DATABASE employee_dashboard;
```

#### Error: "Connection refused"

```bash
# Pastikan MySQL service berjalan
sudo systemctl status mysql
sudo systemctl start mysql
```

### Masalah Aplikasi

#### Error: "Module not found"

```bash
# Hapus node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install
```

#### Error: "Port 3000 is already in use"

```bash
# Cari process yang menggunakan port 3000
lsof -i :3000

# Kill process tersebut
kill -9 <PID>

# Atau gunakan port lain
PORT=3001 npm run dev
```

#### Error: "Prisma Client not generated"

```bash
# Generate ulang Prisma client
npx prisma generate
```

### Masalah Upload File

#### File tidak bisa diupload

1. Periksa direktori `public/uploads/documents/` ada dan writable
2. Pastikan ukuran file tidak melebihi 10MB
3. Periksa format file yang didukung

```bash
# Buat direktori upload jika belum ada
mkdir -p public/uploads/documents
chmod 755 public/uploads/documents
```

### Masalah Performance

#### Aplikasi lambat

1. Periksa resource server (RAM, CPU)
2. Optimasi database dengan indexing
3. Gunakan connection pooling untuk database
4. Implementasi caching jika diperlukan

## Keamanan

### Password Security

Sistem menggunakan Argon2 untuk hashing password, yang merupakan standar keamanan terbaru dan pemenang Password Hashing Competition.

#### Konfigurasi Argon2

```javascript
// Default configuration yang digunakan
const hashedPassword = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
});
```

### File Upload Security

- Validasi tipe file berdasarkan MIME type
- Pembatasan ukuran file (10MB)
- File disimpan dengan nama unik (UUID)
- Tidak ada eksekusi file yang diupload

### Database Security

- Menggunakan prepared statements (Prisma ORM)
- Validasi input dengan Zod schema
- Principle of least privilege untuk database user

### Session Security

- JWT tokens dengan expiration
- Secure cookie settings
- CSRF protection

### Rekomendasi Production

1. **HTTPS**: Selalu gunakan HTTPS di production
2. **Environment Variables**: Gunakan secret yang kuat
3. **Database**: Gunakan database user dengan privilege minimal
4. **Firewall**: Batasi akses ke database hanya dari aplikasi
5. **Backup**: Implementasi backup database reguler
6. **Monitoring**: Setup monitoring dan logging
7. **Updates**: Selalu update dependencies secara berkala

### Security Headers

Tambahkan security headers di `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

**Catatan**: Panduan ini dibuat untuk membantu setup dan penggunaan Sistem Dashboard Karyawan. Jika mengalami masalah yang tidak tercakup dalam panduan ini, silakan hubungi tim development.

