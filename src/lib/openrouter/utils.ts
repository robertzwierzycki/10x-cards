/**
 * OpenRouter Service Utility Functions
 *
 * This file contains helper functions for the OpenRouter service including
 * input truncation, caching, hashing, and other common operations.
 */

import type { TruncationResult, Message, FlashcardSchema } from './types';

/**
 * Truncates input text to maximum allowed length while preserving word boundaries
 *
 * @param input - The text to truncate
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Object containing truncated text and truncation flag
 */
export function truncateInput(input: string, maxLength: number = 1000): TruncationResult {
  if (!input) {
    return { text: '', truncated: false };
  }

  const trimmedInput = input.trim();

  if (trimmedInput.length <= maxLength) {
    return { text: trimmedInput, truncated: false };
  }

  // Find the last space before the max length to avoid cutting words
  let truncateAt = maxLength;
  const lastSpace = trimmedInput.lastIndexOf(' ', maxLength);

  if (lastSpace > maxLength * 0.8) {
    // Only use word boundary if it's not too far back (at least 80% of max length)
    truncateAt = lastSpace;
  }

  const truncatedText = trimmedInput.substring(0, truncateAt).trim();

  return {
    text: truncatedText,
    truncated: true,
  };
}

/**
 * Generates a cache key from input text using SHA-256 hash
 *
 * @param input - The input text to hash
 * @returns Hexadecimal hash string
 */
export async function generateCacheKey(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Builds the system prompt for flashcard generation
 *
 * @returns System prompt string with quality guidelines
 */
export function buildSystemPrompt(): string {
  return `You are an expert educational content creator specialized in creating effective flashcards for learning.

Generate clear, concise flashcards that:
- Focus on key concepts, definitions, and important facts
- Use simple, understandable language appropriate for learners
- Avoid ambiguity in both questions and answers
- Create cards that test understanding and application, not just memorization
- Keep each card focused on a single concept or fact
- Ensure the front (question) can stand alone without additional context
- Provide complete and accurate answers on the back

Format your response as a JSON object with a "flashcards" array containing objects with "front" and "back" properties.`;
}

/**
 * Builds messages array for chat completion
 *
 * @param input - User input text
 * @param count - Number of flashcards to generate
 * @returns Array of messages for the API
 */
export function buildMessages(input: string, count: number = 5): Message[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(),
    },
    {
      role: 'user',
      content: `Create exactly ${count} flashcards from the following text:\n\n${input}`,
    },
  ];
}

/**
 * Gets the response format configuration for flashcard generation
 *
 * @returns FlashcardSchema object for structured JSON response
 */
export function getFlashcardResponseFormat(): FlashcardSchema {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'flashcard_generation',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string' },
                back: { type: 'string' },
              },
              required: ['front', 'back'],
              additionalProperties: false,
            },
          },
        },
        required: ['flashcards'],
        additionalProperties: false,
      },
    },
  };
}

/**
 * Calculates exponential backoff delay with jitter
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 10000)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Checks if an error is retryable
 *
 * @param error - The error to check
 * @returns True if the error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  // Check if error has retryable property
  if (typeof error === 'object' && 'retryable' in error) {
    return Boolean(error.retryable);
  }

  // Check for network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('fetch')
    );
  }

  return false;
}

/**
 * Sanitizes input text to prevent injection attacks
 *
 * @param input - The input text to sanitize
 * @returns Sanitized text
 */
export function sanitizeInput(input: string): string {
  if (!input) {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validates that a string is a valid OpenRouter API key format
 *
 * @param apiKey - The API key to validate
 * @returns True if the API key format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // OpenRouter API keys typically start with "sk-or-"
  // and have a minimum length
  return apiKey.startsWith('sk-or-') && apiKey.length > 20;
}

/**
 * Redacts sensitive information from logs
 *
 * @param text - Text that might contain sensitive data
 * @returns Redacted text safe for logging
 */
export function redactSensitiveInfo(text: string): string {
  if (!text) {
    return '';
  }

  let redacted = text;

  // Redact API keys
  redacted = redacted.replace(/sk-or-[a-zA-Z0-9-_]+/g, 'sk-or-***REDACTED***');

  // Redact bearer tokens
  redacted = redacted.replace(/Bearer\s+[a-zA-Z0-9-_]+/gi, 'Bearer ***REDACTED***');

  // Redact authorization headers
  redacted = redacted.replace(
    /"authorization":\s*"[^"]+"/gi,
    '"authorization": "***REDACTED***"'
  );

  return redacted;
}

/**
 * Formats usage statistics for logging
 *
 * @param tokens - Token usage object
 * @returns Formatted string
 */
export function formatUsageStats(tokens: {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}): string {
  return `Tokens used: ${tokens.total_tokens} (prompt: ${tokens.prompt_tokens}, completion: ${tokens.completion_tokens})`;
}

/**
 * Checks if cache entry is still valid
 *
 * @param timestamp - Cache entry timestamp
 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns True if cache entry is valid
 */
export function isCacheValid(timestamp: number, maxAge: number = 3600000): boolean {
  return Date.now() - timestamp < maxAge;
}

/**
 * Parses JSON safely with fallback
 *
 * @param jsonString - JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function safeJsonParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Delays execution for specified milliseconds
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
