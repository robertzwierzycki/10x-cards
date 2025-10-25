/**
 * Profile Validation Schemas
 *
 * Zod schemas for validating profile-related API requests
 */

import { z } from "zod";

/**
 * Schema for validating update profile request body
 *
 * Validates username:
 * - Optional field
 * - 3-50 characters when provided
 * - Alphanumeric characters and underscores only
 * - Automatically trimmed
 *
 * Used in: PUT /api/profile
 */
export const updateProfileBodySchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .transform((val) => val.trim())
    .optional(),
});

/**
 * Type inference for updateProfileBody validation
 */
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
