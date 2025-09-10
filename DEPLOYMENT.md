# Valpro Portal - VPS Deployment Guide (Production)

## 1) Database Cleanup & Schema Sync

1. Backup dulu (opsional, via tool DB Anda)
2. Drop tabel yang tidak dipakai (dry run dulu, lalu eksekusi):
```bash
node scripts/db-drop-unused-tables.js
node scripts/db-drop-unused-tables.js --yes
```
3. Bersihkan data dummy/dev lalu sinkronkan schema:
```bash
npm run db:clean
npm run db:push
```

4. Buat admin (salah satu opsi):
```bash
# Interaktif (dev)
npm run admin:create

# Non-interaktif (prod)
export ADMIN_EMAIL="admin@yourcompany.com"
export ADMIN_PASSWORD="StrongPassword!"
export ADMIN_NAME="Admin"
npm run admin:deploy
```

## 2) Project Files Cleanup

Hapus build/log/caches lama:
```bash
node scripts/cleanup-project.js
```

Pastikan folder/halaman yang sudah tidak ada di navigasi juga dihapus dari repo.

## 3) Environment Setup (Production)

1. Salin `env.example` ke `.env` dan isi nilai produksi yang valid.
2. Pastikan tidak ada nilai dev/test di `.env`.
3. Gunakan user/password DB khusus production dengan hak minimal.

Variabel penting:
- `DATABASE_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (jika bootstrap admin via script)
- (Opsional) `MYSQLDUMP_PATH`, `MYSQL_CLI_PATH` di Windows

## 4) Build & Run (Production)

```bash
npm ci --only=production
npm run db:generate
npm run db:migrate
npm run build
npm run start
```

PM2 (opsional):
```bash
npm run pm2:start
```

## 5) Post-Deploy Checklist

- Login & NextAuth berjalan
- Role-based dashboard tampil benar
- Slip gaji & keuangan berfungsi
- (Jika diaktifkan) Backup/Restore API respons normal
- Tidak ada 5xx error di logs

## 6) Maintenance

- Perubahan schema: jalankan `npm run db:migrate` (atau `db:push` sesuai strategi)
- Bersihkan build lama sebelum rebuild: `node scripts/cleanup-project.js`
- Dokumentasikan perubahan `.env` dan kredensial secara aman
