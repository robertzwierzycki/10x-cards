import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { loginSchema } from "@/schemas/auth.schema";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates user with email and password
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response (200):
 * {
 *   user: {
 *     id: string,
 *     email: string
 *   }
 * }
 *
 * Error responses:
 * - 400: Validation failed
 * - 401: Invalid credentials
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
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

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase auth errors
      if (error.message.includes("Invalid login credentials")) {
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowy e-mail lub hasło",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Rate limiting error
      if (error.message.includes("rate limit") || error.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Email not confirmed
      if (error.message.includes("Email not confirmed")) {
        return new Response(
          JSON.stringify({
            error: "Potwierdź swój adres email przed zalogowaniem. Sprawdź swoją skrzynkę",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic auth error
      console.error("Login error:", error);
      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas logowania. Spróbuj ponownie",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success - return user data
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error in login endpoint:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format danych",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        error: "Błąd serwera. Spróbuj ponownie później",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
