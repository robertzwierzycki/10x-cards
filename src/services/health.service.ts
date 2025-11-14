/**
 * Health Service
 *
 * Provides health check functionality for monitoring application status.
 * Checks database connectivity and AI service availability with proper timeouts.
 */

import type { HealthCheckDTO, ServiceStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const VERSION = "1.0.0";
const DB_TIMEOUT = 3000; // 3 seconds
const AI_TIMEOUT = 5000; // 5 seconds

/**
 * Performs comprehensive health check of all services
 *
 * @param supabase - Supabase client instance
 * @returns Health check results with service statuses
 */
export async function checkHealth(supabase: SupabaseClient): Promise<HealthCheckDTO> {
  // Execute health checks in parallel for optimal performance
  const [dbResult, aiResult] = await Promise.allSettled([checkDatabase(supabase), checkAIService()]);

  // Extract service statuses from results
  const databaseStatus: ServiceStatus = dbResult.status === "fulfilled" ? dbResult.value : "disconnected";
  const aiServiceStatus: ServiceStatus = aiResult.status === "fulfilled" ? aiResult.value : "unavailable";

  // Determine overall health status
  const overallStatus = databaseStatus === "connected" && aiServiceStatus === "available" ? "healthy" : "unhealthy";

  return {
    status: overallStatus,
    version: VERSION,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseStatus,
      ai_service: aiServiceStatus,
    },
  };
}

/**
 * Checks database connectivity with timeout
 *
 * Performs a lightweight query to verify database connection.
 * Returns 'disconnected' if timeout is exceeded or query fails.
 *
 * @param supabase - Supabase client instance
 * @returns Database service status
 */
async function checkDatabase(supabase: SupabaseClient): Promise<ServiceStatus> {
  try {
    // Create timeout promise that rejects after DB_TIMEOUT
    const timeoutPromise = new Promise<ServiceStatus>((_, reject) =>
      setTimeout(() => reject(new Error("Database timeout")), DB_TIMEOUT)
    );

    // Execute lightweight query to check connection
    // Using profiles table with limit 1 for minimal overhead
    const queryPromise = supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .then(({ error }) => {
        if (error) {
          throw error;
        }
        return "connected" as ServiceStatus;
      });

    // Race between query and timeout
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error) {
    // Log error for monitoring but don't expose details to client
    console.error("Database health check failed:", error);
    return "disconnected";
  }
}

/**
 * Checks AI service availability with timeout
 *
 * Performs HEAD request to OpenRouter API to verify service availability.
 * Returns 'unavailable' if timeout is exceeded or request fails.
 *
 * @returns AI service status
 */
async function checkAIService(): Promise<ServiceStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

    // Check if API key is configured
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY not configured");
      clearTimeout(timeoutId);
      return "unavailable";
    }

    // Perform HEAD request to check service availability
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    clearTimeout(timeoutId);

    return response.ok ? "available" : "unavailable";
  } catch (error) {
    // Handle both timeout (AbortError) and network errors
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("AI service health check timed out");
      } else {
        console.error("AI service health check failed:", error.message);
      }
    }
    return "unavailable";
  }
}
