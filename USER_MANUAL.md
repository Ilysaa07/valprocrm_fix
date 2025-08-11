# Manual Pengguna Sistem Dashboard Karyawan

## Daftar Isi

1. [Pengenalan Sistem](#pengenalan-sistem)
2. [Akses Sistem](#akses-sistem)
3. [Panduan untuk Administrator](#panduan-untuk-administrator)
4. [Panduan untuk Karyawan](#panduan-untuk-karyawan)
5. [Fitur Upload Dokumen](#fitur-upload-dokumen)
6. [Manajemen Profil](#manajemen-profil)
7. [Tips dan Trik](#tips-dan-trik)
8. [FAQ](#faq)

## Pengenalan Sistem

Sistem Dashboard Karyawan adalah platform manajemen terintegrasi yang dirancang untuk memudahkan pengelolaan karyawan, tugas, dan keuangan perusahaan. Sistem ini memiliki dua tingkat akses utama:

- **Administrator**: Memiliki akses penuh untuk mengelola karyawan, tugas, dan keuangan
- **Karyawan**: Dapat melihat tugas yang ditugaskan, mengumpulkan hasil kerja, dan mengelola profil pribadi

### Keunggulan Sistem

- Interface yang user-friendly dan responsif
- Keamanan tinggi dengan enkripsi Argon2
- Sistem notifikasi real-time
- Upload dokumen yang aman
- Laporan keuangan yang komprehensif
- Akses berbasis peran (role-based access)

## Akses Sistem

### URL Sistem

Akses sistem melalui browser dengan URL: `http://[server-address]:3000`

### Browser yang Didukung

- Google Chrome (versi terbaru)
- Mozilla Firefox (versi terbaru)
- Microsoft Edge (versi terbaru)
- Safari (versi terbaru)

### Login

1. Buka browser dan akses URL sistem
2. Anda akan diarahkan ke halaman login
3. Masukkan email dan password
4. Klik tombol "Masuk"
5. Sistem akan mengarahkan Anda ke dashboard sesuai dengan role

### Registrasi (Untuk Karyawan Baru)

1. Di halaman login, klik "Daftar di sini"
2. Isi formulir registrasi dengan lengkap:
   - **Email**: Gunakan email aktif yang valid
   - **Password**: Minimal 6 karakter, gunakan kombinasi huruf dan angka
   - **Nama Lengkap**: Sesuai dengan dokumen resmi
   - **Alamat**: Alamat lengkap tempat tinggal
   - **Jenis Kelamin**: Pilih sesuai
   - **NIK KTP**: 16 digit nomor KTP
   - **Nomor HP**: Nomor yang dapat dihubungi
   - **Nomor Rekening Bank**: Untuk keperluan payroll
   - **Nomor E-Wallet**: Alternatif pembayaran (opsional)
3. Klik "Daftar"
4. Tunggu persetujuan dari administrator
5. Anda akan menerima notifikasi melalui email setelah akun disetujui

## Panduan untuk Administrator

### Dashboard Admin

Setelah login sebagai administrator, Anda akan melihat dashboard dengan informasi:

- **Total Karyawan**: Jumlah karyawan yang terdaftar
- **Menunggu Persetujuan**: Karyawan yang belum disetujui
- **Karyawan Aktif**: Karyawan yang sudah disetujui
- **Total Tugas**: Jumlah tugas yang telah dibuat
- **Status Tugas**: Progress penyelesaian tugas

### Mengelola Karyawan

#### Persetujuan Registrasi

1. Klik menu "Kelola Karyawan" di sidebar
2. Anda akan melihat daftar karyawan dengan status berbeda:
   - **Pending**: Menunggu persetujuan
   - **Approved**: Sudah disetujui
   - **Rejected**: Ditolak
3. Untuk karyawan dengan status "Pending":
   - Klik tombol "Lihat Detail" untuk melihat informasi lengkap
   - Klik "Setujui" untuk menyetujui registrasi
   - Klik "Tolak" jika ada masalah dengan data

#### Edit Data Karyawan

1. Di halaman "Kelola Karyawan"
2. Klik ikon edit (pensil) pada karyawan yang ingin diedit
3. Ubah data yang diperlukan
4. Klik "Simpan Perubahan"

#### Menghapus Karyawan

1. Klik ikon hapus (tempat sampah) pada karyawan
2. Konfirmasi penghapusan
3. Data karyawan akan dihapus permanen

### Mengelola Tugas

#### Membuat Tugas Baru

1. Klik menu "Kelola Tugas"
2. Klik tombol "Buat Tugas Baru"
3. Isi formulir tugas:
   - **Judul**: Nama tugas yang jelas dan deskriptif
   - **Deskripsi**: Penjelasan detail tentang tugas
   - **Tanggal Deadline**: Batas waktu penyelesaian
   - **Jenis Penugasan**:
     - **Karyawan Spesifik**: Pilih karyawan tertentu
     - **Semua Karyawan**: Tugas untuk semua karyawan aktif
4. Klik "Simpan"

#### Melihat Status Tugas

1. Di halaman "Kelola Tugas", Anda dapat melihat:
   - Daftar semua tugas
   - Status setiap tugas (Belum Dimulai, Sedang Dikerjakan, Menunggu Validasi, Selesai)
   - Karyawan yang ditugaskan
   - Tanggal deadline
2. Klik "Lihat Detail" untuk melihat informasi lengkap dan hasil pengumpulan
3. Untuk tugas dengan status "Menunggu Validasi":
   - Klik tombol "Validasi" untuk memeriksa hasil pengumpulan tugas
   - Anda dapat memberikan pesan validasi (opsional)
   - Pilih "Validasi & Selesaikan" untuk mengubah status menjadi "Selesai"
   - Pilih "Kembalikan ke Proses" jika tugas perlu diperbaiki

#### Edit dan Hapus Tugas

1. Klik ikon edit untuk mengubah detail tugas
2. Klik ikon hapus untuk menghapus tugas
3. Perubahan akan mempengaruhi semua karyawan yang ditugaskan

### Manajemen Keuangan

#### Menambah Transaksi

1. Klik menu "Keuangan"
2. Klik tombol "Tambah Transaksi"
3. Isi formulir transaksi:
   - **Tipe**: Pilih Pemasukan atau Pengeluaran
   - **Kategori**: Pilih kategori yang sesuai
     - Pemasukan: Gaji, Bonus, Komisi, Lainnya
     - Pengeluaran: Perlengkapan Kantor, Utilitas, Sewa, Marketing, dll
   - **Jumlah**: Masukkan nominal dalam Rupiah
   - **Deskripsi**: Keterangan detail transaksi
   - **Tanggal**: Tanggal transaksi
4. Klik "Simpan"

#### Melihat Laporan Keuangan

1. Di halaman "Keuangan", Anda dapat melihat:
   - **Total Pemasukan**: Jumlah semua pemasukan
   - **Total Pengeluaran**: Jumlah semua pengeluaran
   - **Saldo Bersih**: Selisih pemasukan dan pengeluaran
2. Gunakan filter untuk melihat data berdasarkan:
   - Tipe transaksi
   - Kategori
   - Rentang tanggal

#### Edit dan Hapus Transaksi

1. Di tabel transaksi, klik ikon edit untuk mengubah data
2. Klik ikon hapus untuk menghapus transaksi
3. Perubahan akan langsung mempengaruhi laporan keuangan

### Notifikasi

Administrator akan menerima notifikasi untuk:
- Registrasi karyawan baru
- Pengumpulan tugas oleh karyawan yang memerlukan validasi
- Update status tugas

## Panduan untuk Karyawan

### Dashboard Karyawan

Dashboard karyawan menampilkan:
- **Tugas Saya**: Ringkasan tugas yang ditugaskan
- **Tugas Terbaru**: Tugas yang baru diterima
- **Statistik**: Progress penyelesaian tugas
- **Notifikasi**: Pemberitahuan terbaru

### Melihat dan Mengerjakan Tugas

#### Melihat Daftar Tugas

1. Klik menu "Tugas Saya"
2. Anda akan melihat daftar tugas dengan informasi:
   - Judul tugas
   - Deskripsi
   - Tanggal deadline
   - Status (Belum Dimulai, Sedang Dikerjakan, Menunggu Validasi, Selesai)
   - Pembuat tugas

#### Mengumpulkan Tugas

1. Klik tombol "Kumpulkan" pada tugas yang ingin diselesaikan
2. Isi formulir pengumpulan:
   - **Deskripsi**: Jelaskan hasil pekerjaan Anda
   - **Upload Dokumen**: Lampirkan file pendukung (opsional)
3. Klik "Kirim"
4. Status tugas akan berubah menjadi "Menunggu Validasi"
5. Admin akan memeriksa tugas yang dikumpulkan
6. Setelah divalidasi oleh admin, status akan berubah menjadi "Selesai"

#### Update Pengumpulan Tugas

1. Jika tugas sudah dikumpulkan, Anda masih bisa mengupdate
2. Klik "Update Pengumpulan"
3. Ubah deskripsi atau ganti file yang diupload
4. Klik "Update"

### Notifikasi

Karyawan akan menerima notifikasi untuk:
- Tugas baru yang ditugaskan
- Perubahan deadline tugas
- Konfirmasi pengumpulan tugas
- Hasil validasi tugas oleh admin

## Fitur Upload Dokumen

### Format File yang Didukung

- **Dokumen**: PDF, DOC, DOCX
- **Gambar**: JPG, JPEG, PNG

### Ukuran File Maksimal

- Maksimal 10MB per file

### Cara Upload

1. Klik area upload atau tombol "Pilih File"
2. Pilih file dari komputer Anda
3. File akan otomatis diupload dan divalidasi
4. Jika berhasil, nama file akan ditampilkan
5. Untuk mengganti file, klik tombol "X" dan upload file baru

### Tips Upload

- Pastikan file tidak corrupt atau rusak
- Gunakan nama file yang deskriptif
- Kompres file jika ukuran terlalu besar
- Scan dokumen dengan kualitas yang baik untuk file PDF

## Manajemen Profil

### Mengakses Profil

1. Klik menu "Profil Saya" (untuk karyawan)
2. Atau klik nama pengguna di header dan pilih "Profil Saya" (untuk admin)

### Mengubah Informasi Profil

1. Di halaman profil, Anda dapat mengubah:
   - Nama lengkap
   - Alamat
   - Nomor HP
   - Nomor rekening bank
   - Nomor e-wallet
2. Klik "Perbarui Profil" untuk menyimpan perubahan

### Mengubah Password

1. Di halaman profil, klik "Ubah Password"
2. Masukkan password lama
3. Masukkan password baru (minimal 6 karakter)
4. Konfirmasi password baru
5. Klik "Ubah Password"

### Keamanan Password

- Gunakan kombinasi huruf besar, huruf kecil, dan angka
- Hindari menggunakan informasi personal (nama, tanggal lahir)
- Ganti password secara berkala
- Jangan bagikan password kepada orang lain

## Tips dan Trik

### Untuk Administrator

1. **Backup Data**: Lakukan backup database secara berkala
2. **Monitor Aktivitas**: Periksa dashboard secara rutin untuk memantau aktivitas
3. **Komunikasi**: Gunakan deskripsi tugas yang jelas dan detail
4. **Deadline**: Berikan waktu yang realistis untuk penyelesaian tugas
5. **Kategori Keuangan**: Gunakan kategori yang konsisten untuk memudahkan laporan

### Untuk Karyawan

1. **Cek Notifikasi**: Periksa notifikasi secara berkala
2. **Deadline**: Perhatikan tanggal deadline tugas
3. **Dokumentasi**: Simpan copy dokumen yang diupload
4. **Komunikasi**: Hubungi admin jika ada kesulitan dengan tugas
5. **Profil**: Pastikan informasi profil selalu update

### Umum

1. **Browser**: Gunakan browser terbaru untuk performa optimal
2. **Internet**: Pastikan koneksi internet stabil saat upload file
3. **Logout**: Selalu logout setelah selesai menggunakan sistem
4. **Password**: Jangan simpan password di browser umum
5. **Akses**: Jangan berikan akses akun kepada orang lain

## FAQ

### Pertanyaan Umum

**Q: Bagaimana jika lupa password?**
A: Hubungi administrator untuk reset password. Fitur reset password otomatis akan ditambahkan di versi mendatang.

**Q: Apakah bisa mengakses sistem dari mobile?**
A: Ya, sistem responsive dan dapat diakses dari smartphone atau tablet.

**Q: Bagaimana jika file tidak bisa diupload?**
A: Periksa format file, ukuran (max 10MB), dan koneksi internet. Jika masih bermasalah, hubungi administrator.

**Q: Apakah data aman?**
A: Ya, sistem menggunakan enkripsi Argon2 untuk password dan validasi ketat untuk upload file.

### Untuk Administrator

**Q: Bagaimana cara backup data?**
A: Gunakan command `mysqldump` untuk backup database MySQL. Backup juga direktori `public/uploads/` untuk file yang diupload.

**Q: Bisakah menambah kategori keuangan baru?**
A: Saat ini kategori sudah ditetapkan dalam sistem. Untuk menambah kategori baru, perlu modifikasi kode.

**Q: Bagaimana melihat aktivitas karyawan?**
A: Lihat di dashboard admin untuk statistik umum, atau di halaman "Kelola Tugas" untuk detail pengumpulan tugas.

### Untuk Karyawan

**Q: Bisakah melihat tugas yang sudah selesai?**
A: Ya, di halaman "Tugas Saya" Anda dapat melihat semua tugas termasuk yang sudah selesai.

**Q: Bagaimana jika salah upload file?**
A: Anda bisa mengupdate pengumpulan tugas dan mengganti file yang diupload.

**Q: Berapa lama proses validasi tugas oleh admin?**
A: Proses validasi tugas oleh admin tidak memiliki batas waktu tertentu. Admin akan memeriksa tugas yang dikumpulkan dan memberikan validasi sesuai dengan prioritas dan beban kerja. Anda akan menerima notifikasi saat tugas telah divalidasi.

**Q: Apa yang terjadi jika tugas saya dikembalikan oleh admin?**
A: Jika admin mengembalikan tugas Anda, status tugas akan berubah menjadi "Sedang Dikerjakan". Anda perlu memperbaiki tugas sesuai dengan pesan validasi dari admin, kemudian mengumpulkan kembali tugas tersebut.

**Q: Apakah bisa mengerjakan tugas secara tim?**
A: Sistem saat ini dirancang untuk tugas individual. Untuk tugas tim, koordinasi dapat dilakukan di luar sistem.

### Troubleshooting

**Q: Halaman tidak loading dengan benar**
A: 
1. Refresh halaman (Ctrl+F5)
2. Clear cache browser
3. Coba browser lain
4. Periksa koneksi internet

**Q: Error saat login**
A:
1. Periksa email dan password
2. Pastikan akun sudah disetujui admin (untuk karyawan)
3. Hubungi administrator jika masih bermasalah

**Q: File upload gagal**
A:
1. Periksa ukuran file (max 10MB)
2. Periksa format file (PDF, DOC, DOCX, JPG, PNG)
3. Periksa koneksi internet
4. Coba file lain untuk memastikan

---

**Catatan**: Manual ini akan terus diperbarui seiring dengan pengembangan sistem. Jika ada pertanyaan yang tidak tercakup dalam manual ini, silakan hubungi administrator sistem.

