import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting enum data migration...')

  // Attendance: ONTIME/LATE -> PRESENT, ABSENT -> LEAVE
  const attendanceOntimeLate = await prisma.attendance.updateMany({
    where: { status: { in: ['ONTIME', 'LATE'] as any } },
    data: { status: 'PRESENT' as any },
  })
  console.log('Attendance updated (ONTIME/LATE -> PRESENT):', attendanceOntimeLate.count)

  const attendanceAbsent = await prisma.attendance.updateMany({
    where: { status: 'ABSENT' as any },
    data: { status: 'LEAVE' as any },
  })
  console.log('Attendance updated (ABSENT -> LEAVE):', attendanceAbsent.count)

  // LeaveRequest: ANNUAL/PERMIT/OTHER -> LEAVE
  const leaveLegacy = await prisma.leaveRequest.updateMany({
    where: { type: { in: ['ANNUAL', 'PERMIT', 'OTHER'] as any } },
    data: { type: 'LEAVE' as any },
  })
  console.log('LeaveRequest updated (ANNUAL/PERMIT/OTHER -> LEAVE):', leaveLegacy.count)

  console.log('Enum data migration completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



