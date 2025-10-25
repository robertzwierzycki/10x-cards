/**
 * OpenRouter Service Convenience Export
 *
 * This file provides a convenient single import point for the OpenRouter service
 * and all related types, errors, and schemas.
 *
 * Usage:
 * ```typescript
 * import { OpenRouterService, OpenRouterError } from '@/lib/openrouter.service';
 * ```
 */

// Re-export everything from the main service
export * from './openrouter';

// Default export for convenience
export { OpenRouterService as default } from './openrouter';
