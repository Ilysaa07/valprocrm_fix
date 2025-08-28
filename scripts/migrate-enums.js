/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting enum data migration (JS)...')

  // Use raw SQL to avoid enum client validation issues
  const upd1 = await prisma.$executeRawUnsafe(
    "UPDATE `attendance` SET `status`='PRESENT' WHERE `status` IN ('ONTIME','LATE')"
  )
  console.log('Attendance updated (ONTIME/LATE -> PRESENT):', upd1)

  const upd2 = await prisma.$executeRawUnsafe(
    "UPDATE `attendance` SET `status`='LEAVE' WHERE `status`='ABSENT'"
  )
  console.log('Attendance updated (ABSENT -> LEAVE):', upd2)

  const upd3 = await prisma.$executeRawUnsafe(
    "UPDATE `leave_requests` SET `type`='LEAVE' WHERE `type` IN ('ANNUAL','PERMIT','OTHER')"
  )
  console.log('LeaveRequest updated (ANNUAL/PERMIT/OTHER -> LEAVE):', upd3)

  console.log('Enum data migration completed (JS).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


