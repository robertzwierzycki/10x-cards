/**
 * Astro Middleware
 *
 * Sets up Supabase SSR client and handles authentication/authorization for all requests
 */

import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/reset-password", "/auth/confirm", "/auth/reset"];

// Define routes that should redirect authenticated users (already logged in)
const AUTH_ROUTES = ["/login", "/register", "/reset-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase SSR client using centralized helper
  const supabase = createSupabaseServerClient({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Inject Supabase client into context for use in pages/API routes
  context.locals.supabase = supabase;

  // Get authenticated user (secure method - verifies with Supabase Auth server)
  // This also automatically refreshes expired tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Add user to context if authenticated
  if (user) {
    context.locals.user = user;
  }

  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // If user is authenticated and trying to access auth routes (login, register, etc.)
  // Redirect to dashboard
  if (user && AUTH_ROUTES.includes(pathname)) {
    return context.redirect("/");
  }

  // If user is NOT authenticated and trying to access protected route
  // Redirect to login with returnTo parameter
  if (!user && !PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith("/api/")) {
    // Preserve the original URL for redirect after login
    const redirectTo = encodeURIComponent(pathname + url.search);
    return context.redirect(`/login?redirectTo=${redirectTo}`);
  }

  // Continue with the request
  return next();
});
