# Valpro CRM Deployment Guide

## Environment Setup

Create a `.env` file in the root directory with the following configuration:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/valprocrm"

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
```

## Deployment Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start with PM2**
   ```bash
   pm2 start npm --name "valprocrm" -- start
   ```

4. **Setup Nginx Reverse Proxy**
   - Configure Nginx to proxy requests to `http://localhost:3000`
   - Set up SSL with Certbot for `crm.valprointertech.com`

5. **Database Setup**
   ```bash
   npm run db:push
   ```

## PM2 Commands

- Start: `pm2 start npm --name "valprocrm" -- start`
- Stop: `pm2 stop valprocrm`
- Restart: `pm2 restart valprocrm`
- Logs: `pm2 logs valprocrm`
- Status: `pm2 status`
