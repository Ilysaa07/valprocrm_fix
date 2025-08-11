import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isEmployeePage = req.nextUrl.pathname.startsWith('/employee')

    if (isAuthPage) {
      if (isAuth) {
        // Redirect authenticated users away from auth pages
        if (token?.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', req.url))
        } else {
          return NextResponse.redirect(new URL('/employee', req.url))
        }
      }
      return null
    }

    if (!isAuth) {
      // Redirect unauthenticated users to login
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    if (isAdminPage && token?.role !== 'ADMIN') {
      // Redirect non-admin users away from admin pages
      return NextResponse.redirect(new URL('/employee', req.url))
    }

    if (isEmployeePage && token?.role !== 'EMPLOYEE') {
      // Redirect non-employee users away from employee pages
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    return null
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/profile']
}

