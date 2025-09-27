import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as argon2 from 'argon2'
import { prisma } from './prisma'

// Lockout config
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req: unknown) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const getIp = (r: unknown): string => {
            try {
              const asAny = r as { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } }
              const xf = (asAny.headers?.['x-forwarded-for'] as string) || ''
              return xf || asAny.socket?.remoteAddress || 'unknown'
            } catch {
              return 'unknown'
            }
          }
          const ip = getIp(req)
          const email = credentials.email.toLowerCase()

          // Throttle lookup by email or IP
          const throttle = await prisma.loginThrottle.findFirst({
            where: {
              OR: [
                { email },
                { ip: String(ip) }
              ]
            }
          })
          const th = throttle as { id?: string; failedCount?: number; lockedUntil?: Date } | null
          if (th?.lockedUntil && th.lockedUntil > new Date()) {
            // Still locked
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              fullName: true,
              password: true,
              role: true,
              profilePicture: true,
              status: true
            }
          })

          if (!user || user.status !== 'APPROVED') {
            // count failure
            const failedCount = (th?.failedCount || 0) + 1
            const lockedUntil = failedCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null
            
            if (th?.id) {
              // Update existing throttle record
              await prisma.loginThrottle.update({
                where: { id: th.id },
                data: { failedCount, lockedUntil, lastAttempt: new Date(), email, ip: String(ip) }
              })
            } else {
              // Create new throttle record
              await prisma.loginThrottle.create({
                data: { failedCount, lockedUntil, lastAttempt: new Date(), email, ip: String(ip) }
              })
            }
            return null
          }

          // Verify password strictly with Argon2
          const hash = user.password || ''
          const isPasswordValid = await argon2.verify(hash, credentials.password).catch(() => false)
          if (!isPasswordValid) {
            const failedCount = (th?.failedCount || 0) + 1
            const lockedUntil = failedCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null
            
            if (th?.id) {
              // Update existing throttle record
              await prisma.loginThrottle.update({
                where: { id: th.id },
                data: { failedCount, lockedUntil, lastAttempt: new Date(), email, ip: String(ip) }
              })
            } else {
              // Create new throttle record
              await prisma.loginThrottle.create({
                data: { failedCount, lockedUntil, lastAttempt: new Date(), email, ip: String(ip) }
              })
            }
            return null
          }

          // success: reset counter
          if (th?.id) {
            await prisma.loginThrottle.update({
              where: { id: th.id },
              data: { failedCount: 0, lockedUntil: null, lastAttempt: new Date() }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            fullName: user.fullName,
            role: user.role,
            image: user.profilePicture || undefined,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
        token.fullName = (user as { fullName?: string }).fullName as string
        token.picture = user.image
      }
      
      // Handle session updates (like profile picture changes)
      if (trigger === 'update' && session) {
        if (session.user?.image) {
          token.picture = session.user.image
        }
        if (session.user?.name) {
          token.fullName = session.user.name
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.fullName as string
        session.user.image = token.picture as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
  debug: process.env.NODE_ENV === 'development',
}

