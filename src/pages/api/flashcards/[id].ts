/**
 * API Endpoints: Single flashcard operations
 * - PUT /api/flashcards/:id - Update flashcard content
 * - DELETE /api/flashcards/:id - Delete flashcard
 */

import type { APIRoute } from "astro";
import { FlashcardsService } from "../../../services/flashcards.service";
import { updateFlashcardSchema, deleteFlashcardSchema } from "../../../schemas/flashcards.schema";
import { z } from "zod";

export const prerender = false;

/**
 * PUT handler - Update an existing flashcard's content
 * @returns 200 with updated flashcard or error response
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Extract user from middleware (authentication check)
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validate request parameters and body
    const validated = updateFlashcardSchema.parse({
      params: {
        id: params.id,
      },
      body,
    });

    // 4. Initialize service
    const flashcardsService = new FlashcardsService(locals.supabase);

    // 5. Verify flashcard ownership (through deck relationship)
    const hasAccess = await flashcardsService.verifyFlashcardOwnership(validated.params.id, user.id);

    if (!hasAccess) {
      // Check if flashcard exists at all
      const { data: flashcard } = await locals.supabase
        .from("flashcards")
        .select("id")
        .eq("id", validated.params.id)
        .single();

      if (!flashcard) {
        return new Response(
          JSON.stringify({
            error: "Flashcard not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Flashcard exists but user doesn't own it
      return new Response(
        JSON.stringify({
          error: "Access denied - you do not own this flashcard",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Update flashcard content
    const updatedFlashcard = await flashcardsService.updateFlashcard(validated.params.id, validated.body);

    // 7. Return updated flashcard
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    console.error("Error updating flashcard:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE handler - Delete a flashcard
 * Cascade deletion of study_records is handled by database
 * @returns 204 No Content or error response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Extract user from middleware (authentication check)
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate request parameters
    const validated = deleteFlashcardSchema.parse({
      params: {
        id: params.id,
      },
    });

    // 3. Initialize service
    const flashcardsService = new FlashcardsService(locals.supabase);

    // 4. Verify flashcard ownership (through deck relationship)
    const hasAccess = await flashcardsService.verifyFlashcardOwnership(validated.params.id, user.id);

    if (!hasAccess) {
      // Check if flashcard exists at all
      const { data: flashcard } = await locals.supabase
        .from("flashcards")
        .select("id")
        .eq("id", validated.params.id)
        .single();

      if (!flashcard) {
        return new Response(
          JSON.stringify({
            error: "Flashcard not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Flashcard exists but user doesn't own it
      return new Response(
        JSON.stringify({
          error: "Access denied - you do not own this flashcard",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Delete flashcard (CASCADE handles study_records)
    await flashcardsService.deleteFlashcard(validated.params.id);

    // 6. Return 204 No Content (successful deletion, no body)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    console.error("Error deleting flashcard:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
