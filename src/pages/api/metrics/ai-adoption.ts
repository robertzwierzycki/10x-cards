/**
 * AI Adoption Metrics Endpoint
 *
 * GET /api/metrics/ai-adoption
 *
 * Returns metrics measuring the percentage of active flashcards that are AI-generated.
 * Key Success Metric (KSM 2): Target adoption rate is 75%.
 *
 * Authentication required.
 */

import type { APIRoute } from "astro";
import { MetricsService } from "@/services/metrics.service";
import type { AIAdoptionMetricsDTO, ErrorResponseDTO } from "@/types";

// Disable prerendering for dynamic metrics calculation
export const prerender = false;

/**
 * GET /api/metrics/ai-adoption
 *
 * Calculates and returns AI adoption metrics.
 * Measures what percentage of active flashcards (studied in last 30 days) are AI-generated.
 *
 * @returns 200 OK with adoption metrics
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if metrics calculation fails
 *
 * Response body: AIAdoptionMetricsDTO
 */
export const GET: APIRoute = async ({ locals }) => {
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
    // Initialize MetricsService with Supabase client
    const metricsService = new MetricsService(locals.supabase);

    // Calculate AI adoption metrics
    const metrics: AIAdoptionMetricsDTO = await metricsService.calculateAIAdoptionMetrics();

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
    // Log error for monitoring
    console.error("[API] Error calculating AI adoption metrics:", error);

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
