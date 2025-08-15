import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cfg = await prisma.attendanceConfig.findFirst()
  return NextResponse.json({ config: cfg })
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await req.json()
    const data: any = {}
    const fields = ['workStartHour','workEndHour','officeLat','officeLng','radiusMeters','useGeofence','enforceGeofence']
    
    fields.forEach(field => {
      if (body[field] !== undefined) data[field] = body[field]
    })

    const existing = await prisma.attendanceConfig.findFirst()
    const config = existing
      ? await prisma.attendanceConfig.update({ where: { id: existing.id }, data })
      : await prisma.attendanceConfig.create({ data })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating attendance config:', error)
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
}


