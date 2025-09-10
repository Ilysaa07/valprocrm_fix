# Environment Configuration Guide

## 🎯 **Single Environment File Strategy**

Proyek ini menggunakan **satu file `.env`** untuk semua konfigurasi environment, memastikan konsistensi dan kemudahan manajemen.

## 📁 **File Structure**

```
├── .env                    # Main environment file (unified)
├── env.example            # Template for reference
└── scripts/
    ├── unify-env.js       # Script to unify environment files
    └── verify-env.js      # Script to verify environment configuration
```

## 🔧 **Environment Variables**

### **Required Variables**
```env
# Database Configuration
DATABASE_URL="mysql://root@localhost:3306/valproerp"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Application Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **File Upload Configuration**
```env
UPLOAD_DIR="./storage/uploads"
MAX_FILE_SIZE="10485760"
```

### **Socket.IO Configuration**
```env
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### **Admin Account Configuration (Optional)**
```env
# Uncomment dan sesuaikan dengan kebutuhan Anda:
# ADMIN_EMAIL="admin@yourcompany.com"
# ADMIN_PASSWORD="your_secure_password_here"
# ADMIN_NAME="Your Name"
# ADMIN_PHONE="+6281234567890"
# ADMIN_ADDRESS="Your Address"
# ADMIN_BANK_ACCOUNT="1234567890"
# ADMIN_EWALLET="081234567890"
```

### **Email Configuration (Optional)**
```env
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
```

### **External Services (Optional)**
```env
# GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

## 🛠️ **Available Scripts**

| Script | Command | Description |
|--------|---------|-------------|
| Unify Environment | `npm run env:unify` | Menggabungkan semua konfigurasi menjadi satu file `.env` |
| Verify Environment | `npm run env:verify` | Memverifikasi konfigurasi environment |
| Create Admin | `npm run admin:create` | Membuat admin secara interaktif |
| Deploy Admin | `npm run admin:deploy` | Membuat admin dengan environment variables |

## 🚀 **Setup Instructions**

### **1. Initial Setup**
```bash
# Unify environment configuration
npm run env:unify

# Verify configuration
npm run env:verify
```

### **2. Customize Configuration**
1. Edit file `.env`
2. Uncomment variabel yang diperlukan
3. Sesuaikan nilai sesuai kebutuhan

### **3. Create Admin Account**
```bash
# Option 1: Interactive mode
npm run admin:create

# Option 2: Using environment variables
npm run admin:deploy
```

## 🔍 **Verification**

Jalankan script verifikasi untuk memastikan konfigurasi sudah benar:

```bash
npm run env:verify
```

Script ini akan mengecek:
- ✅ Keberadaan file `.env`
- ✅ Variabel yang diperlukan
- ✅ Konfigurasi admin
- ✅ File duplikat

## 📋 **Production Checklist**

- [ ] Update `DATABASE_URL` untuk production database
- [ ] Generate `NEXTAUTH_SECRET` yang aman
- [ ] Update `NEXTAUTH_URL` ke domain production
- [ ] Set `NODE_ENV="production"`
- [ ] Update `NEXT_PUBLIC_APP_URL` ke domain production
- [ ] Konfigurasi admin account
- [ ] Setup email configuration (jika diperlukan)
- [ ] Konfigurasi external services (jika diperlukan)

## ⚠️ **Security Notes**

1. **Never commit `.env` file** to version control
2. **Use strong secrets** for production
3. **Rotate secrets** regularly
4. **Use environment-specific** configurations
5. **Validate all inputs** from environment variables

## 🔧 **Troubleshooting**

### **Missing .env file**
```bash
npm run env:unify
```

### **Configuration issues**
```bash
npm run env:verify
```

### **Admin account problems**
```bash
# Check if admin variables are uncommented in .env
# Then run:
npm run admin:deploy
```

## 📞 **Support**

Jika mengalami masalah dengan konfigurasi environment, silakan:
1. Jalankan `npm run env:verify`
2. Periksa output untuk error messages
3. Pastikan semua variabel required sudah dikonfigurasi
4. Hubungi tim development jika diperlukan
