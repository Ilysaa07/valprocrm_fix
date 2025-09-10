const fs = require('fs')
const path = require('path')

function verifyEnvironmentConfiguration() {
  console.log('🔍 Verifying environment configuration...\n')
  
  const envPath = path.join(process.cwd(), '.env')
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ File .env tidak ditemukan!')
    console.log('💡 Jalankan: npm run env:unify')
    return false
  }
  
  // Read .env content
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  
  console.log('✅ File .env ditemukan')
  console.log(`📊 Total konfigurasi: ${lines.length} variabel\n`)
  
  // Check for required variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NODE_ENV',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  const missingVars = []
  const presentVars = []
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      presentVars.push(varName)
    } else {
      missingVars.push(varName)
    }
  })
  
  console.log('📋 Required Variables Status:')
  presentVars.forEach(varName => {
    console.log(`✅ ${varName}`)
  })
  
  if (missingVars.length > 0) {
    console.log('\n❌ Missing Required Variables:')
    missingVars.forEach(varName => {
      console.log(`❌ ${varName}`)
    })
  }
  
  // Check for admin variables
  const adminVars = [
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'ADMIN_NAME'
  ]
  
  const adminVarsPresent = adminVars.filter(varName => envContent.includes(varName))
  
  console.log('\n👤 Admin Variables Status:')
  if (adminVarsPresent.length > 0) {
    console.log(`✅ ${adminVarsPresent.length}/${adminVars.length} admin variables present`)
    adminVarsPresent.forEach(varName => {
      const isCommented = envContent.includes(`# ${varName}`)
      console.log(`${isCommented ? '💤' : '✅'} ${varName} ${isCommented ? '(commented)' : '(active)'}`)
    })
  } else {
    console.log('💤 Admin variables not configured (optional)')
  }
  
  // Check for duplicate environment files
  const duplicateFiles = [
    'env.deployment.example',
    'env.production.example',
    'env.unified'
  ]
  
  const existingDuplicates = duplicateFiles.filter(file => {
    const filePath = path.join(process.cwd(), file)
    return fs.existsSync(filePath)
  })
  
  console.log('\n🗂️  Duplicate Files Status:')
  if (existingDuplicates.length === 0) {
    console.log('✅ No duplicate environment files found')
  } else {
    console.log('⚠️  Duplicate files found:')
    existingDuplicates.forEach(file => {
      console.log(`⚠️  ${file}`)
    })
    console.log('💡 Consider removing these files to avoid confusion')
  }
  
  // Summary
  console.log('\n📊 Summary:')
  console.log(`✅ Environment file: ${fs.existsSync(envPath) ? 'Present' : 'Missing'}`)
  console.log(`✅ Required variables: ${presentVars.length}/${requiredVars.length}`)
  console.log(`✅ Admin variables: ${adminVarsPresent.length}/${adminVars.length}`)
  console.log(`✅ Duplicate files: ${existingDuplicates.length === 0 ? 'None' : existingDuplicates.length + ' found'}`)
  
  const isHealthy = fs.existsSync(envPath) && missingVars.length === 0
  
  if (isHealthy) {
    console.log('\n🎉 Environment configuration is healthy!')
  } else {
    console.log('\n⚠️  Environment configuration needs attention!')
  }
  
  return isHealthy
}

verifyEnvironmentConfiguration()
