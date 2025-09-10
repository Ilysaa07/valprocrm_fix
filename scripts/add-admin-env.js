const fs = require('fs')
const path = require('path')

function addAdminEnvVars() {
  const envPath = path.join(process.cwd(), '.env')
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ File .env tidak ditemukan!')
    return
  }
  
  // Read current .env content
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  // Check if admin variables already exist
  if (envContent.includes('ADMIN_EMAIL')) {
    console.log('⚠️  Variabel admin sudah ada di file .env')
    console.log('📝 Variabel admin yang ada:')
    
    const lines = envContent.split('\n')
    lines.forEach(line => {
      if (line.startsWith('ADMIN_')) {
        console.log(`   ${line}`)
      }
    })
    return
  }
  
  // Admin variables to add
  const adminVars = `
# Admin Account Configuration (untuk deployment)
# Uncomment dan sesuaikan dengan kebutuhan Anda:
# ADMIN_EMAIL="admin@yourcompany.com"
# ADMIN_PASSWORD="your_secure_password_here"
# ADMIN_NAME="Your Name"
# ADMIN_PHONE="+6281234567890"
# ADMIN_ADDRESS="Your Address"
# ADMIN_BANK_ACCOUNT="1234567890"
# ADMIN_EWALLET="081234567890"
`
  
  // Add admin variables to .env
  const updatedContent = envContent + adminVars
  
  // Write back to .env
  fs.writeFileSync(envPath, updatedContent)
  
  console.log('✅ Variabel admin berhasil ditambahkan ke file .env')
  console.log('📝 Variabel yang ditambahkan:')
  console.log('   ADMIN_EMAIL (commented)')
  console.log('   ADMIN_PASSWORD (commented)')
  console.log('   ADMIN_NAME (commented)')
  console.log('   ADMIN_PHONE (commented)')
  console.log('   ADMIN_ADDRESS (commented)')
  console.log('   ADMIN_BANK_ACCOUNT (commented)')
  console.log('   ADMIN_EWALLET (commented)')
  console.log('\n💡 Uncomment dan sesuaikan variabel sesuai kebutuhan Anda!')
}

addAdminEnvVars()
