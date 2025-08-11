import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: adminPassword,
      fullName: 'Administrator',
      address: 'Jl. Admin No. 1, Jakarta',
      gender: 'MALE',
      nikKtp: '1234567890123456',
      phoneNumber: '081234567890',
      bankAccountNumber: '1234567890',
      role: 'ADMIN',
      status: 'APPROVED'
    }
  })

  // Create approved employee
  const employeePassword = await bcrypt.hash('password123', 12)
  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: {},
    create: {
      email: 'employee@demo.com',
      password: employeePassword,
      fullName: 'John Doe',
      address: 'Jl. Karyawan No. 10, Jakarta',
      gender: 'MALE',
      nikKtp: '1234567890123457',
      phoneNumber: '081234567891',
      ewalletNumber: '081234567891',
      role: 'EMPLOYEE',
      status: 'APPROVED'
    }
  })

  // Create pending employee
  const pendingEmployee = await prisma.user.upsert({
    where: { email: 'pending@demo.com' },
    update: {},
    create: {
      email: 'pending@demo.com',
      password: employeePassword,
      fullName: 'Jane Smith',
      address: 'Jl. Pending No. 5, Jakarta',
      gender: 'FEMALE',
      nikKtp: '1234567890123458',
      phoneNumber: '081234567892',
      bankAccountNumber: '9876543210',
      role: 'EMPLOYEE',
      status: 'PENDING'
    }
  })

  // Create sample tasks
  const task1 = await prisma.task.upsert({
    where: { id: 'task-1' },
    update: {},
    create: {
      id: 'task-1',
      title: 'Laporan Bulanan',
      description: 'Buat laporan bulanan untuk bulan ini dengan detail lengkap mengenai progress dan pencapaian.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignment: 'SPECIFIC',
      assigneeId: employee.id,
      createdById: admin.id,
      status: 'NOT_STARTED'
    }
  })

  const task2 = await prisma.task.upsert({
    where: { id: 'task-2' },
    update: {},
    create: {
      id: 'task-2',
      title: 'Meeting Preparation',
      description: 'Persiapkan materi untuk meeting mingguan tim. Siapkan presentasi dan agenda.',
      assignment: 'ALL_EMPLOYEES',
      createdById: admin.id,
      status: 'IN_PROGRESS'
    }
  })

  const task3 = await prisma.task.upsert({
    where: { id: 'task-3' },
    update: {},
    create: {
      id: 'task-3',
      title: 'Update Database',
      description: 'Update database dengan data terbaru dan lakukan backup.',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      assignment: 'SPECIFIC',
      assigneeId: employee.id,
      createdById: admin.id,
      status: 'COMPLETED'
    }
  })

  // Create sample task submission
  await prisma.taskSubmission.upsert({
    where: {
      taskId_userId: {
        taskId: task3.id,
        userId: employee.id
      }
    },
    update: {},
    create: {
      taskId: task3.id,
      userId: employee.id,
      description: 'Database telah berhasil diupdate dan backup sudah dilakukan. Semua data sudah tersinkronisasi dengan baik.',
      documentUrl: 'https://drive.google.com/file/d/example'
    }
  })

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: employee.id,
        taskId: task1.id,
        title: 'Tugas Baru',
        message: 'Anda mendapat tugas baru: Laporan Bulanan',
        isRead: false
      },
      {
        userId: employee.id,
        taskId: task2.id,
        title: 'Tugas Baru',
        message: 'Anda mendapat tugas baru: Meeting Preparation',
        isRead: true
      },
      {
        userId: admin.id,
        title: 'Registrasi Karyawan Baru',
        message: 'Jane Smith telah mendaftar sebagai karyawan dan menunggu persetujuan.',
        isRead: false
      },
      {
        userId: admin.id,
        taskId: task3.id,
        title: 'Tugas Dikumpulkan',
        message: 'John Doe telah mengumpulkan tugas "Update Database"',
        isRead: false
      }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('Demo accounts:')
  console.log('Admin: admin@demo.com / password123')
  console.log('Employee: employee@demo.com / password123')
  console.log('Pending: pending@demo.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

