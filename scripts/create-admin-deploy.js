const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function main() {
  try {
    // Get admin details from environment variables or use defaults
    const email = process.env.ADMIN_EMAIL || 'admin@valpro.com'
    const password = process.env.ADMIN_PASSWORD || 'admin123456'
    const fullName = process.env.ADMIN_NAME || 'Administrator'
    const phoneNumber = process.env.ADMIN_PHONE || null
    const address = process.env.ADMIN_ADDRESS || null
    const bankAccountNumber = process.env.ADMIN_BANK_ACCOUNT || null
    const ewalletNumber = process.env.ADMIN_EWALLET || null
    
    console.log('🚀 Valpro Portal - Admin Account Creator (Deploy Mode)')
    console.log('=====================================================\n')
    
    console.log('📧 Email:', email)
    console.log('👤 Nama:', fullName)
    console.log('🔑 Password:', '[HIDDEN]')
    console.log('📱 Telepon:', phoneNumber || 'Tidak diisi')
    console.log('🏠 Alamat:', address || 'Tidak diisi')
    console.log('🏦 Rekening:', bankAccountNumber || 'Tidak diisi')
    console.log('💳 E-wallet:', ewalletNumber || 'Tidak diisi')
    
    console.log('\n⏳ Membuat akun admin...')
    
    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1
    })
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingAdmin) {
      console.log('⚠️  Admin dengan email tersebut sudah ada! Mengupdate...')
      
      const updatedAdmin = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          fullName,
          phoneNumber,
          address,
          bankAccountNumber,
          ewalletNumber,
          role: 'ADMIN',
          status: 'APPROVED',
          updatedAt: new Date()
        }
      })
      
      console.log('✅ Admin berhasil diupdate!')
    } else {
      // Create new admin
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phoneNumber,
          address,
          bankAccountNumber,
          ewalletNumber,
          role: 'ADMIN',
          status: 'APPROVED'
        }
      })
      
      console.log('✅ Admin berhasil dibuat!')
    }
    
    console.log('\n🎉 Selesai! Admin account siap digunakan.')
    console.log('🌐 Akses aplikasi di: http://localhost:3000/auth/login')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
