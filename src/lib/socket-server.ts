import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

export const initSocketServer = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  return io
}