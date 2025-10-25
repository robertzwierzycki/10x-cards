/**
 * API Endpoint: /api/study/stats/:deckId
 *
 * Provides study statistics for a deck:
 * - GET: Retrieve comprehensive study statistics
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { StudyService, NotFoundError, ForbiddenError } from "@/services/study.service";
import { studyStatsParamsSchema } from "@/schemas/study.schema";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/study/stats/:deckId
 *
 * Returns comprehensive study statistics for a deck including:
 * - Total cards
 * - Cards studied today
 * - Cards due today/tomorrow
 * - Average difficulty
 * - Retention rate
 * - Study streak
 *
 * URL Parameters:
 * - deckId (required): UUID of the deck to get statistics for
 *
 * Returns:
 * - 200: StudyStatsDTO with all statistics
 * - 400: Invalid deck ID format
 * - 401: Unauthorized
 * - 403: Access denied (deck not owned by user)
 * - 404: Deck not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
      validatedParams = studyStatsParamsSchema.parse(params);
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

    // 3. Get deck statistics using StudyService
    const studyService = new StudyService(supabase);
    try {
      const stats = await studyService.getDeckStatistics(user.id, validatedParams.deckId);

      // 4. Return success response
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=300", // Cache for 5 minutes
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
    console.error("[GET /api/study/stats/:deckId] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to retrieve study statistics",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
