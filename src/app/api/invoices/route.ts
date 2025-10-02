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
    
    // Try to create invoice numbers until we find one that doesn't exist
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

// GET /api/invoices - Get all invoices (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      },
      orderBy: [
        {
          invoiceNumber: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice (admin or employee creating own)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow ADMIN or EMPLOYEE to create invoices. EMPLOYEE will always be owner.

    const body = await request.json();
    const {
      invoiceNumber,
      date,
      dueDate,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      clientName,
      clientAddress,
      clientPhone,
      clientEmail,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxRate,
      taxAmount,
      shippingAmount,
      total,
      amountPaid,
      balanceDue,
      notes,
      status
    } = body as Record<string, unknown>;

    // Validate required fields (invoiceNumber is optional - will be generated if not provided)
    if (!date || !dueDate || !companyName || !clientName || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if ((items as unknown[]).length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    type NewSubItem = { name: string; description?: string; quantity: number; unitPrice: number; total: number };
    type NewItem = { description: string; quantity: number; unitPrice: number; total: number; subItems?: NewSubItem[] };
    const typedItems: NewItem[] = (items as unknown[]).map((it) => {
      const i = it as any;
      return {
        description: String(i.description || ''),
        quantity: Number(i.quantity || 0),
        unitPrice: Number(i.unitPrice || 0),
        total: Number(i.total || 0),
        subItems: Array.isArray(i.subItems)
          ? (i.subItems as unknown[]).map((s) => {
              const si = s as Partial<NewSubItem>;
              return {
                name: String(si.name || ''),
                description: si.description ? String(si.description) : undefined,
                quantity: Number(si.quantity || 0),
                unitPrice: Number(si.unitPrice || 0),
                total: Number(si.total || 0),
              } as NewSubItem;
            })
          : undefined,
      };
    });

    // Calculate payment status automatically
    const numericAmountPaid = Number(amountPaid ?? 0);
    const numericTotal = Number(total ?? 0);
    let finalStatus = 'DRAFT';
    
    if (numericAmountPaid >= numericTotal && numericTotal > 0) {
      finalStatus = 'PAID';
    } else if (numericAmountPaid === 0) {
      finalStatus = 'DRAFT';
    } else if (numericAmountPaid > 0 && numericAmountPaid < numericTotal) {
      finalStatus = 'PARTIAL';
    }

    // Normalize and validate status to Prisma enum
    const allowedStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'PARTIAL'] as const;
    const normalizedStatus = String((status as string | undefined) || finalStatus).toUpperCase();
    const validatedStatus = (allowedStatuses as readonly string[]).includes(normalizedStatus) ? normalizedStatus : finalStatus;

    // Sanitize numerics
    const numericSubtotal = Number(subtotal ?? 0);
    const numericDiscountValue = Number(discountValue ?? 0);
    const numericTaxRate = Number(taxRate ?? 0);
    const numericShipping = Number(shippingAmount ?? 0);

    // Compute discount based on type
    const dt = String((discountType as string | undefined) || 'PERCENTAGE').toUpperCase();
    const computedDiscountAmount = dt === 'FIXED'
      ? Math.max(0, numericDiscountValue)
      : Math.max(0, Math.min(100, numericDiscountValue)) * numericSubtotal / 100;

    // Compute tax base and tax
    const taxBase = Math.max(0, numericSubtotal - computedDiscountAmount) + Math.max(0, numericShipping);
    const computedTaxAmount = Math.max(0, (numericTaxRate || 0) * taxBase / 100);
    const computedTotal = taxBase + computedTaxAmount;

    // Generate or validate invoice number
    let finalInvoiceNumber: string;
    
    if (invoiceNumber) {
      // If invoice number is provided, check if it already exists
      const existingInvoice = await prisma.invoice.findUnique({ 
        where: { invoiceNumber: String(invoiceNumber) } 
      });

      if (existingInvoice) {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 400 }
        );
      }
      
      finalInvoiceNumber = String(invoiceNumber);
    } else {
      // Generate sequential invoice number
      finalInvoiceNumber = await generateSequentialInvoiceNumber();
    }

    // Resolve creator user to satisfy FK and avoid P2003
    const creator = await prisma.user.findFirst({
      where: {
        OR: [
          { id: String((session.user as any).id || '') },
          { email: String((session.user as any).email || '') }
        ]
      },
      select: { id: true }
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator user not found for current session' },
        { status: 400 }
      );
    }

    // Create invoice with items (cast data to any until Prisma client is regenerated)
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: finalInvoiceNumber,
        date: new Date(String(date)),
        dueDate: new Date(String(dueDate)),
        companyName: String(companyName),
        companyAddress: String(companyAddress),
        companyPhone: String(companyPhone),
        companyEmail: String(companyEmail),
        invoiceTitle: String((body as any).invoiceTitle || 'INVOICE'),
        bankName: String((body as any).bankName || 'BCA'),
        accountNumber: String((body as any).accountNumber || ''),
        accountHolder: String((body as any).accountHolder || ''),
        clientName: String(clientName),
        clientAddress: String(clientAddress || ''),
        clientPhone: String(clientPhone || ''),
        clientEmail: String(clientEmail || ''),
        subtotal: numericSubtotal,
        // new fields
        discountType: dt as any,
        discountValue: numericDiscountValue as any,
        discountAmount: computedDiscountAmount as any,
        taxRate: numericTaxRate,
        taxAmount: computedTaxAmount,
        shippingAmount: Math.max(0, numericShipping) as any,
        total: computedTotal,
        amountPaid: Math.max(0, numericAmountPaid) as any,
        balanceDue: Math.max(0, computedTotal - numericAmountPaid) as any,
        notes: (notes as string | undefined) || undefined,
        status: validatedStatus as any,
        createdBy: { connect: { id: creator.id } },
        items: {
          create: typedItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            subItems: item.subItems && item.subItems.length > 0 ? {
              create: item.subItems.map((si) => ({
                name: si.name,
                description: si.description || undefined,
                quantity: si.quantity,
                unitPrice: si.unitPrice,
                total: si.total,
              }))
            } : undefined,
          }))
        }
      } as any,
      include: {
        items: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
