import { NextRequest, NextResponse } from 'next/server';

// This endpoint provides information about Socket.IO configuration
// The actual Socket.IO server is handled by the custom server.js file

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Socket.IO server is running via custom server',
    status: 'active',
    note: 'Make sure to run "npm run dev" (which uses server.js) instead of "npm run dev:next"'
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Socket.IO server is running via custom server',
    status: 'active'
  });
}
