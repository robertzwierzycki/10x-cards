/**
 * API Endpoint: POST /api/flashcards/bulk
 * Creates multiple flashcards at once (primarily for AI-generated content)
 * Supports up to 100 flashcards per request
 */

import type { APIRoute } from "astro";
import { FlashcardsService } from "../../../services/flashcards.service";
import { bulkCreateFlashcardsSchema } from "../../../schemas/flashcards.schema";
import { z } from "zod";

export const prerender = false;

/**
 * POST handler - Create multiple flashcards in bulk
 * @returns 201 with created flashcards summary or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // 3. Validate request body (includes deck_id and flashcards array)
    const validated = bulkCreateFlashcardsSchema.parse({ body });

    // 4. Check array length limit (max 100 flashcards)
    if (validated.body.flashcards.length > 100) {
      return new Response(
        JSON.stringify({
          error: "Cannot create more than 100 flashcards at once",
          details: {
            received: validated.body.flashcards.length,
            maximum: 100,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Initialize service
    const flashcardsService = new FlashcardsService(locals.supabase);

    // 6. Verify deck ownership
    const hasAccess = await flashcardsService.verifyDeckOwnership(validated.body.deck_id, user.id);

    if (!hasAccess) {
      // Check if deck exists at all
      const { data: deck } = await locals.supabase.from("decks").select("id").eq("id", validated.body.deck_id).single();

      if (!deck) {
        return new Response(
          JSON.stringify({
            error: "Deck not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Deck exists but user doesn't own it
      return new Response(
        JSON.stringify({
          error: "Access denied - you do not own this deck",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 7. Perform bulk insert (wrapped in transaction by Supabase)
    const result = await flashcardsService.bulkCreateFlashcards(validated.body);

    // 8. Return created flashcards summary with 201 Created status
    return new Response(JSON.stringify(result), {
      status: 201,
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
    console.error("Error bulk creating flashcards:", error);
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
