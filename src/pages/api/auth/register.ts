import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { registerSchema } from '@/schemas/auth.schema';

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Creates a new user account with email and password
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   confirmPassword: string
 * }
 *
 * Response (200):
 * {
 *   user: {
 *     id: string,
 *     email: string
 *   },
 *   requiresEmailConfirmation: boolean
 * }
 *
 * Error responses:
 * - 400: Validation failed
 * - 409: Email already registered
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowe dane',
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Attempt to create new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/confirm`,
      },
    });

    if (error) {
      // Handle specific Supabase auth errors

      // Email already registered
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({
            error: 'Ten adres email jest już zarejestrowany',
          }),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Rate limiting error
      if (error.message.includes('rate limit') || error.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Password too weak
      if (error.message.includes('Password')) {
        return new Response(
          JSON.stringify({
            error: 'Hasło jest zbyt słabe. Użyj silniejszego hasła',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Generic auth error
      console.error('Registration error:', error);
      return new Response(
        JSON.stringify({
          error: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: 'Nie udało się utworzyć konta. Spróbuj ponownie',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Determine if email confirmation is required
    // If session is null, it means email confirmation is enabled
    // If session exists, user is automatically logged in (auto-confirm enabled)
    const requiresEmailConfirmation = data.session === null;

    // Success - return user data
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        requiresEmailConfirmation,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in register endpoint:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowy format danych',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        error: 'Błąd serwera. Spróbuj ponownie później',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
