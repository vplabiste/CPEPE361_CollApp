import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths to exclude from maintenance mode redirection
  const excludedPaths = [
    '/maintenance',
    '/api', // Exclude all API routes
    '/admin', // Exclude all admin routes
  ];

  if (excludedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    // Fetch settings from our API route. Use absolute URL.
    const settingsUrl = new URL('/api/settings', request.url);
    const response = await fetch(settingsUrl);
    
    if (!response.ok) {
        // If the API call fails, assume not in maintenance and let the request proceed.
        console.error(`Middleware: API call to /api/settings failed with status ${response.status}`);
        return NextResponse.next();
    }

    const settings = await response.json();

    if (settings.maintenanceMode) {
      // Rewrite to the maintenance page instead of redirecting
      // This keeps the URL the same in the user's browser
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
  } catch (error) {
    // In case of a fetch error, log it and proceed to not block the site.
    console.error("Middleware fetch error:", error);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
