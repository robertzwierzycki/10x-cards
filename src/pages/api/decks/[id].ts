/**
 * API Endpoints: /api/decks/:id
 *
 * Handles individual deck operations:
 * - GET: Retrieve deck with all flashcards
 * - PUT: Update deck name
 * - DELETE: Delete deck and all associated data
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { DeckService } from "@/services/deck.service";
import {
  getDeckParamsSchema,
  updateDeckParamsSchema,
  updateDeckBodySchema,
  deleteDeckParamsSchema,
} from "@/schemas/deck.schema";
import type { DeckWithFlashcardsDTO, DeckDTO, ErrorResponseDTO } from "@/types";

// Disable prerendering for this dynamic route
export const prerender = false;

/**
 * GET /api/decks/:id
 *
 * Retrieves detailed information about a specific deck including all flashcards
 *
 * Returns:
 * - 200: DeckWithFlashcardsDTO
 * - 400: Invalid UUID format
 * - 401: Unauthorized
 * - 404: Deck not found or access denied
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication check
    // User is authenticated via middleware and available in locals.user
    if (!locals.user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parameter validation
    const validation = getDeckParamsSchema.safeParse(params);

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: validation.error.errors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Retrieve deck data
    const deckService = new DeckService(locals.supabase);
    const deck = await deckService.getDeckWithFlashcards(validation.data.id, locals.user.id);

    // 4. Handle results
    if (!deck) {
      const errorResponse: ErrorResponseDTO = {
        error: "Deck not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response
    const response: DeckWithFlashcardsDTO = deck;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    // Log error for monitoring
    console.error("[GET /api/decks/:id] Unexpected error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to retrieve deck",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/decks/:id
 *
 * Updates a deck's name
 *
 * Request Body:
 * - name (required): New deck name, 1-255 characters, will be trimmed
 *
 * Returns:
 * - 200: DeckDTO of updated deck
 * - 400: Invalid UUID format or validation failed
 * - 401: Unauthorized
 * - 403: Access denied (deck belongs to another user)
 * - 404: Deck not found
 * - 409: Deck with same name already exists
 * - 500: Internal server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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
    const paramsValidation = updateDeckParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: paramsValidation.error.errors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Parse and validate request body
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
      validatedBody = updateDeckBodySchema.parse(body);
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

    // 4. Update deck using DeckService
    const deckService = new DeckService(supabase);
    try {
      const updatedDeck = await deckService.updateDeck(paramsValidation.data.id, validatedBody.name, user.id);

      // Handle deck not found or unauthorized
      if (!updatedDeck) {
        const errorResponse: ErrorResponseDTO = {
          error: "Deck not found",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 5. Return success response
      const response: DeckDTO = updatedDeck;
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle duplicate name error
      if (error instanceof Error && error.message === "Deck with this name already exists") {
        const errorResponse: ErrorResponseDTO = {
          error: "Deck with this name already exists",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[PUT /api/decks/:id] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to update deck",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/decks/:id
 *
 * Deletes a deck and all associated flashcards and study records
 *
 * Returns:
 * - 204: No Content (successfully deleted)
 * - 400: Invalid UUID format
 * - 401: Unauthorized
 * - 403: Access denied (deck belongs to another user)
 * - 404: Deck not found
 * - 500: Internal server error
 *
 * @remarks
 * This operation is irreversible. All flashcards and study records
 * associated with the deck will be CASCADE deleted automatically.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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
    const paramsValidation = deleteDeckParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: paramsValidation.error.errors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Delete deck using DeckService
    const deckService = new DeckService(supabase);
    const deleted = await deckService.deleteDeck(paramsValidation.data.id, user.id);

    // Handle deck not found or unauthorized
    if (!deleted) {
      const errorResponse: ErrorResponseDTO = {
        error: "Deck not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("[DELETE /api/decks/:id] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to delete deck",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
