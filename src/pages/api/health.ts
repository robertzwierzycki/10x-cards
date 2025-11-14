/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Public endpoint for monitoring application health status.
 * Returns status of critical services (database, AI service).
 * Used by load balancers and monitoring systems.
 *
 * No authentication required.
 */

import type { APIRoute } from "astro";
import { checkHealth } from "@/services/health.service";
import type { HealthCheckDTO } from "@/types";

// Disable prerendering for dynamic health checks
export const prerender = false;

/**
 * GET /api/health
 *
 * Performs health check on all critical services.
 *
 * @returns 200 OK with health data if all services healthy
 * @returns 503 Service Unavailable if any service unhealthy
 *
 * Response body: HealthCheckDTO
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Perform health check using checkHealth function
    const healthStatus: HealthCheckDTO = await checkHealth(locals.supabase);

    // Determine HTTP status code based on overall health
    const statusCode = healthStatus.status === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(healthStatus), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        // Prevent caching of health check responses
        // Cache control will be added in next step with proper TTL
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    // Handle critical errors that prevent health check execution
    console.error("Critical error during health check:", error);

    // Return fallback unhealthy response
    const fallbackResponse: HealthCheckDTO = {
      status: "unhealthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        ai_service: "unavailable",
      },
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  }
};
