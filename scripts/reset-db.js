require('dotenv').config()
const { execSync } = require('child_process')
const url = require('url')
const mysql = require('mysql2/promise')

function parseDatabaseUrl(dbUrl) {
  const u = new url.URL(dbUrl)
  return {
    user: decodeURIComponent(u.username || 'root'),
    password: decodeURIComponent(u.password || ''),
    host: u.hostname || 'localhost',
    port: Number(u.port || '3306'),
    database: u.pathname.replace(/^\//, '') || 'valproerp',
  }
}

function run(cmd, extraEnv = {}) {
  console.log('> ' + cmd)
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...extraEnv } })
}

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL tidak ditemukan. Set variabel di .env atau environment')
    process.exit(1)
  }
  const cfg = parseDatabaseUrl(dbUrl)
  const targetDbName = process.env.DB_NAME || 'valproerp'

  const connection = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
  })

  const dbName = targetDbName.replace(/`/g, '``')
  console.log(`Men-drop & membuat ulang database: ${targetDbName}`)
  await connection.query(
    `DROP DATABASE IF EXISTS \`${dbName}\`; CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  )
  await connection.end()

  // Build DATABASE_URL untuk DB target
  const u = new url.URL(dbUrl)
  u.pathname = `/${targetDbName}`
  const targetDbUrl = u.toString()
  console.log('DATABASE_URL target =>', targetDbUrl)

  // Regenerate Prisma Client to ensure local engine (undo any previous --no-engine)
  run(`npx prisma generate`, { DATABASE_URL: targetDbUrl })
  // Jalankan migrasi dan seed ke DB target menggunakan Prisma
  run(`npx prisma migrate deploy`, { DATABASE_URL: targetDbUrl })
  run(`npm run db:seed`, { DATABASE_URL: targetDbUrl })

  console.log('Database reset selesai untuk DB:', targetDbName)
}

main().catch((e) => {
  console.error('Reset DB gagal:', e)
  process.exit(1)
})


