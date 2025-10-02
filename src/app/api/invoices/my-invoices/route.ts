import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/invoices/my-invoices - Get all invoices (same as admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both ADMIN and EMPLOYEE to see all invoices
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
