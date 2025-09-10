import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import os from 'os'

interface BackupSchedule {
  id: string
  name: string
  type: 'database' | 'files' | 'full'
  format: 'sql' | 'json'
  cron: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  lastStatus?: 'SUCCESS' | 'FAILED' | 'RUNNING'
  retentionDays: number
}

interface BackupJob {
  id: string
  scheduleId: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  startedAt?: string
  completedAt?: string
  filename?: string
  size?: number
  error?: string
}

// In-memory storage for demo (in production, use Redis or database)
// eslint-disable-next-line prefer-const
let schedules: BackupSchedule[] = []
// eslint-disable-next-line prefer-const
let jobs: BackupJob[] = []

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'schedules':
        return NextResponse.json({ data: schedules })
      case 'jobs':
        return NextResponse.json({ data: jobs })
      case 'status':
        return await handleBackupStatus()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Backup schedule error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch backup data', 
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
    const { action } = body

    switch (action) {
      case 'create-schedule':
        return await createSchedule(body)
      case 'update-schedule':
        return await updateSchedule(body)
      case 'delete-schedule':
        return await deleteSchedule(body.id)
      case 'toggle-schedule':
        return await toggleSchedule(body.id)
      case 'run-schedule':
        return await runSchedule(body.id)
      case 'create-backup':
        return await createBackup(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Backup schedule error:', error)
    return NextResponse.json({ 
      error: 'Failed to process backup request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function createSchedule(data: Partial<BackupSchedule>): Promise<NextResponse> {
  const { name, type, format, cron, retentionDays = 30 } = data
  
  if (!name || !type || !format || !cron) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const schedule: BackupSchedule = {
    id: `schedule_${Date.now()}`,
    name,
    type,
    format,
    cron,
    enabled: true,
    retentionDays,
    lastStatus: undefined
  }

  schedules.push(schedule)
  
  // Calculate next run time
  schedule.nextRun = calculateNextRun(cron)

  return NextResponse.json({ 
    message: 'Schedule created successfully', 
    data: schedule 
  })
}

async function updateSchedule(data: Partial<BackupSchedule> & { id: string }): Promise<NextResponse> {
  const { id, ...updates } = data
  const scheduleIndex = schedules.findIndex(s => s.id === id)
  
  if (scheduleIndex === -1) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  }

  schedules[scheduleIndex] = { ...schedules[scheduleIndex], ...updates }
  
  // Recalculate next run if cron changed
  if (updates.cron) {
    schedules[scheduleIndex].nextRun = calculateNextRun(updates.cron)
  }

  return NextResponse.json({ 
    message: 'Schedule updated successfully', 
    data: schedules[scheduleIndex] 
  })
}

async function deleteSchedule(id: string): Promise<NextResponse> {
  const scheduleIndex = schedules.findIndex(s => s.id === id)
  
  if (scheduleIndex === -1) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  }

  schedules.splice(scheduleIndex, 1)
  
  // Remove related jobs
  jobs = jobs.filter(j => j.scheduleId !== id)

  return NextResponse.json({ message: 'Schedule deleted successfully' })
}

async function toggleSchedule(id: string): Promise<NextResponse> {
  const schedule = schedules.find(s => s.id === id)
  
  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  }

  schedule.enabled = !schedule.enabled
  
  if (schedule.enabled) {
    schedule.nextRun = calculateNextRun(schedule.cron)
  } else {
    schedule.nextRun = undefined
  }

  return NextResponse.json({ 
    message: `Schedule ${schedule.enabled ? 'enabled' : 'disabled'}`, 
    data: schedule 
  })
}

