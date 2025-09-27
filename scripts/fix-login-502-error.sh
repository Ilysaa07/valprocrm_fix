#!/bin/bash

echo "🔧 Valpro CRM - Fix Login 502 Error"
echo "==================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📊 Checking current status..."

# Check PM2 status
echo "🔍 PM2 Status:"
pm2 status

# Check memory usage
echo "🔍 Memory Usage:"
free -h

# Check disk space
echo "🔍 Disk Space:"
df -h

echo ""
echo "🛠️ Applying fixes for login 502 error..."

# 1. Clear rate limiting data
echo "1️⃣ Clearing rate limiting data..."
mysql -u root -p -e "DELETE FROM RateLimit WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR);" 2>/dev/null || echo "⚠️ Could not clear rate limit data"

# 2. Clear login throttle data
echo "2️⃣ Clearing login throttle data..."
mysql -u root -p -e "DELETE FROM LoginThrottle WHERE lockedUntil < NOW();" 2>/dev/null || echo "⚠️ Could not clear login throttle data"

# 3. Restart PM2 with memory limit
echo "3️⃣ Restarting PM2 with memory optimization..."
pm2 stop all
pm2 delete all

# Update ecosystem config with better memory management
cat > ecosystem.production.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'valproems',
    script: 'server.js',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M', // Reduced memory limit
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Add process management
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 4000
  }]
}
EOF

# 4. Install dependencies
echo "4️⃣ Installing dependencies..."
npm install

# 5. Generate Prisma client
echo "5️⃣ Generating Prisma client..."
npx prisma generate

# 6. Build application
echo "6️⃣ Building application..."
npm run build

# 7. Start with optimized PM2
echo "7️⃣ Starting application with optimized PM2..."
pm2 start ecosystem.production.config.js

# 8. Save PM2 configuration
pm2 save

# 9. Setup PM2 startup
pm2 startup

# 10. Restart Nginx with optimized settings
echo "8️⃣ Optimizing Nginx configuration..."
sudo tee /etc/nginx/sites-available/valproems > /dev/null << 'EOF'
server {
    listen 80;
    server_name ems.valprointertech.com;
    
    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Increase buffer sizes
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Add timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 11. Test and restart Nginx
echo "9️⃣ Testing and restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# 12. Check final status
echo ""
echo "📊 Final Status Check:"
echo "PM2 Status:"
pm2 status

echo "Port 3000:"
netstat -tlnp | grep :3000

echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo "Memory Usage:"
free -h

echo ""
echo "✅ Login 502 error fix completed!"
echo "🌐 Test your application at: https://ems.valprointertech.com"
echo "📝 Monitor logs with: pm2 logs valproems"
echo "🔄 If issues persist, check: pm2 monit"
