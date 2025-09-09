import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { spawn } from 'child_process'
import { prisma } from '@/lib/prisma'

type BackupConfig = {
  enabled: boolean
  cron: string // simple cron-like string e.g. "0 2 * * *"
  lastRun?: string
  lastStatus?: 'SUCCESS' | 'FAILED'
}

let config: BackupConfig = {
  enabled: false,
  cron: '0 2 * * *',
  lastRun: undefined,
  lastStatus: undefined
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode')
  const format = searchParams.get('format') || 'json'
  if (mode === 'download') {
    if (format === 'sql') {
      const dbUrl = process.env.DATABASE_URL || ''
      if (!dbUrl.startsWith('mysql://') && !dbUrl.startsWith('mysql2://')) {
        return new Response('-- DATABASE_URL tidak dikonfigurasi untuk MySQL. Pastikan DATABASE_URL menggunakan skema mysql://', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }

      // Parse mysql://user:pass@host:port/dbname
      let user = ''
      let password = ''
      let host = '127.0.0.1'
      let port = '3306'
      let database = ''
      try {
        const u = new URL(dbUrl)
        user = decodeURIComponent(u.username)
        password = decodeURIComponent(u.password)
        host = u.hostname || host
        port = u.port || port
        database = u.pathname.replace(/^\//, '')
      } catch (e) {
        return new Response('-- DATABASE_URL MySQL tidak valid', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }

      const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`
      const headers = {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }

      try {
        const args = [
          '-h', host,
          '-P', port,
          '-u', user,
          `-p${password}`,
          '--single-transaction',
          '--quick',
          '--routines',
          '--events',
          database
        ]

        const child = spawn('mysqldump', args)

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            child.stdout.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
            child.stderr.on('data', () => { /* ignore to avoid leaking sensitive info */ })
            child.on('error', () => {
              try { controller.error(new Error('mysqldump gagal dijalankan.')) } catch {}
            })
            child.on('close', () => {
              try { controller.close() } catch {}
            })
          },
          cancel() {
            try { child.kill('SIGTERM') } catch {}
          }
        })

        return new Response(stream, { headers })
      } catch (e) {
        // Fallback: Prisma-based SQL dump
        try {
          const ts = new Date().toISOString()
          const enc = new TextEncoder()
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              const write = (s: string) => controller.enqueue(enc.encode(s))
              write(`-- Backup generated at ${ts}\n-- Host: ${os.hostname()}\n-- Engine: Prisma raw dump fallback\n\nBEGIN;\n`)
              // list tables
              const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || ''
              const tables: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
              const tableNames = tables.map((row: any) => Object.values(row)[0]).filter(Boolean)
              for (const tbl of tableNames) {
                try {
                  const createRows: any[] = await prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${tbl}\``)
                  const createSql = createRows?.[0]?.['Create Table'] || createRows?.[0]?.['Create View']
                  if (createSql) write(`\n-- Schema for ${tbl}\nDROP TABLE IF EXISTS \`${tbl}\`;\n${createSql};\n`)
                  const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tbl}\``)
                  if (rows.length) {
                    const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ')
                    write(`\n-- Data for ${tbl}\n`)
                    for (const r of rows) {
                      const vals = Object.values(r).map(v => sqlVal(v)).join(', ')
                      write(`INSERT INTO \`${tbl}\` (${cols}) VALUES (${vals});\n`)
                    }
                  }
                } catch {}
              }
              write('\nCOMMIT;\n')
              controller.close()
            }
          })
          function sqlVal(v: any): string {
            if (v === null || v === undefined) return 'NULL'
            if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
            if (typeof v === 'boolean') return v ? '1' : '0'
            if (v instanceof Date) return `'${escapeStr(v.toISOString().slice(0, 19).replace('T', ' '))}'`
            return `'${escapeStr(String(v))}'`
          }
          function escapeStr(s: string): string {
            return s
              .replace(/\\/g, '\\\\')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/\u0000/g, '')
              .replace(/'/g, "\\'")
          }
          return new Response(stream, { headers })
        } catch {
          return new Response('-- Gagal menjalankan mysqldump dan fallback Prisma. Pastikan utilitas tersedia atau hak akses DB mencukupi.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }
      }
    } else {
      const payload = {
        generatedAt: new Date().toISOString(),
        host: os.hostname(),
        config,
      }
      const body = JSON.stringify(payload, null, 2)
      const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      return new Response(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store'
        }
      })
    }
  }
  return NextResponse.json(config, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    config = { ...config, ...body }
    return NextResponse.json(config)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function POST() {
  // Simulate backup task
  config.lastRun = new Date().toISOString()
  config.lastStatus = 'SUCCESS'
  return NextResponse.json({ message: 'Backup started', ...config })
}


