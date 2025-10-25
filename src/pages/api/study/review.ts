/**
 * API Endpoint: /api/study/review
 *
 * Handles review submission for flashcards:
 * - POST: Submit review rating and update study record with SR algorithm
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { StudyService, NotFoundError, ForbiddenError } from "@/services/study.service";
import { submitReviewSchema } from "@/schemas/study.schema";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/study/review
 *
 * Submits a review rating for a flashcard and updates the study record
 * using the SM-2 spaced repetition algorithm to calculate next review date.
 *
 * Request Body:
 * - study_record_id (required): UUID of the study record
 * - flashcard_id (required): UUID of the flashcard (for verification)
 * - rating (required): "again" | "good" | "easy"
 *
 * Returns:
 * - 200: ReviewResponseDTO with updated study parameters
 * - 400: Invalid request body or flashcard ID mismatch
 * - 401: Unauthorized
 * - 403: Access denied (study record not owned by user)
 * - 404: Study record not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
      validatedBody = submitReviewSchema.parse(body);
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

    // 3. Process review using StudyService
    const studyService = new StudyService(supabase);
    try {
      const reviewResponse = await studyService.processReview(
        user.id,
        validatedBody.study_record_id,
        validatedBody.flashcard_id,
        validatedBody.rating
      );

      // 4. Return success response
      return new Response(JSON.stringify(reviewResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Study record not found",
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
      // Handle flashcard ID mismatch
      if (error instanceof Error && error.message === "Flashcard ID does not match study record") {
        const errorResponse: ErrorResponseDTO = {
          error: "Flashcard ID does not match study record",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[POST /api/study/review] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to submit review",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
