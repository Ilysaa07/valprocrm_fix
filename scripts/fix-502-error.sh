#!/bin/bash

echo "🔧 Valpro CRM - Fix 502 Bad Gateway Error"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📊 Checking current status..."

# Check PM2 status
echo "🔍 PM2 Status:"
pm2 status

# Check if port 3000 is listening
echo "🔍 Port 3000 Status:"
netstat -tlnp | grep :3000 || echo "❌ Port 3000 not listening"

# Check Nginx status
echo "🔍 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🛠️ Attempting fixes..."

# 1. Stop all PM2 processes
echo "1️⃣ Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# 2. Install dependencies
echo "2️⃣ Installing dependencies..."
npm install

# 3. Generate Prisma client
echo "3️⃣ Generating Prisma client..."
npx prisma generate

# 4. Build application
echo "4️⃣ Building application..."
npm run build

# 5. Start with PM2
echo "5️⃣ Starting application with PM2..."
pm2 start ecosystem.production.config.js

# 6. Save PM2 configuration
pm2 save

# 7. Restart Nginx
echo "6️⃣ Restarting Nginx..."
sudo systemctl restart nginx

# 8. Check final status
echo ""
echo "📊 Final Status Check:"
echo "PM2 Status:"
pm2 status

echo "Port 3000:"
netstat -tlnp | grep :3000

echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ Fix attempt completed!"
echo "🌐 Check your application at: https://ems.valprointertech.com"
echo "📝 If still having issues, check logs with: pm2 logs valproems"
