import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/question_dashboard(.*)',
  '/weakness-report(.*)',
  '/roadmap(.*)',
  '/admin(.*)',
  '/audit(.*)',
  '/api/roadmap/generate(.*)',
  '/api/dashboard/generate(.*)',
  '/api/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
}, { clockSkewInMs: 30000 });

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