async function runSchedule(id: string): Promise<NextResponse> {
  const schedule = schedules.find(s => s.id === id)
  
  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  }

  // Create job
  const job: BackupJob = {
    id: `job_${Date.now()}`,
    scheduleId: id,
    status: 'RUNNING',
    startedAt: new Date().toISOString()
  }
  
  jobs.push(job)
  
  // Update schedule status
  schedule.lastStatus = 'RUNNING'
  schedule.lastRun = job.startedAt

  try {
    // Run backup
    const result = await createBackup({
      type: schedule.type,
      format: schedule.format,
      includeFiles: schedule.type === 'files' || schedule.type === 'full',
      includeDatabase: schedule.type === 'database' || schedule.type === 'full'
    })

    // Update job
    job.status = 'SUCCESS'
    job.completedAt = new Date().toISOString()
    job.filename = result.filename
    job.size = result.size

    // Update schedule
    schedule.lastStatus = 'SUCCESS'

    return NextResponse.json({ 
      message: 'Backup completed successfully', 
      data: { job, result } 
    })
  } catch (error) {
    // Update job
    job.status = 'FAILED'
    job.completedAt = new Date().toISOString()
    job.error = error instanceof Error ? error.message : 'Unknown error'

    // Update schedule
    schedule.lastStatus = 'FAILED'

    return NextResponse.json({ 
      error: 'Backup failed', 
      details: job.error 
    }, { status: 500 })
  }
}

async function createBackup(options: {
  type: string
  format: string
  includeFiles: boolean
  includeDatabase: boolean
}): Promise<{
  success: boolean
  message: string
  filename?: string
  size?: number
  timestamp: string
  type: string
}> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = join(process.cwd(), 'backups')
  
  // Ensure backup directory exists
  if (!existsSync(backupDir)) {
    await mkdir(backupDir, { recursive: true })
  }

  let filename = ''
  let content = ''

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

  return {
    success: true,
    message: `Backup created successfully: ${filename}`,
    filename,
    size: stats.size,
    timestamp: new Date().toISOString(),
    type: options.type
  }
}

async function handleBackupStatus(): Promise<NextResponse> {
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
    schedules: schedules.length,
    activeSchedules: schedules.filter(s => s.enabled).length,
    pendingJobs: jobs.filter(j => j.status === 'PENDING' || j.status === 'RUNNING').length,
    systemInfo: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    }
  })
}

function calculateNextRun(cron: string): string {
  // Simple cron parser for demo (in production, use a proper cron library)
  const parts = cron.split(' ')
  if (parts.length !== 5) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default to tomorrow
  }

  const [minute, hour, day, month, weekday] = parts
  const now = new Date()
  
  // For demo purposes, assume daily at specified hour:minute
  if (day === '*' && month === '*' && weekday === '*') {
    const nextRun = new Date(now)
    nextRun.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0)
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
    
    return nextRun.toISOString()
  }
  
  // Default to tomorrow
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

// Database backup functions (simplified versions)
async function createDatabaseBackup(format: string): Promise<string> {
  if (format === 'sql') {
    return await createSQLBackup()
  } else {
    return await createJSONBackup()
  }
}

async function createSQLBackup(): Promise<string> {
  const timestamp = new Date().toISOString()
  let sql = `-- Backup generated at ${timestamp}\n`
  sql += `-- Host: ${os.hostname()}\n`
  sql += `-- Engine: Prisma raw dump\n\n`
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`

  try {
    const tables: Record<string, unknown>[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tableNames = tables.map((row: Record<string, unknown>) => Object.values(row)[0] as string).filter(Boolean)

    for (const tableName of tableNames) {
      try {
        const createRows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${tableName}\``)
        const createSql = createRows?.[0]?.['Create Table'] as string || createRows?.[0]?.['Create View'] as string
        
        if (createSql) {
          sql += `\n-- Table structure for ${tableName}\n`
          sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`
          sql += `${createSql};\n\n`
        }

        const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tableName}\``)
        
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
    throw new Error(`Failed to create SQL backup: ${error}`)
  }
}

async function createJSONBackup(): Promise<string> {
  const timestamp = new Date().toISOString()
  const backup: {
    metadata: {
      generatedAt: string
      host: string
      version: string
      type: string
    }
    tables: Record<string, Record<string, unknown>[]>
  } = {
    metadata: {
      generatedAt: timestamp,
      host: os.hostname(),
      version: '1.0',
      type: 'database'
    },
    tables: {}
  }

  try {
    const tables: Record<string, unknown>[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tableNames = tables.map((row: Record<string, unknown>) => Object.values(row)[0] as string).filter(Boolean)

    for (const tableName of tableNames) {
      try {
        const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tableName}\``)
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
  const backup: {
    metadata: {
      generatedAt: string
      host: string
      version: string
      type: string
    }
    directories: Record<string, string[]>
  } = {
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

function escapeSQLValue(value: unknown): string {
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
