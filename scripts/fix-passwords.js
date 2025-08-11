const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting password fix script...')
  
  // Get all users
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users`)
  
  let fixedCount = 0
  
  for (const user of users) {
    try {
      // Try to verify with bcrypt first to check if it's a bcrypt hash
      let isBcryptHash = false
      
      try {
        // If this is a bcrypt hash, this will succeed
        if (user.password.startsWith('$2')) {
          isBcryptHash = true
        }
      } catch (e) {
        // Not a bcrypt hash, continue
      }
      
      if (isBcryptHash) {
        console.log(`Fixing password for user: ${user.email}`)
        
        // Create a new argon2 hash from the default password
        // In a real scenario, you would need to ask users to reset their passwords
        // This is just for demo purposes
        const newPassword = 'password123' // Default password for demo
        const newHash = await argon2.hash(newPassword)
        
        // Update the user's password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
        })
        
        fixedCount++
        console.log(`Fixed password for ${user.email}`)
      } else {
        console.log(`Password for ${user.email} is already using argon2, skipping`)
      }
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error)
    }
  }
  
  console.log(`Fixed ${fixedCount} passwords`)
  console.log('Password fix script completed')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })