#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🧹 Valpro CRM - Project Cleanup Script')
console.log('=====================================\n')

// Cleanup steps
const cleanupSteps = [
  {
    name: 'Remove development files',
    action: 'dev-files'
  },
  {
    name: 'Clean build artifacts',
    action: 'build-clean'
  },
  {
    name: 'Remove temporary files',
    action: 'temp-files'
  },
  {
    name: 'Optimize package.json',
    action: 'package-optimize'
  },
  {
    name: 'Create production build',
    action: 'production-build'
  },
  {
    name: 'Verify deployment readiness',
    action: 'verify'
  }
]

// Remove development files
const removeDevFiles = () => {
  console.log('🗑️  Removing development files...')
  
  const devFiles = [
    'dev.log',
    'todo.md',
    '.next/types',
    'tsconfig.tsbuildinfo'
  ]
  
  devFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true })
        } else {
          fs.unlinkSync(file)
        }
        console.log(`  ✅ Removed: ${file}`)
      }
    } catch (error) {
      console.log(`  ⚠️  Could not remove ${file}: ${error.message}`)
    }
  })
}

// Clean build artifacts
const cleanBuildArtifacts = () => {
  console.log('🧹 Cleaning build artifacts...')
  
  try {
    // Remove .next directory
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true })
      console.log('  ✅ Removed .next directory')
    }
    
    // Remove node_modules/.cache
    if (fs.existsSync('node_modules/.cache')) {
      fs.rmSync('node_modules/.cache', { recursive: true, force: true })
      console.log('  ✅ Removed node_modules/.cache')
    }
    
    console.log('  ✅ Build artifacts cleaned')
  } catch (error) {
    console.log(`  ⚠️  Error cleaning build artifacts: ${error.message}`)
  }
}

// Remove temporary files
const removeTempFiles = () => {
  console.log('🗑️  Removing temporary files...')
  
  const tempFiles = [
    '*.tmp',
    '*.log',
    '*.pid',
    '.DS_Store',
    'Thumbs.db'
  ]
  
  tempFiles.forEach(pattern => {
    try {
      execSync(`find . -name "${pattern}" -type f -delete 2>/dev/null || true`, { stdio: 'inherit' })
    } catch (error) {
      // Ignore errors for patterns that don't exist
    }
  })
  
  console.log('  ✅ Temporary files cleaned')
}

// Optimize package.json
const optimizePackageJson = () => {
  console.log('📦 Optimizing package.json...')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    // Remove development-only scripts
    const productionScripts = {
      'dev': packageJson.scripts.dev,
      'build': packageJson.scripts.build,
      'start': packageJson.scripts.start,
      'lint': packageJson.scripts.lint,
      'type-check': packageJson.scripts['type-check'],
      'db:generate': packageJson.scripts['db:generate'],
      'db:push': packageJson.scripts['db:push'],
      'db:migrate': packageJson.scripts['db:migrate'],
      'adminval:buat': packageJson.scripts['adminval:buat'],
      'seed:tasks': packageJson.scripts['seed:tasks']
    }
    
    packageJson.scripts = productionScripts
    
    // Add production-specific scripts
    packageJson.scripts['db:backup'] = 'node scripts/backup-database.js'
    packageJson.scripts['db:restore'] = 'node scripts/restore-database.js'
    packageJson.scripts['health-check'] = 'curl -f http://localhost:3000/api/health || exit 1'
    
    // Add production metadata
    packageJson.engines = {
      'node': '>=18.0.0',
      'npm': '>=8.0.0'
    }
    
    packageJson.keywords = [
      'employee-management',
      'task-management',
      'attendance',
      'nextjs',
      'prisma',
      'mysql',
      'production-ready'
    ]
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
    console.log('  ✅ package.json optimized for production')
  } catch (error) {
    console.log(`  ⚠️  Error optimizing package.json: ${error.message}`)
  }
}

// Create production build
const createProductionBuild = () => {
  console.log('🏗️  Creating production build...')
  
  try {
    // Install production dependencies only
    console.log('  Installing production dependencies...')
    execSync('npm ci --only=production', { stdio: 'inherit' })
    
    // Generate Prisma client
    console.log('  Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Build the application
    console.log('  Building application...')
    execSync('npm run build', { stdio: 'inherit' })
    
    console.log('  ✅ Production build created successfully')
  } catch (error) {
    console.log(`  ❌ Error creating production build: ${error.message}`)
    throw error
  }
}

// Verify deployment readiness
const verifyDeployment = () => {
  console.log('✅ Verifying deployment readiness...')
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'server.js',
    'ecosystem.config.js',
    'nginx.conf',
    'PROJECT_DEPLOYMENT_GUIDE.md',
    'src/app/layout.tsx',
    'src/lib/auth.ts',
    'src/lib/prisma.ts',
    'prisma/schema.prisma'
  ]
  
  const missingFiles = []
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file)
    }
  })
  
  if (missingFiles.length > 0) {
    console.log('  ❌ Missing required files:')
    missingFiles.forEach(file => {
      console.log(`    - ${file}`)
    })
    return false
  }
  
  // Check if build exists
  if (!fs.existsSync('.next')) {
    console.log('  ❌ Build directory not found. Run "npm run build" first.')
    return false
  }
  
  // Check package.json scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredScripts = ['dev', 'build', 'start', 'lint']
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script])
  
  if (missingScripts.length > 0) {
    console.log('  ❌ Missing required scripts:')
    missingScripts.forEach(script => {
      console.log(`    - ${script}`)
    })
    return false
  }
  
  console.log('  ✅ All required files present')
  console.log('  ✅ Build directory exists')
  console.log('  ✅ Required scripts present')
  console.log('  ✅ Project is deployment ready!')
  
  return true
}

// Main cleanup function
const runCleanup = async () => {
  try {
    for (const step of cleanupSteps) {
      console.log(`\n🔄 ${step.name}...`)
      
      switch (step.action) {
        case 'dev-files':
          removeDevFiles()
          break
        case 'build-clean':
          cleanBuildArtifacts()
          break
        case 'temp-files':
          removeTempFiles()
          break
        case 'package-optimize':
          optimizePackageJson()
          break
        case 'production-build':
          createProductionBuild()
          break
        case 'verify':
          const isReady = verifyDeployment()
          if (!isReady) {
            throw new Error('Deployment verification failed')
          }
          break
      }
      
      console.log(`  ✅ ${step.name} completed`)
    }
    
    console.log('\n🎉 Project cleanup completed successfully!')
    console.log('\n📋 Project Status:')
    console.log('✅ Development files removed')
    console.log('✅ Build artifacts cleaned')
    console.log('✅ Temporary files removed')
    console.log('✅ Package.json optimized')
    console.log('✅ Production build created')
    console.log('✅ Deployment ready verified')
    
    console.log('\n🚀 Ready for deployment!')
    console.log('\n📚 Next steps:')
    console.log('1. Review PROJECT_DEPLOYMENT_GUIDE.md')
    console.log('2. Configure environment variables')
    console.log('3. Set up database')
    console.log('4. Deploy to production server')
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check the error message above')
    console.log('2. Ensure all dependencies are installed')
    console.log('3. Verify file permissions')
    console.log('4. Run individual cleanup steps manually')
    process.exit(1)
  }
}

// Run cleanup
runCleanup()

