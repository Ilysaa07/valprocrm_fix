import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const upsertLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama lokasi harus diisi'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().int().positive().max(2000).default(50),
})

// GET /api/locations - list all office locations
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const locations = await prisma.officeLocation.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ data: locations })
}

// POST /api/locations - create or update an office location (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const input = upsertLocationSchema.parse(body)

    if (input.id) {
      const updated = await prisma.officeLocation.update({
        where: { id: input.id },
        data: {
          name: input.name,
          latitude: input.latitude,
          longitude: input.longitude,
          radius: input.radius,
        },
      })
      return NextResponse.json({ message: 'Lokasi diperbarui', location: updated })
    }

    const created = await prisma.officeLocation.create({
      data: {
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.radius,
      },
    })
    return NextResponse.json({ message: 'Lokasi dibuat', location: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasi gagal', details: error.errors }, { status: 400 })
    }
    console.error('Locations POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}





