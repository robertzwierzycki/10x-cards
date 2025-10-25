/**
 * AI Acceptance Metrics Endpoint
 *
 * GET /api/metrics/ai-acceptance
 *
 * Returns metrics measuring the percentage of AI-generated flashcard suggestions
 * that users accept. Supports filtering by time period.
 * Key Success Metric (KSM 1): Target acceptance rate is 75%.
 *
 * Authentication required.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { MetricsService } from "@/services/metrics.service";
import { aiAcceptanceQuerySchema } from "@/schemas/metrics.schema";
import type { AIAcceptanceMetricsDTO, ErrorResponseDTO } from "@/types";

// Disable prerendering for dynamic metrics calculation
export const prerender = false;

/**
 * GET /api/metrics/ai-acceptance
 *
 * Calculates and returns AI acceptance metrics for a specified period.
 * Measures what percentage of AI-generated flashcard suggestions are accepted by users.
 *
 * Query Parameters:
 * - period (optional): "day" | "week" | "month" | "all" (default: "all")
 *
 * @returns 200 OK with acceptance metrics
 * @returns 400 Bad Request if period parameter is invalid
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if metrics calculation fails
 *
 * Response body: AIAcceptanceMetricsDTO
 */
export const GET: APIRoute = async ({ locals, url }) => {
  // Authentication check
  if (!locals.user) {
    const errorResponse: ErrorResponseDTO = {
      error: "Authentication required",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Parse and validate query parameters
    const queryParams = {
      period: url.searchParams.get("period") || undefined,
    };

    const validatedParams = aiAcceptanceQuerySchema.parse(queryParams);

    // Initialize MetricsService with Supabase client
    const metricsService = new MetricsService(locals.supabase);

    // Calculate AI acceptance metrics for the specified period
    const metrics: AIAcceptanceMetricsDTO = await metricsService.calculateAIAcceptanceMetrics(validatedParams.period);

    // Return successful response
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache metrics for 5 minutes to reduce database load
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.warn("[API] Invalid query parameters for AI acceptance metrics:", error.errors);

      const errorResponse: ErrorResponseDTO = {
        error: "Invalid period parameter",
        details: error.errors,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Log unexpected errors for monitoring
    console.error("[API] Error calculating AI acceptance metrics:", error);

    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: "Failed to calculate metrics",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
