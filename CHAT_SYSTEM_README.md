# Internal Chat System

A secure, real-time internal chat system for enterprise communication between employees and administrators.

## 🚀 Features

### Core Functionality
- **Real-time Messaging**: Instant message delivery using WebSocket technology
- **Direct & Group Chats**: Support for one-on-one and group conversations
- **File Attachments**: Share documents, images, and media files
- **Read Receipts**: Track message delivery and read status
- **Typing Indicators**: Real-time typing notifications
- **Message History**: Persistent message storage with search functionality

### Security & Compliance
- **End-to-End Encryption**: Messages encrypted in transit and at rest
- **Role-Based Access Control**: Different permissions for employees, supervisors, and admins
- **Audit Logging**: Comprehensive activity tracking for compliance
- **GDPR Compliance**: Data retention and deletion policies
- **Secure Authentication**: Integration with existing SSO/LDAP systems

### User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Intuitive Interface**: Modern, clean UI with minimal learning curve
- **Search & Filter**: Find conversations and messages quickly
- **Notifications**: Desktop and mobile push notifications
- **Do Not Disturb**: Customizable notification settings

### Admin Features
- **Message Moderation**: Delete, archive, and manage messages
- **User Management**: Add, remove, and manage conversation participants
- **Analytics Dashboard**: Usage statistics and activity reports
- **System Monitoring**: Real-time system health and performance metrics

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL with optimized indexes
- **Real-time**: Socket.IO for WebSocket connections
- **Authentication**: NextAuth.js with session management
- **Styling**: Tailwind CSS with responsive design
- **File Storage**: Configurable (local/S3/cloud storage)

### Database Schema
```
User
├── Basic profile information
├── Role-based permissions
└── Authentication details

Conversation
├── Direct or group chat
├── Participant management
└── Message threading

Message
├── Content and metadata
├── File attachments
├── Read receipts
└── Edit history

ConversationParticipant
├── User roles (Admin/Moderator/Member)
├── Join/leave timestamps
└── Permission levels

MessageAttachment
├── File metadata
├── Storage URLs
└── Security validation

MessageRead
├── Read timestamps
├── User tracking
└── Delivery confirmation
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or pnpm

### Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd employee-dashboard
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Database
   DATABASE_URL="mysql://user:password@localhost:3306/chat_db"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # File Storage (optional)
   UPLOAD_DIR="./uploads"
   MAX_FILE_SIZE=10485760
   
   # WebSocket
   SOCKET_CORS_ORIGIN="http://localhost:3000"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed initial data (optional)
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:3000
   - Navigate to `/chat` for the chat interface
   - Sign in with your credentials

## 🔧 Configuration

### Authentication Integration
The system integrates with your existing authentication system:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    // Configure your providers (Google, LDAP, etc.)
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        role: token.role,
      },
    }),
  },
};
```

### File Upload Configuration
Configure file storage and upload limits:

```typescript
// src/lib/upload.ts
export const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', 'application/pdf', 'text/*'],
  storageProvider: 'local', // or 's3', 'cloudinary'
};
```

### WebSocket Configuration
Customize WebSocket behavior:

```typescript
// src/lib/socket.ts
export const socketConfig = {
  cors: {
    origin: process.env.NEXTAUTH_URL,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
};
```

## 📱 Usage

### For Employees

1. **Starting a Conversation**
   - Click the "+" button in the chat header
   - Select "Direct Message" or "Group Chat"
   - Search and select participants
   - Enter group name (for group chats)
   - Click "Create Conversation"

2. **Sending Messages**
   - Type your message in the input field
   - Press Enter to send
   - Use Shift+Enter for new lines
   - Attach files using the paperclip icon

3. **Managing Conversations**
   - Search conversations using the search bar
   - Archive conversations you no longer need
   - View conversation participants and details

### For Administrators

1. **User Management**
   - Access admin panel at `/admin`
   - Manage user roles and permissions
   - Monitor system usage and activity

2. **Message Moderation**
   - Delete inappropriate messages
   - Archive conversations for compliance
   - View audit logs and activity reports

3. **System Monitoring**
   - Monitor WebSocket connections
   - Track message delivery rates
   - View system performance metrics

## 🔒 Security Features

### Data Protection
- **Encryption**: All messages encrypted using AES-256
- **Access Control**: Role-based permissions for all operations
- **Session Management**: Secure session handling with JWT tokens
- **Input Validation**: Comprehensive input sanitization and validation

### Compliance
- **GDPR**: Right to be forgotten, data portability
- **Audit Logging**: Complete activity tracking
- **Data Retention**: Configurable retention policies
- **Privacy Controls**: User-controlled data sharing

### Network Security
- **HTTPS**: All communications encrypted
- **CORS**: Proper cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Sanitization**: XSS and injection protection

## 🚀 Performance Optimization

### Database Optimization
- **Indexed Queries**: Optimized database indexes for fast queries
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Minimal database round trips

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Compressed and optimized images
- **Caching**: Browser and CDN caching strategies

### Real-time Optimization
- **WebSocket Management**: Efficient connection handling
- **Message Batching**: Optimized message delivery
- **Memory Management**: Proper cleanup and garbage collection

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📊 Monitoring & Analytics

### System Metrics
- Active connections
- Message delivery rates
- Response times
- Error rates

### User Analytics
- Most active conversations
- Peak usage times
- Feature adoption rates
- User engagement metrics

### Health Checks
```bash
# Check system health
curl http://localhost:3000/api/health

# Check WebSocket status
curl http://localhost:3000/api/socketio
```

## 🔧 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check firewall settings
   - Verify CORS configuration
   - Ensure proper SSL certificates

2. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity
   - Review connection pool settings

3. **File Upload Failures**
   - Check file size limits
   - Verify storage permissions
   - Review allowed file types

### Debug Mode
Enable debug logging:

```env
DEBUG=socket.io:*,prisma:*
LOG_LEVEL=debug
```

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple server instances
- **Database Sharding**: Distribute data across multiple databases
- **Redis Clustering**: Shared session and cache storage

### Vertical Scaling
- **Resource Optimization**: CPU and memory tuning
- **Database Optimization**: Query optimization and indexing
- **Caching Strategy**: Multi-level caching implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Note**: This chat system is designed for internal enterprise use. Ensure compliance with your organization's security policies and data protection regulations.
