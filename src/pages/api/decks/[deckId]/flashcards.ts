/**
 * API Endpoints: Flashcards for a specific deck
 * - GET /api/decks/:deckId/flashcards - List flashcards with pagination
 * - POST /api/decks/:deckId/flashcards - Create a single flashcard
 */

import type { APIRoute } from "astro";
import { FlashcardsService } from "../../../../services/flashcards.service";
import { getFlashcardsByDeckSchema, createFlashcardSchema } from "../../../../schemas/flashcards.schema";
import { z } from "zod";

export const prerender = false;

/**
 * GET handler - Retrieve flashcards for a deck with pagination
 * @returns 200 with flashcard list or error response
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
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

    // 2. Parse and validate query parameters
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };

    // 3. Validate request parameters
    const validated = getFlashcardsByDeckSchema.parse({
      params: {
        deckId: params.deckId,
      },
      query: queryParams,
    });

    // 4. Initialize service
    const flashcardsService = new FlashcardsService(locals.supabase);

    // 5. Verify deck ownership
    const hasAccess = await flashcardsService.verifyDeckOwnership(validated.params.deckId, user.id);

    if (!hasAccess) {
      // Check if deck exists at all
      const { data: deck } = await locals.supabase
        .from("decks")
        .select("id")
        .eq("id", validated.params.deckId)
        .single();

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

    // 6. Get flashcards with pagination
    const result = await flashcardsService.getFlashcardsByDeckId(
      validated.params.deckId,
      validated.query.page,
      validated.query.limit
    );

    // 7. Return successful response
    return new Response(JSON.stringify(result), {
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
    console.error("Error fetching flashcards:", error);
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
 * POST handler - Create a single flashcard in a deck
 * @returns 201 with created flashcard or error response
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const validated = createFlashcardSchema.parse({
      params: {
        deckId: params.deckId,
      },
      body,
    });

    // 4. Initialize service
    const flashcardsService = new FlashcardsService(locals.supabase);

    // 5. Verify deck ownership
    const hasAccess = await flashcardsService.verifyDeckOwnership(validated.params.deckId, user.id);

    if (!hasAccess) {
      // Check if deck exists at all
      const { data: deck } = await locals.supabase
        .from("decks")
        .select("id")
        .eq("id", validated.params.deckId)
        .single();

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

    // 6. Create flashcard (trimming is handled by Zod schema)
    const flashcard = await flashcardsService.createFlashcard(validated.params.deckId, validated.body);

    // 7. Return created flashcard with 201 Created status
    return new Response(JSON.stringify(flashcard), {
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
    console.error("Error creating flashcard:", error);
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
