/**
 * Astro Middleware
 *
 * Sets up Supabase client and handles JWT authentication for all requests
 */

import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.js";

export const onRequest = defineMiddleware(async (context, next) => {
  // Inject Supabase client into context
  context.locals.supabase = supabaseClient;

  // Extract JWT token from Authorization header
  const authHeader = context.request.headers.get("authorization");

  // Attempt authentication if Bearer token is present
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token and get user
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

      // If authentication successful, add user to context
      if (user && !error) {
        context.locals.user = user;
      }
    } catch (error) {
      // Log authentication errors but don't block the request
      console.warn("[Middleware] Authentication error:", error);
    }
  }

  return next();
});
