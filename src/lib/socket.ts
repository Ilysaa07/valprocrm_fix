"use client"

import { useEffect, useRef } from 'react'
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
  messageType?: 'TEXT' | 'FILE' | 'IMAGE' | 'VIDEO' | 'DELETED'
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

// React client component to bootstrap the socket connection when rendered
export default function SocketBootstrapper() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const socket = SocketClient.getSocket()
    // preload audio
    try {
      const audio = new Audio('/notification.mp3')
      audioRef.current = audio
    } catch {}

    const handleNotification = (payload: any) => {
      // Play sound
      try { audioRef.current?.play().catch(() => {}) } catch {}
      // Fire a simple browser notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(payload?.title || 'Notifikasi Baru', { body: payload?.message || 'Anda memiliki notifikasi baru.' })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') new Notification(payload?.title || 'Notifikasi Baru', { body: payload?.message || 'Anda memiliki notifikasi baru.' })
          })
        }
      }
      // Emit custom event so pages/layouts can show fancy toast
      try {
        window.dispatchEvent(new CustomEvent('app:new-notification', { detail: payload }))
      } catch {}
    }

    socket.on('notification', handleNotification)
    return () => {
      try { socket.off('notification', handleNotification) } catch {}
      SocketClient.disconnect()
    }
  }, [])
  return null
}

export const getSocketIO = () => (global as any).io

export { SocketClient }
