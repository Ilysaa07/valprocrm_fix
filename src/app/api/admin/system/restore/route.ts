import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const valid = file.name.endsWith('.sql') || file.type === 'application/sql' || file.type === 'text/plain'
    if (!valid) return NextResponse.json({ error: 'Only .sql files are allowed' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valpro-restore-'))
    const sqlPath = path.join(tmpDir, file.name)
    fs.writeFileSync(sqlPath, buffer)

    const dbUrl = process.env.DATABASE_URL || ''
    const conn = parseMysqlUrl(dbUrl)
    const mysql = resolveMysqlTool('MYSQL_CLI_PATH', 'mysql')

    // Drop and recreate target database
    await execMysql(mysql, conn, ['-e', `DROP DATABASE IF EXISTS \`${conn.database}\`; CREATE DATABASE \`${conn.database}\`;`])
    // Import file
    await execMysql(mysql, conn, [conn.database, '-e', `SOURCE ${sqlPath};`])

    return NextResponse.json({ message: 'Restore berhasil' })
  } catch (error: any) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: error?.message || 'Restore failed' }, { status: 500 })
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
    try { if (fs.existsSync(p)) return p } catch {}
  }
  return baseName
}

async function execMysql(mysqlBin: string, conn: { host: string; port: string; user: string; password: string }, args: string[]) {
  const fullArgs = ['-h', conn.host, '-P', conn.port, '-u', conn.user, `-p${conn.password}`, ...args]
  const child = spawn(mysqlBin, fullArgs, { shell: process.platform === 'win32' })
  let stderr = ''
  await new Promise<void>((resolve, reject) => {
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    child.on('error', (err) => reject(err))
    child.on('close', (code) => {
      if (code && code !== 0) reject(new Error(stderr || `mysql exited with code ${code}`))
      else resolve()
    })
  })
}

