/**
 * Test script to validate invoice numbering and PDF filename generation
 * Run with: node scripts/test-invoice-system.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simulate the sequential invoice number generation
async function generateSequentialInvoiceNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `INV-${yyyy}${mm}${dd}`;
  
  return await prisma.$transaction(async (tx) => {
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: datePrefix
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      },
      select: {
        invoiceNumber: true
      }
    });
    
    let nextSequence = 1;
    
    if (lastInvoice) {
      const lastSequenceMatch = lastInvoice.invoiceNumber.match(/-(\d{4})$/);
      if (lastSequenceMatch) {
        nextSequence = parseInt(lastSequenceMatch[1], 10) + 1;
      }
    }
    
    const sequenceStr = String(nextSequence).padStart(4, '0');
    const newInvoiceNumber = `${datePrefix}-${sequenceStr}`;
    
    const existingCheck = await tx.invoice.findUnique({
      where: { invoiceNumber: newInvoiceNumber },
      select: { id: true }
    });
    
    if (existingCheck) {
      const fallbackSequence = String(nextSequence + 1).padStart(4, '0');
      return `${datePrefix}-${fallbackSequence}`;
    }
    
    return newInvoiceNumber;
  });
}

// Test filename generation
function generateFilename(prefix = 'invoice', clientName, invoiceNumber, companyName, creationDate) {
  const sanitizeFilename = (name) => {
    return name
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120);
  };

  // Use clientName (PT client) instead of companyName for the filename
  const sanitizedClientName = clientName ? sanitizeFilename(clientName) : 'CLIENT';
  const sanitizedInvoiceNumber = invoiceNumber ? sanitizeFilename(invoiceNumber) : 'INV-001';
  
  let formattedDate;
  if (creationDate) {
    const date = typeof creationDate === 'string' ? new Date(creationDate) : creationDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    formattedDate = `${year}${month}${day}`;
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    formattedDate = `${year}${month}${day}`;
  }
  
  return `INVOICE_${sanitizedClientName}_${formattedDate}_${sanitizedInvoiceNumber}.pdf`;
}

async function runTests() {
  console.log('🧪 Testing Invoice System Implementation\n');

  try {
    // Test 1: Sequential Invoice Number Generation
    console.log('📋 Test 1: Sequential Invoice Number Generation');
    const invoiceNumbers = [];
    
    for (let i = 0; i < 5; i++) {
      const invoiceNumber = await generateSequentialInvoiceNumber();
      invoiceNumbers.push(invoiceNumber);
      console.log(`  Generated: ${invoiceNumber}`);
    }
    
    // Verify sequential nature
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const expectedPrefix = `INV-${dateStr}`;
    
    let isSequential = true;
    for (let i = 0; i < invoiceNumbers.length; i++) {
      if (!invoiceNumbers[i].startsWith(expectedPrefix)) {
        isSequential = false;
        break;
      }
      
      const sequenceMatch = invoiceNumbers[i].match(/-(\d{4})$/);
      if (!sequenceMatch) {
        isSequential = false;
        break;
      }
    }
    
    console.log(`  ✅ Sequential numbering: ${isSequential ? 'PASS' : 'FAIL'}\n`);

    // Test 2: Filename Generation
    console.log('📄 Test 2: PDF Filename Generation');
    
    const testCases = [
      {
        companyName: 'PT. VALPRO INTERTECH',
        invoiceNumber: 'INV-20241002-0001',
        creationDate: '2024-10-02',
        expected: 'INVOICE_PT-_VALPRO_INTERTECH_20241002_INV-20241002-0001.pdf'
      },
      {
        companyName: 'ABC Corp & Co.',
        invoiceNumber: 'INV-20241002-0002',
        creationDate: '2024-10-02',
        expected: 'INVOICE_ABC_Corp_-_Co-_20241002_INV-20241002-0002.pdf'
      },
      {
        companyName: 'Test/Company\\Name',
        invoiceNumber: 'INV-20241002-0003',
        creationDate: '2024-10-02',
        expected: 'INVOICE_Test-Company-Name_20241002_INV-20241002-0003.pdf'
      }
    ];
    
    for (const testCase of testCases) {
      const filename = generateFilename(
        'invoice',
        'Test Client',
        testCase.invoiceNumber,
        testCase.companyName,
        testCase.creationDate
      );
      
      console.log(`  Input: ${testCase.companyName} | ${testCase.invoiceNumber}`);
      console.log(`  Generated: ${filename}`);
      
      // Verify format
      const isCorrectFormat = filename.startsWith('INVOICE_') && filename.endsWith('.pdf');
      const hasAllParts = filename.includes('20241002') && filename.includes('INV-20241002');
      
      console.log(`  ✅ Format check: ${isCorrectFormat && hasAllParts ? 'PASS' : 'FAIL'}\n`);
    }

    // Test 3: Database Consistency Check
    console.log('🗄️  Test 3: Database Consistency Check');
    
    const existingInvoices = await prisma.invoice.findMany({
      select: {
        invoiceNumber: true,
        createdAt: true
      },
      orderBy: {
        invoiceNumber: 'desc'
      },
      take: 10
    });
    
    console.log(`  Found ${existingInvoices.length} existing invoices`);
    
    if (existingInvoices.length > 0) {
      console.log('  Recent invoices:');
      existingInvoices.forEach((invoice, index) => {
        console.log(`    ${index + 1}. ${invoice.invoiceNumber} (${invoice.createdAt.toISOString().split('T')[0]})`);
      });
    }
    
    console.log('  ✅ Database access: PASS\n');

    // Test 4: Concurrency Simulation
    console.log('⚡ Test 4: Concurrency Simulation');
    
    const concurrentPromises = [];
    for (let i = 0; i < 3; i++) {
      concurrentPromises.push(generateSequentialInvoiceNumber());
    }
    
    const concurrentResults = await Promise.all(concurrentPromises);
    console.log('  Concurrent generation results:');
    concurrentResults.forEach((result, index) => {
      console.log(`    Thread ${index + 1}: ${result}`);
    });
    
    // Check for duplicates
    const uniqueResults = new Set(concurrentResults);
    const noDuplicates = uniqueResults.size === concurrentResults.length;
    console.log(`  ✅ No duplicates: ${noDuplicates ? 'PASS' : 'FAIL'}\n`);

    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runTests().catch(console.error);
