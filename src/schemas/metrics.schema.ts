/**
 * Metrics Validation Schemas
 *
 * Zod schemas for validating metrics API request parameters.
 */

import { z } from "zod";

/**
 * Schema for AI Acceptance metrics query parameters
 *
 * Validates the optional 'period' parameter for time-based metrics.
 */
export const aiAcceptanceQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "all"]).optional().default("all"),
});

/**
 * Inferred type for AI Acceptance query parameters
 */
export type AIAcceptanceQueryParams = z.infer<typeof aiAcceptanceQuerySchema>;
