/**
 * Astro Middleware
 *
 * Sets up Supabase SSR client and handles authentication/authorization for all requests
 */

import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.js";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/reset-password", "/reset-password/confirm", "/auth/confirm"];

// Define routes that should redirect authenticated users
const AUTH_ROUTES = ["/login", "/register", "/reset-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase SSR client
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, options);
      },
      remove(key, options) {
        context.cookies.delete(key, options);
      },
    },
  });

  // Inject Supabase client into context
  context.locals.supabase = supabase;

  // Get authenticated user (secure method - verifies with Supabase Auth server)
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
