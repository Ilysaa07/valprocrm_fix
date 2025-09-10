import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const dbUrl = process.env.DATABASE_URL || ''
    const conn = parseMysqlUrl(dbUrl)

    const args = [
      '-h', conn.host,
      '-P', conn.port,
      '-u', conn.user,
      `-p${conn.password}`,
      '--single-transaction',
      '--quick',
      '--routines',
      '--events',
      conn.database
    ]
    const mysqldump = resolveMysqlTool('MYSQLDUMP_PATH', 'mysqldump')
    const child = spawn(mysqldump, args, { shell: process.platform === 'win32' })

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        child.stdout.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
        child.stderr.on('data', () => {})
        child.on('error', (err) => {
          try { controller.error(err) } catch {}
        })
        child.on('close', () => {
          try { controller.close() } catch {}
        })
      },
      cancel() {
        try { child.kill('SIGTERM') } catch {}
      }
    })

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: error?.message || 'Backup failed' }, { status: 500 })
  }
}

function parseMysqlUrl(url: string): { host: string; port: string; user: string; password: string; database: string } {
  try {
    const normalized = url.replace(/^mysql2:/, 'mysql:')
    const u = new URL(normalized)
    if (u.protocol !== 'mysql:') throw new Error('Invalid protocol')
    const user = decodeURIComponent(u.username || '')
    const password = decodeURIComponent(u.password || '')
    const host = u.hostname || '127.0.0.1'
    const port = u.port && u.port.length > 0 ? u.port : '3306'
    const database = decodeURIComponent((u.pathname || '').replace(/^\/+/, ''))
    if (!database) throw new Error('Missing database name')
    return { host, port, user, password, database }
  } catch {
    throw new Error('DATABASE_URL is not a valid MySQL URL')
  }
}

function resolveMysqlTool(envVar: string, baseName: string): string {
  const configured = process.env[envVar]
  if (configured && configured.trim().length > 0) return configured
  if (process.platform !== 'win32') return baseName
  const candidates = [
    `C:/Program Files/MySQL/MySQL Server 8.0/bin/${baseName}.exe`,
    `C:/Program Files/MySQL/MySQL Server 5.7/bin/${baseName}.exe`,
    `C:/Program Files/MySQL/MySQL Server/bin/${baseName}.exe`,
    `C:/Program Files (x86)/MySQL/MySQL Server 8.0/bin/${baseName}.exe`,
    `C:/Program Files (x86)/MySQL/MySQL Server/bin/${baseName}.exe`,
    `C:/xampp/mysql/bin/${baseName}.exe`,
    `C:/wamp64/bin/mysql/mysql8.0.31/bin/${baseName}.exe`,
    `C:/wamp64/bin/mysql/mysql5.7.31/bin/${baseName}.exe`,
  ]
  for (const p of candidates) {
    try { if (require('fs').existsSync(p)) return p } catch {}
  }
  return baseName
}
