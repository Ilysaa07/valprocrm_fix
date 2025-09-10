/*
  Drop tables that are not defined in prisma/schema.prisma
  Usage:
    node scripts/db-drop-unused-tables.js            # dry run, print tables to drop
    node scripts/db-drop-unused-tables.js --yes      # actually drop
*/

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

function parseModelTableNames(schemaPath) {
  const schema = fs.readFileSync(schemaPath, 'utf8')
  const modelRegex = /model\s+(\w+)\s+\{/g
  const tableNameRegex = /@@map\("([^"]+)"\)/
  const fieldMapRegex = /@map\("([^"]+)"\)/ // unused here but kept for future
  const blockRegex = /model\s+\w+\s+\{[\s\S]*?\}/g
  const blocks = schema.match(blockRegex) || []
  const tableNames = new Set()
  for (const block of blocks) {
    const nameMatch = /model\s+(\w+)\s+\{/.exec(block)
    if (!nameMatch) continue
    const modelName = nameMatch[1]
    const mapMatch = tableNameRegex.exec(block)
    const tableName = mapMatch ? mapMatch[1] : modelName
    tableNames.add(tableName)
  }
  return tableNames
}

async function main() {
  const yes = process.argv.includes('--yes') || process.argv.includes('-y')
  const prisma = new PrismaClient()
  try {
    const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma')
    const expectedTables = parseModelTableNames(schemaPath)

    // Read real tables from DB
    const rows = await prisma.$queryRawUnsafe('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"')
    const tableNames = rows.map(r => Object.values(r)[0])

    // Prisma migration tables to keep
    const protectedPrefixes = ['_prisma_', 'sqlite_', 'mysql_', 'pg_', 'migrations']
    const protectedExact = new Set(['_prisma_migrations'])

    const toDrop = tableNames.filter((t) => {
      if (protectedExact.has(t)) return false
      if (protectedPrefixes.some(p => t.startsWith(p))) return false
      return !expectedTables.has(t)
    })

    if (toDrop.length === 0) {
      console.log('No unused tables found. Database is clean.')
      return
    }

    console.log('Unused tables detected:\n - ' + toDrop.join('\n - '))
    if (!yes) {
      console.log('\nDry run. Pass --yes to drop these tables.')
      return
    }

    for (const t of toDrop) {
      console.log('Dropping table:', t)
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${t}\``)
    }
    console.log('Done.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


