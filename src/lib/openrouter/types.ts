/**
 * OpenRouter Service Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the OpenRouter service.
 */

/**
 * Message structure for chat completions
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Configuration options for OpenRouter service initialization
 */
export interface OpenRouterOptions {
  apiKey: string;
  baseUrl?: string; // Default: "https://openrouter.ai/api/v1"
  defaultModel?: string; // Default: "openai/gpt-4o-mini"
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
  timeout?: number; // Default: 30000ms (30 seconds)
  maxInputLength?: number; // Default: 1000 characters
  defaultTemperature?: number; // Default: 0.7
  defaultMaxTokens?: number; // Default: 500
}

/**
 * Individual flashcard structure
 */
export interface Flashcard {
  front: string;
  back: string;
}

/**
 * Response structure for flashcard generation
 */
export interface FlashcardResponse {
  flashcards: Flashcard[];
  tokensUsed: number;
  modelUsed: string;
  truncated: boolean;
}

/**
 * Options for flashcard generation
 */
export interface GenerateOptions {
  count?: number; // Number of flashcards to generate (default: 5, max: 10)
  temperature?: number; // Model temperature (default: 0.7)
  maxTokens?: number; // Maximum tokens in response (default: 500)
}

/**
 * Options for custom completion requests
 */
export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * JSON Schema structure for structured responses
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties?: boolean;
    };
  };
}

/**
 * Flashcard schema for structured JSON response
 */
export interface FlashcardSchema extends ResponseFormat {
  json_schema: {
    name: "flashcard_generation";
    strict: true;
    schema: {
      type: "object";
      properties: {
        flashcards: {
          type: "array";
          items: {
            type: "object";
            properties: {
              front: { type: "string" };
              back: { type: "string" };
            };
            required: ["front", "back"];
            additionalProperties: false;
          };
        };
      };
      required: ["flashcards"];
      additionalProperties: false;
    };
  };
}

/**
 * Generic completion response
 */
export interface CompletionResponse {
  id: string;
  model: string;
  choices: {
    message: Message;
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

/**
 * Usage statistics for API monitoring
 */
export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalErrors: number;
  averageResponseTime: number;
  lastRequestTime: number | null;
}

/**
 * Request body structure for OpenRouter API
 */
export interface RequestBody {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * API Response from OpenRouter
 */
export interface ApiResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

/**
 * Cached response structure
 */
export interface CachedResponse {
  response: FlashcardResponse;
  timestamp: number;
}

/**
 * Rate limit information for tracking
 */
export interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * Truncation result
 */
export interface TruncationResult {
  text: string;
  truncated: boolean;
}
