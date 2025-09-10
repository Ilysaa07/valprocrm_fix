const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const readline = require('readline')

const prisma = new PrismaClient()

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Helper function to ask for password with confirmation
async function askPassword() {
  const password = await askQuestion('Masukkan password admin: ')
  const confirmPassword = await askQuestion('Konfirmasi password admin: ')
  
  if (password !== confirmPassword) {
    console.log('❌ Password tidak cocok! Silakan coba lagi.')
    return await askPassword()
  }
  
  if (password.length < 6) {
    console.log('❌ Password minimal 6 karakter! Silakan coba lagi.')
    return await askPassword()
  }
  
  return password
}

async function main() {
  try {
    console.log('🚀 Valpro Portal - Admin Account Creator')
    console.log('=====================================\n')
    
    // Get admin details
    const email = await askQuestion('Masukkan email admin: ')
    const fullName = await askQuestion('Masukkan nama lengkap admin: ')
    const password = await askPassword()
    
    // Optional fields
    const phoneNumber = await askQuestion('Masukkan nomor telepon (opsional): ') || null
    const address = await askQuestion('Masukkan alamat (opsional): ') || null
    const bankAccountNumber = await askQuestion('Masukkan nomor rekening bank (opsional): ') || null
    const ewalletNumber = await askQuestion('Masukkan nomor e-wallet (opsional): ') || null
    
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
      console.log('⚠️  Admin dengan email tersebut sudah ada!')
      const update = await askQuestion('Apakah Anda ingin mengupdate admin yang ada? (y/n): ')
      
      if (update.toLowerCase() === 'y' || update.toLowerCase() === 'yes') {
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
        console.log(`📧 Email: ${updatedAdmin.email}`)
        console.log(`👤 Nama: ${updatedAdmin.fullName}`)
        console.log(`🔑 Password: [HIDDEN]`)
        console.log(`📱 Telepon: ${updatedAdmin.phoneNumber || 'Tidak diisi'}`)
        console.log(`🏠 Alamat: ${updatedAdmin.address || 'Tidak diisi'}`)
        console.log(`🏦 Rekening: ${updatedAdmin.bankAccountNumber || 'Tidak diisi'}`)
        console.log(`💳 E-wallet: ${updatedAdmin.ewalletNumber || 'Tidak diisi'}`)
      } else {
        console.log('❌ Operasi dibatalkan.')
        return
      }
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
      console.log(`📧 Email: ${admin.email}`)
      console.log(`👤 Nama: ${admin.fullName}`)
      console.log(`🔑 Password: [HIDDEN]`)
      console.log(`📱 Telepon: ${admin.phoneNumber || 'Tidak diisi'}`)
      console.log(`🏠 Alamat: ${admin.address || 'Tidak diisi'}`)
      console.log(`🏦 Rekening: ${admin.bankAccountNumber || 'Tidak diisi'}`)
      console.log(`💳 E-wallet: ${admin.ewalletNumber || 'Tidak diisi'}`)
    }
    
    console.log('\n🎉 Selesai! Anda sekarang dapat login dengan akun admin tersebut.')
    console.log('🌐 Akses aplikasi di: http://localhost:3000/auth/login')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n❌ Operasi dibatalkan.')
  rl.close()
  await prisma.$disconnect()
  process.exit(0)
})

main()
