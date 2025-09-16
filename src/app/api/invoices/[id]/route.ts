import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/invoices/[id] - Get specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: p.id },
      include: {
        items: { include: { subItems: true } },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user has permission to view this invoice
    if (session.user.role !== 'ADMIN' && invoice.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice (admin or owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      notes,
      status
    } = body as Record<string, unknown>;

    // Check if invoice exists
    const p = await params;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: p.id }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Allow only admins or the creator to update
    if (session.user.role !== 'ADMIN' && existingInvoice.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if invoice number already exists (excluding current invoice)
    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicateInvoice = await prisma.invoice.findUnique({
        where: { invoiceNumber: String(invoiceNumber) }
      });

      if (duplicateInvoice) {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 400 }
        );
      }
    }

    // Numeric normalization and derived amounts
    const numericSubtotal = subtotal !== undefined ? Number(subtotal) : undefined;
    const numericDiscountValue = discountValue !== undefined ? Number(discountValue) : undefined;
    let nextDiscountAmount = (discountAmount as number | undefined);
    if (numericSubtotal !== undefined || numericDiscountValue !== undefined || discountType !== undefined) {
      const dt = String(discountType ?? (existingInvoice as unknown as { discountType?: string }).discountType).toUpperCase();
      const dv = numericDiscountValue ?? Number((existingInvoice as unknown as { discountValue?: string | number }).discountValue ?? 0);
      const sb = numericSubtotal ?? Number((existingInvoice as unknown as { subtotal?: string | number }).subtotal ?? 0);
      nextDiscountAmount = dt === 'FIXED' ? Math.max(0, dv) : Math.max(0, Math.min(100, dv)) * sb / 100;
    }

    const numericTaxRate = taxRate !== undefined ? Number(taxRate) : undefined;
    const numericShipping = shippingAmount !== undefined ? Number(shippingAmount) : undefined;
    let nextTaxAmount = (taxAmount as number | undefined);
    if (numericTaxRate !== undefined || numericSubtotal !== undefined || nextDiscountAmount !== undefined || numericShipping !== undefined) {
      const tr = numericTaxRate ?? Number((existingInvoice as unknown as { taxRate?: string | number }).taxRate ?? 0);
      const sb = numericSubtotal ?? Number((existingInvoice as unknown as { subtotal?: string | number }).subtotal ?? 0);
      const da = nextDiscountAmount ?? Number((existingInvoice as unknown as { discountAmount?: string | number }).discountAmount ?? 0);
      const sp = numericShipping ?? Number((existingInvoice as unknown as { shippingAmount?: string | number }).shippingAmount ?? 0);
      const taxBase = Math.max(0, sb - da) + Math.max(0, sp);
      nextTaxAmount = Math.max(0, (tr || 0) * taxBase / 100);
    }

    let nextTotal = (total as number | undefined);
    if (numericSubtotal !== undefined || nextDiscountAmount !== undefined || nextTaxAmount !== undefined || numericShipping !== undefined) {
      const sb = numericSubtotal ?? Number((existingInvoice as unknown as { subtotal?: string | number }).subtotal ?? 0);
      const da = nextDiscountAmount ?? Number((existingInvoice as unknown as { discountAmount?: string | number }).discountAmount ?? 0);
      const ta = nextTaxAmount ?? Number((existingInvoice as unknown as { taxAmount?: string | number }).taxAmount ?? 0);
      const sp = numericShipping ?? Number((existingInvoice as unknown as { shippingAmount?: string | number }).shippingAmount ?? 0);
      nextTotal = Math.max(0, sb - da) + Math.max(0, sp) + Math.max(0, ta);
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        ...(invoiceNumber && { invoiceNumber: String(invoiceNumber) }),
        ...(date && { date: new Date(String(date)) }),
        ...(dueDate && { dueDate: new Date(String(dueDate)) }),
        ...(companyName && { companyName: String(companyName) }),
        ...(companyAddress && { companyAddress: String(companyAddress) }),
        ...(companyPhone && { companyPhone: String(companyPhone) }),
        ...(companyEmail && { companyEmail: String(companyEmail) }),
        ...(clientName && { clientName: String(clientName) }),
        ...(clientAddress && { clientAddress: String(clientAddress) }),
        ...(clientPhone && { clientPhone: String(clientPhone) }),
        ...(clientEmail && { clientEmail: String(clientEmail) }),
        ...(numericSubtotal !== undefined && { subtotal: numericSubtotal as any }),
        ...(discountType !== undefined && { discountType: String(discountType).toUpperCase() as any }),
        ...(numericDiscountValue !== undefined && { discountValue: numericDiscountValue as any }),
        ...(nextDiscountAmount !== undefined && { discountAmount: nextDiscountAmount as any }),
        ...(numericTaxRate !== undefined && { taxRate: numericTaxRate as any }),
        ...(nextTaxAmount !== undefined && { taxAmount: nextTaxAmount as any }),
        ...(numericShipping !== undefined && { shippingAmount: numericShipping as any }),
        ...(nextTotal !== undefined && { total: nextTotal as any }),
        ...(notes !== undefined && { notes: (notes as string) }),
        ...(status && { status: String(status).toUpperCase() as any }),
        updatedAt: new Date()
      },
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

    // Update items if provided
    if (items) {
      // Delete existing items (subItems cascade)
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: p.id }
      });

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

      // Re-create items with nested subItems
      for (const item of typedItems) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: p.id,
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
          }
        });
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice (admin or owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if invoice exists
    const p = await params;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: p.id }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Allow only admins or the creator to delete
    if (session.user.role !== 'ADMIN' && existingInvoice.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete invoice (items will be deleted automatically due to cascade)
    await prisma.invoice.delete({
      where: { id: p.id }
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
