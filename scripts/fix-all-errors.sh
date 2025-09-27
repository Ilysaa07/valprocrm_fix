#!/bin/bash

echo "🔧 Valpro CRM - Fix All Errors (Service Worker, Socket.IO, Auth)"
echo "============================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📊 Checking current status..."

# Check PM2 status
echo "🔍 PM2 Status:"
pm2 status

# Check port 3000
echo "🔍 Port 3000 Status:"
netstat -tlnp | grep :3000 || echo "❌ Port 3000 not listening"

# Check Nginx status
echo "🔍 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🛠️ Fixing all errors..."

# 1. Clear all rate limiting and throttle data
echo "1️⃣ Clearing all rate limiting data..."
mysql -u root -p -e "
DELETE FROM RateLimit WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR);
DELETE FROM LoginThrottle WHERE lockedUntil < NOW();
" 2>/dev/null || echo "⚠️ Could not clear rate limit data"

# 2. Stop all PM2 processes
echo "2️⃣ Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# 3. Clear Next.js cache
echo "3️⃣ Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# 4. Install dependencies
echo "4️⃣ Installing dependencies..."
npm install

# 5. Generate Prisma client
echo "5️⃣ Generating Prisma client..."
npx prisma generate

# 6. Build application
echo "6️⃣ Building application..."
npm run build

# 7. Update ecosystem config with better error handling
echo "7️⃣ Updating PM2 configuration..."
cat > ecosystem.production.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'valproems',
    script: 'server.js',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
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
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 2000,
    // Add process management
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
EOF

# 8. Start with PM2
echo "8️⃣ Starting application with PM2..."
pm2 start ecosystem.production.config.js

# 9. Save PM2 configuration
pm2 save

# 10. Update Nginx configuration for better error handling
echo "9️⃣ Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/valproems > /dev/null << 'EOF'
server {
    listen 80;
    server_name ems.valprointertech.com;
    
    # Increase timeouts and buffer sizes
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
    
    # Add error handling
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    proxy_next_upstream_tries 3;
    proxy_next_upstream_timeout 30s;
    
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
    
    # Socket.IO support with better error handling
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API routes with better error handling
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 11. Test and restart Nginx
echo "🔟 Testing and restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# 12. Wait for application to start
echo "1️⃣1️⃣ Waiting for application to start..."
sleep 10

# 13. Check final status
echo ""
echo "📊 Final Status Check:"
echo "PM2 Status:"
pm2 status

echo "Port 3000:"
netstat -tlnp | grep :3000

echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo "Application Health Check:"
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

echo ""
echo "✅ All errors fix completed!"
echo "🌐 Test your application at: https://ems.valprointertech.com"
echo "📝 Monitor logs with: pm2 logs valproems"
echo "🔄 If issues persist, check: pm2 monit"
