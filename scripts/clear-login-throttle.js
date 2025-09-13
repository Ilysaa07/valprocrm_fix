const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearLoginThrottle() {
  try {
    console.log('🧹 Valpro Portal - Clear Login Throttle')
    console.log('=====================================\n')
    
    // Get count before clearing
    const countBefore = await prisma.loginThrottle.count()
    console.log(`📊 Found ${countBefore} throttle records`)
    
    if (countBefore === 0) {
      console.log('✅ No throttle records to clear')
      return
    }
    
    // Clear all throttle records
    const result = await prisma.loginThrottle.deleteMany({})
    
    console.log(`✅ Cleared ${result.count} throttle records`)
    console.log('🎉 Login throttling has been reset!')
    console.log('🔓 Users can now attempt login again')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearLoginThrottle()
