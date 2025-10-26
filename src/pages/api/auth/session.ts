import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const prerender = false;

/**
 * GET /api/auth/session
 *
 * Returns the current authentication status and user information
 *
 * Response (200):
 * {
 *   authenticated: boolean,
 *   user: {
 *     id: string,
 *     email: string,
 *     created_at: string
 *   } | null
 * }
 *
 * This endpoint is useful for:
 * - Client-side auth state checks
 * - React components that need to verify session
 * - Future features requiring session validation
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Get current user session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Session check error:', error);
      // Return unauthenticated on error
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // User is authenticated
    if (user) {
      return new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // No user session
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in session endpoint:', error);

    // Return unauthenticated on any error
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
