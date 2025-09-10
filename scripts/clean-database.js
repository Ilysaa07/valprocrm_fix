const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧹 Valpro Portal - Database Cleaner')
    console.log('==================================\n')
    
    console.log('⚠️  PERINGATAN: Script ini akan menghapus SEMUA data dari database!')
    console.log('   Pastikan Anda sudah melakukan backup jika diperlukan.\n')
    
    // Delete all data in the correct order to avoid foreign key constraints
    console.log('⏳ Menghapus data...')
    
    // Delete in reverse dependency order
    await prisma.taskSubmissionFile.deleteMany()
    console.log('✅ Task submission files deleted')
    
    await prisma.taskSubmission.deleteMany()
    console.log('✅ Task submissions deleted')
    
    await prisma.taskFeedback.deleteMany()
    console.log('✅ Task feedbacks deleted')
    
    await prisma.notification.deleteMany()
    console.log('✅ Notifications deleted')
    
    await prisma.task.deleteMany()
    console.log('✅ Tasks deleted')
    
    await prisma.attendance.deleteMany()
    console.log('✅ Attendance records deleted')
    
    await prisma.wfhLog.deleteMany()
    console.log('✅ WFH logs deleted')
    
    await prisma.leaveRequest.deleteMany()
    console.log('✅ Leave requests deleted')
    
    await prisma.invoiceHistory.deleteMany()
    console.log('✅ Invoice history deleted')
    
    await prisma.invoiceItem.deleteMany()
    console.log('✅ Invoice items deleted')
    
    await prisma.invoice.deleteMany()
    console.log('✅ Invoices deleted')
    
    await prisma.messageRead.deleteMany()
    console.log('✅ Message reads deleted')
    
    await prisma.messageDelete.deleteMany()
    console.log('✅ Message deletes deleted')
    
    await prisma.messageAttachment.deleteMany()
    console.log('✅ Message attachments deleted')
    
    await prisma.message.deleteMany()
    console.log('✅ Messages deleted')
    
    await prisma.conversationDelete.deleteMany()
    console.log('✅ Conversation deletes deleted')
    
    await prisma.conversationParticipant.deleteMany()
    console.log('✅ Conversation participants deleted')
    
    await prisma.conversation.deleteMany()
    console.log('✅ Conversations deleted')
    
    await prisma.documentDownloadLog.deleteMany()
    console.log('✅ Document download logs deleted')
    
    await prisma.documentAcl.deleteMany()
    console.log('✅ Document ACLs deleted')
    
    await prisma.documentTag.deleteMany()
    console.log('✅ Document tags deleted')
    
    await prisma.documentVersion.deleteMany()
    console.log('✅ Document versions deleted')
    
    await prisma.document.deleteMany()
    console.log('✅ Documents deleted')
    
    await prisma.folder.deleteMany()
    console.log('✅ Folders deleted')
    
    await prisma.contactActivity.deleteMany()
    console.log('✅ Contact activities deleted')
    
    await prisma.contact.deleteMany()
    console.log('✅ Contacts deleted')
    
    await prisma.projectMember.deleteMany()
    console.log('✅ Project members deleted')
    
    await prisma.projectMilestone.deleteMany()
    console.log('✅ Project milestones deleted')
    
    await prisma.projectTemplate.deleteMany()
    console.log('✅ Project templates deleted')
    
    await prisma.project.deleteMany()
    console.log('✅ Projects deleted')
    
    await prisma.eventReminder.deleteMany()
    console.log('✅ Event reminders deleted')
    
    await prisma.eventAttendee.deleteMany()
    console.log('✅ Event attendees deleted')
    
    await prisma.calendarEvent.deleteMany()
    console.log('✅ Calendar events deleted')
    
    await prisma.payrollComponent.deleteMany()
    console.log('✅ Payroll components deleted')
    
    await prisma.payroll.deleteMany()
    console.log('✅ Payrolls deleted')
    
    await prisma.payrollTemplate.deleteMany()
    console.log('✅ Payroll templates deleted')
    
    await prisma.transaction.deleteMany()
    console.log('✅ Transactions deleted')
    
    await prisma.officeLocation.deleteMany()
    console.log('✅ Office locations deleted')
    
    await prisma.user.deleteMany()
    console.log('✅ Users deleted')
    
    console.log('\n🎉 Database berhasil dibersihkan!')
    console.log('💡 Gunakan script create-admin.js untuk membuat akun admin baru.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
