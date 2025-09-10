import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import os from 'os'

interface BackupOptions {
  type: 'database' | 'files' | 'full'
  format: 'sql' | 'json' | 'zip'
  includeFiles?: boolean
  includeDatabase?: boolean
}

interface BackupResult {
  success: boolean
  message: string
  filename?: string
  size?: number
  timestamp: string
  type: string
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const type = searchParams.get('type') || 'database'
  const format = searchParams.get('format') || 'sql'

  try {
    if (action === 'download') {
      return await handleBackupDownload(type, format)
    } else if (action === 'list') {
      return await handleBackupList()
    } else {
      return await handleBackupStatus()
    }
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ 
      error: 'Backup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type = 'database', format = 'sql', includeFiles = false, includeDatabase = true } = body

    const result = await createBackup({ type, format, includeFiles, includeDatabase })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Backup creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create backup', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function handleBackupDownload(type: string, format: string) {
  const backupDir = join(process.cwd(), 'backups')
  
  if (!existsSync(backupDir)) {
    return NextResponse.json({ error: 'No backups found' }, { status: 404 })
  }

  const files = await readdir(backupDir)
  const backupFiles = files
    .filter(file => file.includes(type) && file.endsWith(format === 'sql' ? '.sql' : '.json'))
    .sort()
    .reverse()

  if (backupFiles.length === 0) {
    return NextResponse.json({ error: 'No backup files found' }, { status: 404 })
  }

  const latestFile = backupFiles[0]
  const filePath = join(backupDir, latestFile)
  const fileStats = await stat(filePath)

  const headers = {
    'Content-Type': format === 'sql' ? 'application/sql' : 'application/json',
    'Content-Disposition': `attachment; filename="${latestFile}"`,
    'Content-Length': fileStats.size.toString(),
    'Cache-Control': 'no-store'
  }

  const fileBuffer = await import('fs').then(fs => fs.promises.readFile(filePath))
  
  return new Response(fileBuffer, { headers })
}

async function handleBackupList() {
  const backupDir = join(process.cwd(), 'backups')
  
  if (!existsSync(backupDir)) {
    return NextResponse.json({ data: [] })
  }

  const files = await readdir(backupDir)
  const backups = []

  for (const file of files) {
    const filePath = join(backupDir, file)
    const stats = await stat(filePath)
    
    backups.push({
      filename: file,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      type: file.includes('database') ? 'database' : file.includes('files') ? 'files' : 'full',
      format: file.endsWith('.sql') ? 'sql' : file.endsWith('.json') ? 'json' : 'unknown'
    })
  }

  return NextResponse.json({ 
    data: backups.sort((a, b) => b.created.getTime() - a.created.getTime())
  })
}

async function handleBackupStatus() {
  const backupDir = join(process.cwd(), 'backups')
  const hasBackups = existsSync(backupDir)
  
  let lastBackup = null
  if (hasBackups) {
    try {
      const files = await readdir(backupDir)
      if (files.length > 0) {
        const latestFile = files.sort().reverse()[0]
        const filePath = join(backupDir, latestFile)
        const stats = await stat(filePath)
        lastBackup = {
          filename: latestFile,
          created: stats.birthtime,
          size: stats.size
        }
      }
    } catch (error) {
      console.error('Error reading backup directory:', error)
    }
  }

  return NextResponse.json({
    hasBackups,
    lastBackup,
    backupDirectory: backupDir,
    systemInfo: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    }
  })
}

async function createBackup(options: BackupOptions): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = join(process.cwd(), 'backups')
  
  // Ensure backup directory exists
  if (!existsSync(backupDir)) {
    await mkdir(backupDir, { recursive: true })
  }

  let filename = ''
  let content = ''
  let size = 0

  if (options.type === 'database' || options.type === 'full') {
    filename = `backup-database-${timestamp}.${options.format}`
    content = await createDatabaseBackup(options.format)
  } else if (options.type === 'files') {
    filename = `backup-files-${timestamp}.json`
    content = await createFilesBackup()
  }

  const filePath = join(backupDir, filename)
  await writeFile(filePath, content, 'utf8')
  
  const stats = await stat(filePath)
  size = stats.size

  return {
    success: true,
    message: `Backup created successfully: ${filename}`,
    filename,
    size,
    timestamp: new Date().toISOString(),
    type: options.type
  }
}

async function createDatabaseBackup(format: string): Promise<string> {
  if (format === 'sql') {
    return await createSQLBackup()
  } else {
    return await createJSONBackup()
  }
}

