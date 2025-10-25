/**
 * API Endpoint: /api/profile
 *
 * Handles user profile operations:
 * - GET: Retrieve authenticated user's profile with email
 * - PUT: Update user profile (currently username only)
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { ProfileService, ConflictError, NotFoundError } from "@/services/profile.service";
import { updateProfileBodySchema } from "@/schemas/profile.schema";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/profile
 *
 * Retrieves the profile of the currently authenticated user,
 * including email from Supabase Auth.
 *
 * Returns:
 * - 200: ProfileDTO with user data
 * - 401: Unauthorized (no valid JWT token)
 * - 404: Profile not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Check authentication
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Retrieve profile using ProfileService
    const profileService = new ProfileService(supabase);
    try {
      const profile = await profileService.getProfile(user.id);

      // 3. Return success response
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=300", // Cache for 5 minutes
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Profile not found",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[GET /api/profile] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to retrieve profile",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/profile
 *
 * Updates the authenticated user's profile.
 * Currently only supports updating username.
 *
 * Request Body:
 * - username (optional): New username, 3-50 characters, alphanumeric + underscore
 *
 * Returns:
 * - 200: Updated ProfileDTO
 * - 400: Invalid request body or validation failed
 * - 401: Unauthorized
 * - 409: Username already taken
 * - 500: Internal server error
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check authentication
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid JSON in request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let validatedBody;
    try {
      validatedBody = updateProfileBodySchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Validation failed",
          details: error.errors,
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // 3. Update profile using ProfileService
    const profileService = new ProfileService(supabase);
    try {
      const updatedProfile = await profileService.updateProfile(user.id, validatedBody);

      // 4. Return success response
      return new Response(JSON.stringify(updatedProfile), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Username already taken",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (error instanceof NotFoundError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Profile not found",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[PUT /api/profile] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to update profile",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
