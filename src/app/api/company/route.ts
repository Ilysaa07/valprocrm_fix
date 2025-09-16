import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/company - Get company information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let company = await prisma.company.findFirst()

    // If no company exists, create default one
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "PT. VALPRO INTERTECH",
          slogan: "Business Entity Partner",
          address: "JL. Raya Gading Tutuka No.1758, Soreang Kab.Bandung Jawa Barat Indonesia",
          email: "mail@valprointertech.com",
          phone: "081399710085",
          website: "valprointertech.com",
          briAccountNumber: "2105 0100 0365 563",
          briAccountName: "a.n PT Valpro Inter Tech",
          bcaAccountNumber: "4373249575",
          bcaAccountName: "a.n PT Valpro Inter Tech"
        }
      })
    }

    return NextResponse.json({ data: company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/company - Update company information (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slogan,
      address,
      email,
      phone,
      website,
      briAccountNumber,
      briAccountName,
      bcaAccountNumber,
      bcaAccountName,
      logo
    } = body

    let company = await prisma.company.findFirst()

    if (company) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          ...(name && { name }),
          ...(slogan && { slogan }),
          ...(address && { address }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(website && { website }),
          ...(briAccountNumber && { briAccountNumber }),
          ...(briAccountName && { briAccountName }),
          ...(bcaAccountNumber && { bcaAccountNumber }),
          ...(bcaAccountName && { bcaAccountName }),
          ...(logo !== undefined && { logo })
        }
      })
    } else {
      company = await prisma.company.create({
        data: {
          name: name || "PT. VALPRO INTERTECH",
          slogan: slogan || "Business Entity Partner",
          address: address || "JL. Raya Gading Tutuka No.1758, Soreang Kab.Bandung Jawa Barat Indonesia",
          email: email || "mail@valprointertech.com",
          phone: phone || "081399710085",
          website: website || "valprointertech.com",
          briAccountNumber: briAccountNumber || "2105 0100 0365 563",
          briAccountName: briAccountName || "a.n PT Valpro Inter Tech",
          bcaAccountNumber: bcaAccountNumber || "4373249575",
          bcaAccountName: bcaAccountName || "a.n PT Valpro Inter Tech",
          logo
        }
      })
    }

    return NextResponse.json({ data: company })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
