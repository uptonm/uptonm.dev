import { clerkMiddleware } from "@clerk/nextjs/server";

// The portfolio is fully public, so the middleware only wires up Clerk's
// request context — it does not gate any routes. To protect a resource, call
// `await auth.protect()` inside that page/layout/route handler (resource-based
// auth), which is Clerk's recommended pattern over path matching here.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
