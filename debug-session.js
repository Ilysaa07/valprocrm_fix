const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugSession() {
  try {
    console.log('🔍 Debug Session & User Data')
    console.log('============================\n')
    
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true
      }
    })
    
    console.log('📊 Users in database:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.fullName}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log('')
    })
    
    // Check invoices
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNo: true,
        clientName: true,
        createdById: true,
        createdAt: true
      }
    })
    
    console.log('📄 Invoices in database:')
    invoices.forEach((invoice, index) => {
      console.log(`${index + 1}. ID: ${invoice.id}`)
      console.log(`   Invoice No: ${invoice.invoiceNo}`)
      console.log(`   Client: ${invoice.clientName}`)
      console.log(`   Created By ID: ${invoice.createdById}`)
      console.log(`   Created: ${invoice.createdAt}`)
      console.log('')
    })
    
    // Check if any invoices have invalid createdById
    const invalidInvoices = invoices.filter(invoice => 
      !users.some(user => user.id === invoice.createdById)
    )
    
    if (invalidInvoices.length > 0) {
      console.log('⚠️  Invoices with invalid createdById:')
      invalidInvoices.forEach(invoice => {
        console.log(`   Invoice ${invoice.invoiceNo} created by non-existent user ${invoice.createdById}`)
      })
    } else {
      console.log('✅ All invoices have valid createdById')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSession()
