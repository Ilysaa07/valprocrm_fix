import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

if (process.env.NODE_ENV === 'development') {
  console.log('NextAuth handler initialized')
}

export { handler as GET, handler as POST }

