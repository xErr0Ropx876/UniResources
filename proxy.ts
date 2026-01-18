import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // Redirect authenticated users away from auth pages
        if (token && (path === '/login' || path === '/signup')) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        // Admin-only routes
        if (path.startsWith('/dashboard/admin') && token?.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        // Tech Dashboard accessible by tech AND admin
        if (path.startsWith('/dashboard/tech') && token?.role !== 'tech' && token?.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname

                // Public routes
                if (path === '/' || path === '/login' || path === '/signup') {
                    return true
                }

                // Protected routes require authentication
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/resources/:path*',
        '/profile/:path*',
        '/login',
        '/signup',
    ],
}
