import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
// Temporarily remove rate limit wrapper due to NextAuth client fetch incompatibilities

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

