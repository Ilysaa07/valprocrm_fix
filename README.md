# Valpro Portal - Employee Management System

A comprehensive CRM and employee management system built with Next.js, featuring task management, attendance tracking, payroll processing, and real-time communication.

## Features

- **User Management**: Role-based access control (Admin/Employee)
- **Task Management**: Create, assign, and track tasks with file attachments
- **Attendance System**: Check-in/out with location tracking and WFH validation
- **Payroll Management**: Automated salary calculations and slip generation
- **Real-time Chat**: Team communication with file sharing and stickers
- **Document Management**: Secure file storage with version control
- **Calendar Integration**: Event scheduling and reminders
- **Analytics Dashboard**: Performance metrics and reporting
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with Argon2 password hashing
- **Real-time**: Socket.IO for live updates
- **File Storage**: Local file system with organized structure
- **PDF Generation**: jsPDF for reports and invoices

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd valpro-portal
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.deployment.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="mysql://username:password@localhost:3306/valpro_portal"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Set up the database
```bash
npm run db:generate
npm run db:migrate
```

5. Create admin user
```bash
npm run admin:create
```

6. Start the development server
```bash
npm run dev
```

## Production Deployment

### Using PM2

1. Build the application
```bash
npm run build
```

2. Start with PM2
```bash
npm run pm2:start
```

3. Monitor the application
```bash
npm run pm2:logs
npm run pm2:monit
```

### Environment Configuration

For production, ensure these environment variables are set:

```env
NODE_ENV="production"
DATABASE_URL="mysql://username:password@localhost:3306/valpro_portal"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="strong-secret-key"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── admin/          # Admin dashboard pages
│   ├── employee/       # Employee dashboard pages
│   ├── api/            # API routes
│   └── auth/           # Authentication pages
├── components/         # Reusable React components
│   ├── layout/         # Layout components
│   ├── ui/             # UI components
│   └── dashboard/      # Dashboard-specific components
├── lib/                # Utility libraries
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

## Database Schema

The system uses MySQL with Prisma ORM. Key entities include:

- **Users**: Employee and admin accounts
- **Tasks**: Work assignments and tracking
- **Attendance**: Check-in/out records
- **Payroll**: Salary calculations and payments
- **Documents**: File management system
- **Messages**: Chat and notifications

## API Endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/admin/*` - Admin-specific operations
- `/api/employee/*` - Employee-specific operations
- `/api/tasks/*` - Task management
- `/api/attendance/*` - Attendance tracking
- `/api/payroll/*` - Payroll operations
- `/api/chat/*` - Real-time messaging

## Security Features

- Password hashing with Argon2
- JWT-based session management
- Role-based access control
- File upload validation
- SQL injection prevention with Prisma
- XSS protection with Next.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
