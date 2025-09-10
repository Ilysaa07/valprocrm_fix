const fs = require('fs')
const path = require('path')

function unifyEnvironmentFiles() {
  console.log('🔄 Unifying environment configuration...')
  
  // Read the unified environment template
  const unifiedEnvPath = path.join(process.cwd(), 'env.unified')
  
  if (!fs.existsSync(unifiedEnvPath)) {
    console.log('❌ File env.unified tidak ditemukan!')
    return
  }
  
  const unifiedContent = fs.readFileSync(unifiedEnvPath, 'utf8')
  
  // Write to .env
  const envPath = path.join(process.cwd(), '.env')
  fs.writeFileSync(envPath, unifiedContent)
  
  console.log('✅ File .env berhasil dibuat dengan konfigurasi unified!')
  
  // Clean up duplicate environment files
  const filesToRemove = [
    'env.deployment.example',
    'env.production.example',
    'env.unified'
  ]
  
  filesToRemove.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`🗑️  Removed duplicate file: ${file}`)
    }
  })
  
  console.log('\n📋 Environment files status:')
  console.log('✅ .env - Main environment file (unified)')
  console.log('✅ env.example - Template for reference')
  
  console.log('\n💡 Next steps:')
  console.log('1. Edit .env file sesuai kebutuhan Anda')
  console.log('2. Uncomment variabel admin jika diperlukan')
  console.log('3. Update database URL dan secret keys untuk production')
}

unifyEnvironmentFiles()
