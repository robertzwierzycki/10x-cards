/**
 * API Endpoints: /api/decks
 *
 * Handles deck collection operations:
 * - GET: List user's decks with pagination
 * - POST: Create a new deck
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { DeckService } from "@/services/deck.service";
import { deckListQuerySchema, createDeckSchema } from "@/schemas/deck.schema";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/decks
 *
 * Retrieves a paginated list of decks for the authenticated user
 *
 * Query Parameters:
 * - page (optional): Page number, default 1
 * - limit (optional): Items per page, default 20, max 100
 * - sort (optional): Sort field (name|created_at|updated_at), default updated_at
 * - order (optional): Sort order (asc|desc), default desc
 *
 * Returns:
 * - 200: DeckListDTO with paginated deck data
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
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

    // 2. Validate query parameters
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
    };

    let validatedParams;
    try {
      validatedParams = deckListQuerySchema.parse(queryParams);
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

    // 3. Retrieve decks using DeckService
    const deckService = new DeckService(supabase);
    const result = await deckService.getDecks(user.id, validatedParams);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("[GET /api/decks] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to retrieve decks",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/decks
 *
 * Creates a new deck for the authenticated user
 *
 * Request Body:
 * - name (required): Deck name, 1-255 characters, will be trimmed
 *
 * Returns:
 * - 201: DeckDTO of created deck with Location header
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 409: Deck with same name already exists
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
      validatedBody = createDeckSchema.parse(body);
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

    // 3. Create deck using DeckService
    const deckService = new DeckService(supabase);
    try {
      const newDeck = await deckService.createDeck(validatedBody.name, user.id);

      // 4. Return success response with Location header
      return new Response(JSON.stringify(newDeck), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          Location: `/api/decks/${newDeck.id}`,
        },
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
    console.error("[POST /api/decks] Error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to create deck",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
