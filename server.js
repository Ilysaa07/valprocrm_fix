const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server: SocketIOServer } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO server
  const io = new SocketIOServer(server, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  // Store io instance globally for API routes
  global.io = io

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Handle chat messages
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`)
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`)
    })

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`)
      console.log(`Socket ${socket.id} left conversation ${conversationId}`)
    })

    socket.on('send-message', (data) => {
      // Broadcast to all clients in the conversation
      socket.to(`conversation-${data.conversationId}`).emit('new-message', data)
    })

    // Handle attendance notifications
    socket.on('attendance-update', (data) => {
      // Broadcast to all connected clients
      io.emit('attendance-notification', data)
    })

    // Handle general notifications
    socket.on('send-notification', (data) => {
      // Broadcast to all connected clients
      io.emit('notification', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.IO server running on /socket.io`)
  })
})
