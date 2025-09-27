# 🚀 Valpro CRM - Complete Deployment Guide

## 📋 **Project Overview**

Valpro CRM is a comprehensive Employee Management System built with Next.js 15, featuring task management, attendance tracking, document management, and real-time communication. This guide provides everything needed for successful deployment and maintenance.

## 🏗️ **Architecture**

### **Technology Stack**
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL 8.0+
- **Authentication**: NextAuth.js with Argon2 password hashing
- **Real-time**: Socket.IO
- **UI**: Tailwind CSS, Radix UI, Lucide React
- **File Storage**: Local storage with S3-ready architecture

### **Key Features**
- ✅ **User Management**: Admin/Employee roles with approval workflow
- ✅ **Task Management**: Full CRUD with file attachments and validation
- ✅ **Attendance System**: Check-in/out with GPS and WFH support
- ✅ **Document Management**: Upload, preview, download with version control
- ✅ **Real-time Chat**: Socket.IO based messaging system
- ✅ **Analytics Dashboard**: Comprehensive reporting and insights
- ✅ **Security**: Enterprise-grade authentication and rate limiting

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18.0.0 or higher
- MySQL 8.0 or higher
- npm 8.0.0 or higher

### **1. Installation**
```bash
# Clone the repository
git clone <repository-url>
cd valprocrm_fix

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### **2. Environment Setup**
Create `.env.local` file:
```bash
# Database
DATABASE_URL="mysql://username:password@localhost:3306/valpro_crm"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_ENABLED="true"

# Optional: Rate Limiting
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"
```

### **3. Database Setup**
```bash
# Push database schema
npx prisma db push

# Create admin user
npm run adminval:buat

# Seed sample data (optional)
npm run seed:tasks
```

### **4. Development**
```bash
# Start development server
npm run dev

# Access the application
# Admin: http://localhost:3000/admin
# Employee: http://localhost:3000/employee
```

## 🔧 **Production Deployment**

### **1. Build Optimization**
```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build

# Start production server
npm start
```

### **2. PM2 Configuration**
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### **3. Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

### **4. SSL Configuration**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🗄️ **Database Management**

### **Schema Overview**
- **Users**: User accounts with roles and status
- **Tasks**: Task management with assignments and submissions
- **Attendance**: Check-in/out records with GPS tracking
- **Documents**: File management with version control
- **Messages**: Real-time chat system
- **Notifications**: System notifications
- **LoginThrottle**: Rate limiting and security

### **Backup & Restore**
```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore

# Manual backup
mysqldump -u username -p valpro_crm > backup.sql

# Manual restore
mysql -u username -p valpro_crm < backup.sql
```

### **Migration Commands**
```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset --force
```

## 🔐 **Security Configuration**

### **Authentication System**
- **Password Hashing**: Argon2 with unique salts
- **Rate Limiting**: 5 attempts per email/IP, 15-minute lockout
- **Session Management**: JWT tokens with 30-day expiration
- **Input Validation**: XSS and SQL injection prevention

### **Security Headers**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]
```

### **Environment Security**
- Use strong, unique secrets for `NEXTAUTH_SECRET`
- Enable HTTPS in production
- Configure proper CORS settings
- Implement rate limiting
- Regular security updates

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```bash
# Check application status
curl http://localhost:3000/api/health

# Check database connection
npx prisma db pull

# Check PM2 status
pm2 status
pm2 logs
```

### **Performance Monitoring**
- **Response Times**: Monitor API response times
- **Memory Usage**: Track memory consumption
- **Database Performance**: Query optimization
- **Error Rates**: Track and analyze errors

### **Log Management**
```bash
# View application logs
pm2 logs valpro-crm

# View error logs
pm2 logs valpro-crm --err

# Log rotation
pm2 install pm2-logrotate
```

## 🧪 **Testing**

### **Test Suite**
```bash
# Run authentication tests
node -e "require('./src/lib/auth-tests').runAllTests()"

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### **Test Coverage**
- **Unit Tests**: Core authentication functions
- **Integration Tests**: API endpoints
- **Security Tests**: Rate limiting and validation
- **Performance Tests**: Load testing

## 🔄 **Updates & Maintenance**

### **Regular Maintenance Tasks**
1. **Security Updates**: Monthly dependency updates
2. **Database Optimization**: Query performance tuning
3. **Log Cleanup**: Archive old logs
4. **Backup Verification**: Test restore procedures
5. **Performance Monitoring**: Track metrics and optimize

### **Update Process**
```bash
# Backup current version
npm run db:backup

# Update dependencies
npm update

# Run migrations
npx prisma migrate deploy

# Test the update
npm run test

# Deploy
pm2 restart valpro-crm
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check database status
systemctl status mysql

# Test connection
mysql -u username -p -h localhost

# Reset Prisma client
npx prisma generate
```

#### **Authentication Issues**
```bash
# Check NextAuth configuration
cat .env.local | grep NEXTAUTH

# Verify database schema
npx prisma db pull

# Check user table
npx prisma studio
```

#### **Performance Issues**
```bash
# Check PM2 status
pm2 monit

# Check memory usage
free -h

# Check disk space
df -h
```

### **Error Codes**
- **401**: Unauthorized - Check authentication
- **403**: Forbidden - Check user permissions
- **404**: Not Found - Check file paths
- **429**: Rate Limited - Wait and retry
- **500**: Server Error - Check logs

## 📈 **Performance Optimization**

### **Database Optimization**
- **Indexes**: Ensure proper indexing on frequently queried columns
- **Query Optimization**: Use Prisma query optimization
- **Connection Pooling**: Configure database connection pooling
- **Caching**: Implement Redis caching for frequently accessed data

### **Application Optimization**
- **Code Splitting**: Implement dynamic imports
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring
- **CDN**: Use CDN for static assets

### **Server Optimization**
- **PM2 Clustering**: Use PM2 cluster mode
- **Nginx Caching**: Configure static file caching
- **Gzip Compression**: Enable compression
- **HTTP/2**: Use HTTP/2 for better performance

## 📚 **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### **Task Management**
- `GET /api/tasks` - List tasks with pagination
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### **File Management**
- `POST /api/documents` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/[id]/download` - Download document

### **Real-time Communication**
- `WebSocket /socket.io` - Real-time messaging
- `POST /api/chat/send` - Send message
- `GET /api/chat/messages` - Get messages

## 🎯 **Deployment Checklist**

### **Pre-deployment**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema up to date
- [ ] SSL certificate installed
- [ ] Backup procedures tested
- [ ] Monitoring configured

### **Post-deployment**
- [ ] Application accessible
- [ ] Authentication working
- [ ] Database connections stable
- [ ] Real-time features functional
- [ ] Performance metrics normal
- [ ] Error monitoring active

## 🆘 **Support & Resources**

### **Documentation**
- **API Reference**: Complete API documentation
- **Component Library**: UI component documentation
- **Database Schema**: Prisma schema reference
- **Deployment Guide**: This comprehensive guide

### **Monitoring Tools**
- **PM2**: Process management
- **Nginx**: Web server monitoring
- **MySQL**: Database monitoring
- **Application Logs**: Custom logging

### **Emergency Procedures**
1. **Service Down**: Check PM2 status and restart
2. **Database Issues**: Restore from backup
3. **Security Breach**: Rotate secrets and audit logs
4. **Performance Issues**: Scale horizontally or vertically

---

**Status**: ✅ **PRODUCTION READY** - Complete deployment guide with all necessary configurations, security measures, and maintenance procedures.

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Valpro Development Team