async function createSQLBackup(): Promise<string> {
  const dbUrl = process.env.DATABASE_URL || ''
  
  if (!dbUrl.startsWith('mysql://') && !dbUrl.startsWith('mysql2://')) {
    // Fallback to Prisma-based SQL dump
    return await createPrismaSQLBackup()
  }

  // Try mysqldump first
  try {
    const { spawn } = await import('child_process')
    
    const url = new URL(dbUrl)
    const user = decodeURIComponent(url.username)
    const password = decodeURIComponent(url.password)
    const host = url.hostname || '127.0.0.1'
    const port = url.port || '3306'
    const database = url.pathname.replace(/^\//, '')

    const args = [
      '-h', host,
      '-P', port,
      '-u', user,
      `-p${password}`,
      '--single-transaction',
      '--quick',
      '--routines',
      '--events',
      '--triggers',
      '--add-drop-table',
      '--add-locks',
      '--disable-keys',
      database
    ]

    return new Promise((resolve, reject) => {
      const child = spawn('mysqldump', args)
      let output = ''
      let error = ''

      child.stdout.on('data', (chunk) => {
        output += chunk.toString()
      })

      child.stderr.on('data', (chunk) => {
        error += chunk.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`mysqldump failed: ${error}`))
        }
      })

      child.on('error', (err) => {
        reject(err)
      })
    })
  } catch (error) {
    console.warn('mysqldump failed, falling back to Prisma:', error)
    return await createPrismaSQLBackup()
  }
}

async function createPrismaSQLBackup(): Promise<string> {
  const timestamp = new Date().toISOString()
  let sql = `-- Backup generated at ${timestamp}\n`
  sql += `-- Host: ${os.hostname()}\n`
  sql += `-- Engine: Prisma raw dump\n\n`
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`

  try {
    // Get all tables
    const tables: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tableNames = tables.map((row: any) => Object.values(row)[0]).filter(Boolean)

    for (const tableName of tableNames) {
      try {
        // Get table structure
        const createRows: any[] = await prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${tableName}\``)
        const createSql = createRows?.[0]?.['Create Table'] || createRows?.[0]?.['Create View']
        
        if (createSql) {
          sql += `\n-- Table structure for ${tableName}\n`
          sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`
          sql += `${createSql};\n\n`
        }

        // Get table data
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tableName}\``)
        
        if (rows.length > 0) {
          sql += `-- Data for ${tableName}\n`
          const columns = Object.keys(rows[0])
          const columnNames = columns.map(col => `\`${col}\``).join(', ')
          
          for (const row of rows) {
            const values = columns.map(col => escapeSQLValue(row[col])).join(', ')
            sql += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});\n`
          }
          sql += '\n'
        }
      } catch (tableError) {
        console.warn(`Error processing table ${tableName}:`, tableError)
        sql += `-- Error processing table ${tableName}\n`
      }
    }

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`
    return sql
  } catch (error) {
    throw new Error(`Failed to create Prisma SQL backup: ${error}`)
  }
}

async function createJSONBackup(): Promise<string> {
  const timestamp = new Date().toISOString()
  const backup: any = {
    metadata: {
      generatedAt: timestamp,
      host: os.hostname(),
      version: '1.0',
      type: 'database'
    },
    tables: {}
  }

  try {
    // Get all tables
    const tables: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tableNames = tables.map((row: any) => Object.values(row)[0]).filter(Boolean)

    for (const tableName of tableNames) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tableName}\``)
        backup.tables[tableName] = rows
      } catch (tableError) {
        console.warn(`Error processing table ${tableName}:`, tableError)
        backup.tables[tableName] = []
      }
    }

    return JSON.stringify(backup, null, 2)
  } catch (error) {
    throw new Error(`Failed to create JSON backup: ${error}`)
  }
}

async function createFilesBackup(): Promise<string> {
  const timestamp = new Date().toISOString()
  const backup: any = {
    metadata: {
      generatedAt: timestamp,
      host: os.hostname(),
      version: '1.0',
      type: 'files'
    },
    directories: {}
  }

  const directoriesToBackup = [
    'storage/documents',
    'storage/uploads',
    'public/uploads'
  ]

  for (const dir of directoriesToBackup) {
    const dirPath = join(process.cwd(), dir)
    if (existsSync(dirPath)) {
      try {
        const files = await readdir(dirPath, { recursive: true })
        backup.directories[dir] = files
      } catch (error) {
        console.warn(`Error reading directory ${dir}:`, error)
        backup.directories[dir] = []
      }
    }
  }

  return JSON.stringify(backup, null, 2)
}

function escapeSQLValue(value: any): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
  
  const str = String(value)
  return `'${str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u0000/g, '')
  }'`
}
