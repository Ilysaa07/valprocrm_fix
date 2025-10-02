import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function generateSequentialInvoiceNumber(): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `INV-${yyyy}${mm}${dd}`;
  
  // Use transaction with serializable isolation for concurrency control
  return await prisma.$transaction(async (tx) => {
    // Find the highest invoice number for today with proper ordering
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
      // Extract the sequence number from the last invoice
      const lastSequenceMatch = lastInvoice.invoiceNumber.match(/-(\d{4})$/);
      if (lastSequenceMatch) {
        nextSequence = parseInt(lastSequenceMatch[1], 10) + 1;
      }
    }
    
    // Try to find next available number
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const sequenceStr = String(nextSequence + attempts).padStart(4, '0');
      const candidateNumber = `${datePrefix}-${sequenceStr}`;
      
      // Check if this number exists
      const existingCheck = await tx.invoice.findUnique({
        where: { invoiceNumber: candidateNumber },
        select: { id: true }
      });
      
      if (!existingCheck) {
        return candidateNumber;
      }
      
      attempts++;
    }
    
    // Fallback: use timestamp-based suffix if all attempts failed
    const timestamp = Date.now().toString().slice(-4);
    return `${datePrefix}-${timestamp}`;
  }, {
    isolationLevel: 'Serializable'
  });
}

// GET /api/invoices/next-number - Get next sequential invoice number
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both ADMIN and EMPLOYEE to get next invoice number
    const invoiceNumber = await generateSequentialInvoiceNumber();
    
    return NextResponse.json({ invoiceNumber });
  } catch (error) {
    console.error('Error generating next invoice number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
