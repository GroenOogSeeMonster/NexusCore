// Temporarily disabled until next-auth is installed
// import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'

// Temporarily simplified middleware until next-auth is installed
export default function middleware(req: NextRequest) {
  // Allow all requests for now - authentication will be enabled later
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/public|_next/static|_next/image|favicon.ico|public).*)',
  ],
}