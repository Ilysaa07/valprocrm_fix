const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedTasksSimple() {
  try {
    console.log('🌱 Starting simple task seeding...\n')

    // First, check if we have any users
    const userCount = await prisma.user.count()
    console.log(`👥 Found ${userCount} users in database`)

    if (userCount === 0) {
      console.log('⚠️  No users found. Creating a sample admin user first...')
      
      // Create a sample admin user
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@valpro.com',
          fullName: 'Admin Valpro',
          role: 'ADMIN',
          status: 'APPROVED',
          password: '$2a$10$dummy.hash.for.testing', // Dummy hash
          profilePicture: null
        }
      })
      console.log(`✅ Created admin user: ${adminUser.fullName}`)

      // Create a sample employee user
      const employeeUser = await prisma.user.create({
        data: {
          email: 'employee@valpro.com',
          fullName: 'Employee Valpro',
          role: 'EMPLOYEE',
          status: 'APPROVED',
          password: '$2a$10$dummy.hash.for.testing', // Dummy hash
          profilePicture: null
        }
      })
      console.log(`✅ Created employee user: ${employeeUser.fullName}`)
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, role: true }
    })

    // Simple task data
    const simpleTasks = [
      {
        title: "Laporan Harian Penjualan",
        description: "Buat laporan penjualan harian untuk divisi marketing",
        priority: "HIGH",
        assignment: "ALL_EMPLOYEES",
        status: "NOT_STARTED"
      },
      {
        title: "Update Database Customer",
        description: "Perbarui informasi customer di database utama",
        priority: "MEDIUM",
        assignment: "SPECIFIC",
        status: "IN_PROGRESS"
      },
      {
        title: "Meeting Tim Mingguan",
        description: "Jadwalkan dan laksanakan meeting tim mingguan",
        priority: "LOW",
        assignment: "ALL_EMPLOYEES",
        status: "COMPLETED"
      },
      {
        title: "Backup Data Penting",
        description: "Lakukan backup data penting perusahaan",
        priority: "URGENT",
        assignment: "SPECIFIC",
        status: "PENDING_VALIDATION"
      },
      {
        title: "Analisis Performa Website",
        description: "Analisis performa website dan berikan rekomendasi",
        priority: "MEDIUM",
        assignment: "ALL_EMPLOYEES",
        status: "REVISION"
      },
      {
        title: "Pelatihan Karyawan Baru",
        description: "Siapkan materi pelatihan untuk karyawan baru",
        priority: "HIGH",
        assignment: "SPECIFIC",
        status: "NOT_STARTED"
      },
      {
        title: "Audit Keuangan Bulanan",
        description: "Lakukan audit keuangan untuk bulan ini",
        priority: "HIGH",
        assignment: "SPECIFIC",
        status: "IN_PROGRESS"
      },
      {
        title: "Update SOP Perusahaan",
        description: "Perbarui Standard Operating Procedure perusahaan",
        priority: "MEDIUM",
        assignment: "ALL_EMPLOYEES",
        status: "NOT_STARTED"
      },
      {
        title: "Maintenance Server",
        description: "Jadwalkan maintenance server produksi",
        priority: "URGENT",
        assignment: "SPECIFIC",
        status: "PENDING_VALIDATION"
      },
      {
        title: "Evaluasi Kinerja Tim",
        description: "Lakukan evaluasi kinerja tim untuk kuartal ini",
        priority: "LOW",
        assignment: "ALL_EMPLOYEES",
        status: "COMPLETED"
      }
    ]

    console.log(`\n📋 Creating ${simpleTasks.length} simple tasks...\n`)

    let createdCount = 0
    const adminUsers = users.filter(u => u.role === 'ADMIN')
    const employeeUsers = users.filter(u => u.role === 'EMPLOYEE')

    for (let i = 0; i < simpleTasks.length; i++) {
      const taskData = simpleTasks[i]
      
      try {
        // Assign specific users for SPECIFIC assignment tasks
        let assigneeId = null
        if (taskData.assignment === 'SPECIFIC') {
          const assignableUsers = i % 2 === 0 ? adminUsers : employeeUsers
          if (assignableUsers.length > 0) {
            assigneeId = assignableUsers[i % assignableUsers.length].id
          }
        }

        // Choose a random creator
        const creator = users[i % users.length]

        // Set due date (1-30 days from now)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + (i % 30) + 1)

        const task = await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            assignment: taskData.assignment,
            assigneeId: assigneeId,
            status: taskData.status,
            dueDate: dueDate,
            tags: JSON.stringify(['sample', 'dummy', 'test']),
            createdById: creator.id
          }
        })

        const assigneeName = assigneeId ? 
          users.find(u => u.id === assigneeId)?.fullName : 
          'All Employees'

        console.log(`✅ ${i + 1}. "${task.title}" (${task.status}) - Assigned to: ${assigneeName}`)
        createdCount++

      } catch (error) {
        console.error(`❌ Error creating task "${taskData.title}":`, error.message)
      }
    }

    console.log(`\n🎉 Simple task seeding completed!`)
    console.log(`✅ Successfully created: ${createdCount} tasks`)

    // Show final summary
    const totalTasks = await prisma.task.count()
    console.log(`\n📊 Total tasks in database: ${totalTasks}`)

    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    console.log(`\n📈 Tasks by status:`)
    statusCounts.forEach(item => {
      console.log(`  - ${item.status}: ${item._count.id} tasks`)
    })

  } catch (error) {
    console.error('❌ Error during simple task seeding:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedTasksSimple()

