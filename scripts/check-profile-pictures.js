const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProfilePictures() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    })
    
    console.log('Users with profile pictures:')
    users.forEach(user => {
      console.log(`${user.fullName}: ${user.profilePicture || 'No picture'}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProfilePictures()
