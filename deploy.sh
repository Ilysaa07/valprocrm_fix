#!/bin/bash

# Valpro CRM Deployment Script
# Run this script on your VPS to deploy the application

echo "🚀 Starting Valpro CRM Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally (if not already installed)
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
fi

# Install Nginx (if not already installed)
if ! command -v nginx &> /dev/null; then
    echo "📥 Installing Nginx..."
    sudo apt install -y nginx
fi

# Install MySQL (if not already installed)
if ! command -v mysql &> /dev/null; then
    echo "📥 Installing MySQL..."
    sudo apt install -y mysql-server
fi

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo "📥 Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Create project directory
PROJECT_DIR="/var/www/valproems"
echo "📁 Creating project directory: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "🔄 Updating repository..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/Ilysaa07/valprocrm.git $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Setup environment file
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "⚙️ Creating environment file..."
    cat > $PROJECT_DIR/.env << EOF
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/valproems"

# NextAuth Configuration
NEXTAUTH_URL="https://crm.valprointertech.com"
NEXTAUTH_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://crm.valprointertech.com"

# File Upload Configuration
UPLOAD_DIR="./storage"
MAX_FILE_SIZE="10485760"

# Email Configuration (Optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# Socket.IO Configuration
SOCKET_PORT="3001"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
EOF
    echo "⚠️ Please update the .env file with your actual configuration!"
fi

# Setup database
echo "🗄️ Setting up database..."
npm run db:push

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# Update PM2 ecosystem config
sed -i "s|/path/to/your/project|$PROJECT_DIR|g" $PROJECT_DIR/ecosystem.config.js

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo cp $PROJECT_DIR/nginx.conf /etc/nginx/sites-available/valproems
sudo ln -sf /etc/nginx/sites-available/valproems /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start services
echo "🚀 Starting services..."

# Start PM2 application
pm2 start $PROJECT_DIR/ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL with Certbot
echo "🔒 Setting up SSL certificate..."
sudo certbot --nginx -d crm.valprointertech.com --non-interactive --agree-tos --email your-email@example.com

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at: https://crm.valprointertech.com"
echo "📊 PM2 Status: pm2 status"
echo "📝 PM2 Logs: pm2 logs valproems"
echo "🔄 Restart: pm2 restart valproems"
