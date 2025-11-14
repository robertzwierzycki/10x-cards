/**
 * Flashcard Generation API Endpoint
 *
 * POST /api/flashcards/generate
 *
 * Generates flashcards from user-provided text using OpenRouter AI service.
 * Requires authentication via Supabase session.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { OpenRouterService } from "@/lib/openrouter";
import { OpenRouterError, AuthenticationError, RateLimitError, ValidationError } from "@/lib/openrouter/errors";

export const prerender = false;

/**
 * Request body schema for flashcard generation
 */
const generateRequestSchema = z.object({
  input: z
    .string()
    .min(1, "Input text is required")
    .max(1000, "Input text cannot exceed 1000 characters")
    .transform((val) => val.trim()),
  count: z
    .number()
    .int()
    .min(1, "Must generate at least 1 flashcard")
    .max(10, "Cannot generate more than 10 flashcards")
    .optional()
    .default(5),
  deckId: z.string().uuid("Invalid deck ID").optional(),
});

type GenerateRequest = z.infer<typeof generateRequestSchema>;

/**
 * POST handler for flashcard generation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // Check authentication
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "You must be logged in to generate flashcards",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const userId = session.user.id;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validated: GenerateRequest = generateRequestSchema.parse(body);

    // Initialize OpenRouter service
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message: "AI service is not properly configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const openRouterService = new OpenRouterService({
      apiKey,
    });

    // Check rate limit
    if (!openRouterService.checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({
          error: "Rate Limit Exceeded",
          message: "Too many requests. Please try again in a moment.",
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    // Verify deck ownership if deckId provided
    if (validated.deckId) {
      const { data: deck, error: deckError } = await supabase
        .from("decks")
        .select("id, user_id")
        .eq("id", validated.deckId)
        .eq("user_id", userId)
        .single();

      if (deckError || !deck) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Deck not found or access denied",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Generate flashcards
    const result = await openRouterService.generateFlashcards(validated.input, {
      count: validated.count,
    });

    // Log usage to database for analytics (when table is created)
    // TODO: Uncomment when ai_usage_logs table is created in database
    // try {
    //   await supabase.from('ai_usage_logs').insert({
    //     user_id: userId,
    //     deck_id: validated.deckId || null,
    //     input_text_length: validated.input.length,
    //     flashcards_generated: result.flashcards.length,
    //     tokens_used: result.tokensUsed,
    //     model_used: result.modelUsed,
    //     was_truncated: result.truncated,
    //     created_at: new Date().toISOString(),
    //   });
    // } catch (logError) {
    //   // Log error but don't fail the request
    //   console.error('Failed to log AI usage:', logError);
    // }

    // Log to console for now
    console.log("AI Usage:", {
      userId,
      deckId: validated.deckId,
      inputLength: validated.input.length,
      flashcardsGenerated: result.flashcards.length,
      tokensUsed: result.tokensUsed,
      modelUsed: result.modelUsed,
      truncated: result.truncated,
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          flashcards: result.flashcards,
          tokensUsed: result.tokensUsed,
          modelUsed: result.modelUsed,
          truncated: result.truncated,
          count: result.flashcards.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Invalid request data",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle OpenRouter-specific errors
    if (error instanceof AuthenticationError) {
      console.error("OpenRouter authentication error:", error.message);
      return new Response(
        JSON.stringify({
          error: "Service Configuration Error",
          message: "AI service authentication failed. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate Limit Exceeded",
          message: error.getUserMessage(),
          retryAfter: error.retryAfter ? Math.ceil(error.retryAfter / 1000) : 60,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(error.retryAfter ? Math.ceil(error.retryAfter / 1000) : 60),
          },
        }
      );
    }

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: error.getUserMessage(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof OpenRouterError) {
      console.error("OpenRouter error:", {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });

      return new Response(
        JSON.stringify({
          error: "AI Service Error",
          message: error.getUserMessage(),
        }),
        {
          status: error.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in flashcard generation:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
