/**
 * API Endpoint: POST /api/ai/generate
 * Generates flashcard suggestions from user-provided text using GPT-4o-mini
 *
 * Rate Limit: 10 requests per minute per user
 * Timeout: 30 seconds
 * Max Input: 1000 characters (auto-truncated)
 * Max Output: 10 flashcard suggestions
 *
 * Note: This endpoint uses the new OpenRouterService for AI generation.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { OpenRouterService } from "@/lib/openrouter";
import {
  OpenRouterError,
  RateLimitError,
  ValidationError,
  AuthenticationError,
} from "@/lib/openrouter/errors";

export const prerender = false;

/**
 * Request body schema for flashcard generation
 */
const generateFlashcardsSchema = z.object({
  text: z
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
});

/**
 * POST handler - Generate flashcard suggestions from text
 * @returns 200 with flashcard suggestions or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();
  const supabase = locals.supabase;

  try {
    // Step 1: Verify authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
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

    const userId = session.user.id;

    // Step 2: Check if API key is configured
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          error: "AI service is not properly configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Initialize OpenRouter service
    const openRouterService = new OpenRouterService({
      apiKey,
    });

    // Step 4: Check rate limit (10 requests per minute)
    if (!openRouterService.checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          retry_after: 60,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "60",
            "Retry-After": "60",
          },
        }
      );
    }

    // Step 5: Parse request body
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

    // Step 6: Validate input
    const validated = generateFlashcardsSchema.parse(body);

    // Step 7: Generate flashcards using OpenRouter service
    const result = await openRouterService.generateFlashcards(validated.text, {
      count: validated.count,
    });

    // Step 8: Calculate response time for monitoring
    const responseTime = performance.now() - startTime;

    // Log metrics for P95 analysis
    console.log("AI Generation Metrics:", {
      userId,
      responseTime: Math.round(responseTime),
      flashcardCount: result.flashcards.length,
      textLength: validated.text.length,
      truncated: result.truncated,
      tokensUsed: result.tokensUsed,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });

    // Step 9: Get usage stats
    const stats = await openRouterService.getUsageStats();

    // Step 10: Return successful response
    return new Response(
      JSON.stringify({
        suggestions: result.flashcards,
        count: result.flashcards.length,
        truncated: result.truncated,
        tokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": String(9), // Approximate remaining
          "X-RateLimit-Reset": "60",
        },
      }
    );
  } catch (error) {
    // Calculate response time even for errors
    const responseTime = performance.now() - startTime;

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

    // Handle OpenRouter authentication errors
    if (error instanceof AuthenticationError) {
      console.error("OpenRouter authentication error:", {
        error: error.message,
        responseTime: Math.round(responseTime),
      });

      return new Response(
        JSON.stringify({
          error: "AI service authentication failed. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      console.error("OpenRouter rate limit error:", {
        error: error.message,
        responseTime: Math.round(responseTime),
      });

      return new Response(
        JSON.stringify({
          error: error.getUserMessage(),
          retry_after: error.retryAfter ? Math.ceil(error.retryAfter / 1000) : 60,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(error.retryAfter ? Math.ceil(error.retryAfter / 1000) : 60),
          },
        }
      );
    }

    // Handle validation errors from OpenRouter
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: error.getUserMessage(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other OpenRouter errors
    if (error instanceof OpenRouterError) {
      console.error("OpenRouter error:", {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        responseTime: Math.round(responseTime),
      });

      return new Response(
        JSON.stringify({
          error: error.getUserMessage(),
        }),
        {
          status: error.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    console.error("AI Generation Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: Math.round(responseTime),
    });

    return new Response(
      JSON.stringify({
        error: "Failed to generate flashcards. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
