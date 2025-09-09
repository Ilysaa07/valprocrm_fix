import { NextRequest, NextResponse } from 'next/server'

let settings = {
  twoFactorEnabled: false,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    expiryDays: 90
  },
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  ipWhitelist: [] as string[],
  auditLogging: true,
  encryptionLevel: 'STANDARD' as 'BASIC' | 'STANDARD' | 'HIGH'
}

export async function GET() {
  return NextResponse.json(settings, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    settings = { ...settings, ...body }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}


