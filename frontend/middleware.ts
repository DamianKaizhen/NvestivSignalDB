import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define valid routes in the application
const validRoutes = [
  '/',
  '/investors',
  '/firms',
  '/network', 
  '/search',
  '/test-navigation'
]

// Define dynamic route patterns
const dynamicRoutePatterns = [
  /^\/investors\/[^\/]+$/,  // /investors/[id]
  /^\/firms\/[^\/]+$/,      // /firms/[id]
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Skip files (css, js, images, etc.)
  ) {
    return NextResponse.next()
  }

  // Check if route is valid
  const isValidStaticRoute = validRoutes.includes(pathname)
  const isValidDynamicRoute = dynamicRoutePatterns.some(pattern => pattern.test(pathname))

  if (!isValidStaticRoute && !isValidDynamicRoute) {
    // Log invalid route attempts
    console.warn(`Invalid route accessed: ${pathname}`)
    
    // Redirect to 404 page
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  // Add headers for better error handling
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CORS headers for API requests
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  // Add custom headers for route validation
  response.headers.set('X-Route-Valid', 'true')
  response.headers.set('X-Route-Path', pathname)
  response.headers.set('X-Navigation-Version', '1.0')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}