/*
  Cleanup logs, caches, and old builds
*/
const fs = require('fs')
const path = require('path')

function rmSafe(p) {
  try {
    if (!fs.existsSync(p)) return
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true })
    } else {
      fs.unlinkSync(p)
    }
  } catch {}
}

function main() {
  const root = process.cwd()
  const targets = [
    '.next',
    '.turbo',
    'dist',
    'build',
    'app.log',
    'coverage',
    'node_modules/.cache',
    'pnpm-lock.yaml.backup',
  ]
  for (const t of targets) {
    rmSafe(path.resolve(root, t))
  }
  console.log('Cleanup complete.')
}

main()


