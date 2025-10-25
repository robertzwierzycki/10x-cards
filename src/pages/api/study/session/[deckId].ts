/**
 * API Endpoint: /api/study/session/:deckId
 *
 * Initializes a study session for a specific deck:
 * - GET: Start study session and get due cards
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { StudyService, NotFoundError, ForbiddenError } from "@/services/study.service";
import { studySessionParamsSchema, studySessionQuerySchema } from "@/schemas/study.schema";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/study/session/:deckId
 *
 * Initializes a study session for a deck and returns cards due for review.
 * Automatically creates study_records for new flashcards.
 *
 * URL Parameters:
 * - deckId (required): UUID of the deck to study
 *
 * Query Parameters:
 * - limit (optional): Maximum cards to return (default: 20, max: 50)
 *
 * Returns:
 * - 200: StudySessionDTO with due cards
 * - 400: Invalid parameters
 * - 401: Unauthorized
 * - 403: Access denied (deck not owned by user)
 * - 404: Deck not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
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

    // 2. Validate URL parameters
    let validatedParams;
    try {
      validatedParams = studySessionParamsSchema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Invalid deck ID format",
          details: error.errors,
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // 3. Validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit"),
    };

    let validatedQuery;
    try {
      validatedQuery = studySessionQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Invalid query parameters",
          details: error.errors,
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // 4. Initialize study session using StudyService
    const studyService = new StudyService(supabase);
    try {
      const session = await studyService.initializeSession(user.id, validatedParams.deckId, validatedQuery.limit);

      // 5. Return success response
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store", // Don't cache study sessions
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Deck not found",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (error instanceof ForbiddenError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Access denied",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[GET /api/study/session/:deckId] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to initialize study session",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
