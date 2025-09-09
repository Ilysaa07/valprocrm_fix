import { NextResponse } from 'next/server'

export async function GET() {
  // Minimal mock so settings page stops 404-ing; replace with real DB as needed
  const logs = [
    {
      id: 'mock-1',
      userId: 'u1',
      userFullName: 'Admin User',
      userEmail: 'admin@example.com',
      action: 'LOGIN',
      ipAddress: '127.0.0.1',
      userAgent: 'MockAgent',
      location: 'Local',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      details: 'Mock log'
    }
  ]
  return NextResponse.json({ logs }, { headers: { 'Cache-Control': 'no-store' } })
}


