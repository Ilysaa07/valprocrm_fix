const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...')
  
  try {
    // Delete data in reverse dependency order
    console.log('Deleting notifications...')
    await prisma.notification.deleteMany()
    
    console.log('Deleting task feedbacks...')
    await prisma.taskFeedback.deleteMany()
    
    console.log('Deleting task submission files...')
    await prisma.taskSubmissionFile.deleteMany()
    
    console.log('Deleting task submissions...')
    await prisma.taskSubmission.deleteMany()
    
    console.log('Deleting tasks...')
    await prisma.task.deleteMany()
    
    console.log('Deleting attendance records...')
    await prisma.attendance.deleteMany()
    
    console.log('Deleting WFH logs...')
    await prisma.wfhLog.deleteMany()
    
    console.log('Deleting leave requests...')
    await prisma.leaveRequest.deleteMany()
    
    // Delete chat data if exists
    console.log('Deleting chat data...')
    await prisma.messageDelete.deleteMany()
    await prisma.messageRead.deleteMany()
    await prisma.messageAttachment.deleteMany()
    await prisma.message.deleteMany()
    await prisma.conversationDelete.deleteMany()
    await prisma.conversationParticipant.deleteMany()
    await prisma.conversation.deleteMany()
    
    // Delete project data if exists
    console.log('Deleting project data...')
    await prisma.projectMilestone.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()
    await prisma.contactActivity.deleteMany()
    await prisma.contact.deleteMany()
    
    // Delete users (except admin)
    console.log('Deleting non-admin users...')
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    })
    
    console.log('✅ Database cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@valpro.com' },
      update: {},
      create: {
        email: 'admin@valpro.com',
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJvJYpYcFvtdA4S7W.C', // password: admin123
        fullName: 'Admin Valpro',
        role: 'ADMIN',
        status: 'APPROVED',
        phoneNumber: '+6281234567890',
        address: 'Jakarta, Indonesia'
      }
    })
    
    // Create sample employee
    const employeeUser = await prisma.user.upsert({
      where: { email: 'employee@valpro.com' },
      update: {},
      create: {
        email: 'employee@valpro.com',
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJvJYpYcFvtdA4S7W.C', // password: employee123
        fullName: 'John Doe',
        role: 'EMPLOYEE',
        status: 'APPROVED',
        phoneNumber: '+6281234567891',
        address: 'Bandung, Indonesia'
      }
    })
    
    // Create sample tasks
    const sampleTasks = [
      {
        title: 'Setup Development Environment',
        description: 'Install and configure all necessary development tools and dependencies',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'HIGH',
        assignment: 'SPECIFIC',
        createdById: adminUser.id,
        assigneeId: employeeUser.id,
        status: 'NOT_STARTED'
      },
      {
        title: 'Database Migration',
        description: 'Create and test database migration scripts for production deployment',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        priority: 'MEDIUM',
        assignment: 'ALL_EMPLOYEES',
        createdById: adminUser.id,
        status: 'NOT_STARTED'
      },
      {
        title: 'Code Review',
        description: 'Review and test all new features before deployment',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'URGENT',
        assignment: 'SPECIFIC',
        createdById: adminUser.id,
        assigneeId: employeeUser.id,
        status: 'IN_PROGRESS'
      }
    ]
    
    for (const task of sampleTasks) {
      await prisma.task.create({
        data: task
      })
    }
    
    // Create sample notifications
    const sampleNotifications = [
      {
        userId: employeeUser.id,
        title: 'Welcome to Valpro Portal',
        message: 'Welcome to the Valpro Portal! Please complete your profile and check your assigned tasks.',
        isRead: false
      },
      {
        userId: adminUser.id,
        title: 'System Update',
        message: 'The system has been updated with new features. Please review the changelog.',
        isRead: false
      }
    ]
    
    for (const notification of sampleNotifications) {
      await prisma.notification.create({
        data: notification
      })
    }
    
    // Create sample attendance record
    await prisma.attendance.create({
      data: {
        userId: employeeUser.id,
        status: 'PRESENT',
        checkInTime: new Date(),
        checkInLatitude: -6.2088,
        checkInLongitude: 106.8456,
        notes: 'Regular check-in'
      }
    })
    
    console.log('✅ Database seeding completed!')
    console.log('📧 Admin login: admin@valpro.com / admin123')
    console.log('📧 Employee login: employee@valpro.com / employee123')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  try {
    await cleanupDatabase()
    await seedDatabase()
    console.log('🎉 Database cleanup and seeding completed successfully!')
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { cleanupDatabase, seedDatabase }



