const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestProfilePicture() {
  try {
    // Update one user with a test profile picture
    const updatedUser = await prisma.user.update({
      where: { 
        email: 'ilyasameydiansyah@gmail.com' 
      },
      data: {
        profilePicture: '/uploads/profiles/default-avatar.png'
      }
    })
    
    console.log('Updated user with profile picture:', updatedUser.fullName)
    console.log('Profile picture URL:', updatedUser.profilePicture)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestProfilePicture()
