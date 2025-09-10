const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧪 Testing Admin Creation...')
    
    // Test data
    const email = 'test@admin.com'
    const password = 'test123456'
    const fullName = 'Test Administrator'
    
    console.log('📧 Email:', email)
    console.log('👤 Nama:', fullName)
    console.log('🔑 Password:', '[HIDDEN]')
    
    // Hash password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    })
    
    // Create admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'ADMIN',
        status: 'APPROVED'
      }
    })
    
    console.log('✅ Test admin created successfully!')
    console.log('ID:', admin.id)
    console.log('Email:', admin.email)
    console.log('Name:', admin.fullName)
    console.log('Role:', admin.role)
    console.log('Status:', admin.status)
    
    // Test password verification
    const isValid = await argon2.verify(admin.password, password)
    console.log('🔐 Password verification:', isValid ? '✅ Valid' : '❌ Invalid')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
