const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  // Expose Socket.IO globally for API routes to emit events
  global.io = io

  // Presence tracking: userId -> connection count and metadata
  const onlineCounts = new Map()
  const userMeta = new Map() // userId -> { name, role }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Authenticate and join user room for notifications + presence
    socket.on('authenticate', (payload) => {
      try {
        const userId = payload && (payload.userId || payload.id)
        const name = payload && payload.name
        const role = payload && payload.role
        if (userId) {
          const uid = String(userId)
          socket.data.userId = uid
          socket.join(`user:${uid}`)
          if (name) userMeta.set(uid, { name, role })
          // Increment presence counter
          const prev = onlineCounts.get(uid) || 0
          onlineCounts.set(uid, prev + 1)
          // If first connection for this user, broadcast online
          if (prev === 0) {
            io.emit('presence_update', { userId: uid, isOnline: true, name, role })
            io.emit('user_online', { userId: uid, name, role })
          }
          socket.emit('authenticated')
        }
      } catch {}
    })

    // Join/leave conversation rooms for realtime delivery
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return
      socket.leave(`conversation:${conversationId}`)
    })

    // Typing indicators
    socket.on('typing_start', (data) => {
      if (!data?.conversationId || !data?.userId) return
      io.to(`conversation:${data.conversationId}`).emit('user_typing', {
        conversationId: String(data.conversationId),
        userId: String(data.userId),
        isTyping: true,
      })
    })

    socket.on('typing_stop', (data) => {
      if (!data?.conversationId || !data?.userId) return
      io.to(`conversation:${data.conversationId}`).emit('user_typing', {
        conversationId: String(data.conversationId),
        userId: String(data.userId),
        isTyping: false,
      })
    })

    // Forward message delete acknowledgements immediately to sender socket room
    socket.on('ack_message_deleted', (data) => {
      if (!data?.conversationId || !data?.messageId) return
      io.to(`conversation:${data.conversationId}`).emit('message_deleted', data)
    })

    // Online users list on demand
    socket.on('get_online_users', () => {
      try {
        const list = Array.from(onlineCounts.entries())
          .filter(([_, count]) => count > 0)
          .map(([uid]) => uid)
        socket.emit('online_users', list)
      } catch {}
    })

    socket.on('disconnect', () => {
      const uid = socket.data.userId
      if (uid) {
        const prev = onlineCounts.get(uid) || 0
        const next = Math.max(0, prev - 1)
        if (next === 0) {
          onlineCounts.delete(uid)
          const meta = userMeta.get(uid) || {}
          io.emit('presence_update', { userId: uid, isOnline: false, name: meta.name, role: meta.role })
          io.emit('user_offline', { userId: uid, name: meta.name, role: meta.role })
        } else {
          onlineCounts.set(uid, next)
        }
      }
      console.log('Client disconnected:', socket.id)
    })
  })

  server.listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
