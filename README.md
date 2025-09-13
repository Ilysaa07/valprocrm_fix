# Valpro CRM - Employee Management System

A comprehensive employee management system built with Next.js, featuring task management, attendance tracking, payroll, and more.

## Features

- **User Management**: Admin and employee roles with secure authentication
- **Task Management**: Create, assign, and track tasks with file attachments
- **Attendance System**: Check-in/out, leave requests, and WFH tracking
- **Payroll Management**: Comprehensive payroll system with components
- **Document Management**: Secure document storage and sharing
- **Project Management**: Project tracking with milestones and team members
- **Contact Management**: Client and contact relationship management
- **Real-time Chat**: Internal communication system
- **Analytics Dashboard**: Comprehensive reporting and analytics

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Real-time**: Socket.io

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ilysaa07/valprocrm.git
   cd valprocrm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   npm run db:push
   ```

5. **Create admin user**
   ```bash
   npm run adminval:buat
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Production Deployment

### Using the deployment script

```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start with PM2**
   ```bash
   pm2 start npm --name "valprocrm" -- start
   ```

3. **Setup Nginx reverse proxy**
   - Copy `nginx.conf` to `/etc/nginx/sites-available/valprocrm`
   - Enable the site and restart Nginx

4. **Setup SSL with Certbot**
   ```bash
   sudo certbot --nginx -d crm.valprointertech.com
   ```

## Environment Variables

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/valprocrm"

# NextAuth Configuration
NEXTAUTH_URL="https://crm.valprointertech.com"
NEXTAUTH_SECRET="your-super-secret-jwt-key"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://crm.valprointertech.com"

# File Upload Configuration
UPLOAD_DIR="./storage"
MAX_FILE_SIZE="10485760"

# Socket.IO Configuration
SOCKET_PORT="3001"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run adminval:buat` - Create admin user

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── admin/          # Admin pages
│   ├── employee/       # Employee pages
│   ├── api/           # API routes
│   └── auth/          # Authentication pages
├── components/         # React components
│   ├── dashboard/     # Dashboard components
│   ├── layout/        # Layout components
│   └── ui/           # UI components
├── lib/               # Utility libraries
├── hooks/             # Custom React hooks
└── types/             # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
