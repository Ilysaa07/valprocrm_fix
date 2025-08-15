import { io, Socket } from 'socket.io-client'

export interface ChatAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: Date
  messageType?: 'TEXT' | 'FILE' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DELETED'
  attachments?: ChatAttachment[]
  sender?: {
    id: string
    fullName: string
    profilePicture?: string
  }
  readByUserIds?: string[]
}

export interface AttendanceNotification {
  userId: string
  attendanceId: string
  userName: string
  status?: string
  distanceMeters?: number
  timestamp: string
}

// Note: This module is client-only. Server-side Socket.IO is handled in `src/lib/socket-server.ts` or `server.js`.

class SocketClient {
  private static socket: Socket | null = null

  public static getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      })
    }
    return this.socket
  }

  public static disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export default SocketClient

export const getSocketIO = () => (global as any).io
