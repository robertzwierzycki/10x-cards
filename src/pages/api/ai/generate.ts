/**
 * API Endpoint: POST /api/ai/generate
 * Generates flashcard suggestions from user-provided text using GPT-4o-mini
 *
 * Rate Limit: 10 requests per minute per user
 * Timeout: 5 seconds
 * Max Input: 1000 characters (auto-truncated)
 * Max Output: 5 flashcard suggestions
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { generateFlashcardsSchema } from "../../../schemas/ai-generation.schema";
import { AIGenerationService, ServiceUnavailableError } from "../../../services/ai-generation.service";
import { checkRateLimit } from "../../../services/rate-limiter.service";
import type { GenerateFlashcardsResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST handler - Generate flashcard suggestions from text
 * @returns 200 with flashcard suggestions or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  try {
    // Step 1: Verify authentication
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

    // Step 2: Check rate limit (10 requests per minute)
    const rateLimit = await checkRateLimit(user.id, 10, 60);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          retry_after: rateLimit.resetIn,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetIn),
            "Retry-After": String(rateLimit.resetIn),
          },
        }
      );
    }

    // Step 3: Parse request body
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

    // Step 4: Validate input
    const validated = generateFlashcardsSchema.parse(body);

    // Step 5: Check for truncation (if original text exceeded 1000 chars)
    const originalLength = body.text?.length || 0;
    const truncated = originalLength > 1000;
    const processedText = validated.text.slice(0, 1000);

    // Step 6: Initialize AI service and generate flashcards
    const aiService = new AIGenerationService();
    const suggestions = await aiService.generateFlashcards(processedText);

    // Step 7: Calculate response time for monitoring
    const responseTime = performance.now() - startTime;

    // Log metrics for P95 analysis
    console.log("AI Generation Metrics:", {
      userId: user.id,
      responseTime: Math.round(responseTime),
      flashcardCount: suggestions.length,
      textLength: processedText.length,
      truncated,
      timestamp: new Date().toISOString(),
    });

    // Step 8: Return successful response
    const response: GenerateFlashcardsResponseDTO = {
      suggestions,
      count: suggestions.length,
      truncated,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": String(rateLimit.remaining - 1),
        "X-RateLimit-Reset": String(rateLimit.resetIn),
      },
    });
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

    // Handle AI service unavailable (rate limit, timeout)
    if (error instanceof ServiceUnavailableError) {
      console.error("AI service unavailable:", {
        error: error.message,
        responseTime: Math.round(responseTime),
      });

      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60", // Suggest retry after 1 minute
          },
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
