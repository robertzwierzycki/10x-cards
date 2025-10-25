/**
 * OpenRouter Service
 *
 * Main service class for interacting with the OpenRouter API to generate
 * educational flashcards using GPT-4o-mini with structured JSON responses.
 */

import type {
  OpenRouterOptions,
  FlashcardResponse,
  GenerateOptions,
  CompletionOptions,
  CompletionResponse,
  UsageStats,
  Message,
  RequestBody,
  ApiResponse,
  CachedResponse,
  RateLimitInfo,
} from './types';

import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  NetworkError,
  ParseError,
  createErrorFromResponse,
} from './errors';

import {
  truncateInput,
  generateCacheKey,
  buildMessages,
  getFlashcardResponseFormat,
  calculateBackoffDelay,
  isRetryableError,
  sanitizeInput,
  isValidApiKeyFormat,
  redactSensitiveInfo,
  formatUsageStats,
  isCacheValid,
  safeJsonParse,
  delay,
} from './utils';

import {
  generateOptionsSchema,
  completionOptionsSchema,
  flashcardArraySchema,
  apiResponseSchema,
} from './schemas';

/**
 * OpenRouter Service Class
 *
 * Provides secure integration with OpenRouter API for flashcard generation
 */
export class OpenRouterService {
  // Public readonly fields
  public readonly model: string;
  public readonly maxInputLength: number;
  public readonly isInitialized: boolean = true;

  // Private configuration fields
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;

  // Private state fields
  private readonly cache: Map<string, CachedResponse>;
  private readonly rateLimiter: Map<string, RateLimitInfo>;
  private readonly usageStats: UsageStats;

  /**
   * Creates a new OpenRouter service instance
   *
   * @param options - Configuration options for the service
   * @throws {AuthenticationError} If API key is missing or invalid
   */
  constructor(options: OpenRouterOptions) {
    // Validate API key
    if (!options.apiKey) {
      throw new AuthenticationError('OpenRouter API key is required');
    }

    if (!isValidApiKeyFormat(options.apiKey)) {
      throw new AuthenticationError('Invalid OpenRouter API key format');
    }

    // Initialize configuration with defaults
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
    this.model = options.defaultModel || 'openai/gpt-4o-mini';
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.timeout = options.timeout ?? 30000;
    this.maxInputLength = options.maxInputLength ?? 1000;
    this.defaultTemperature = options.defaultTemperature ?? 0.7;
    this.defaultMaxTokens = options.defaultMaxTokens ?? 500;

    // Initialize state
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
    };
  }

  /**
   * Generates flashcards from user-provided text
   *
   * @param input - Text to generate flashcards from (auto-truncated to maxInputLength)
   * @param options - Optional generation parameters
   * @returns Promise resolving to flashcard response
   * @throws {ValidationError} If input is invalid
   * @throws {OpenRouterError} If API request fails
   */
  async generateFlashcards(
    input: string,
    options?: GenerateOptions
  ): Promise<FlashcardResponse> {
    // Validate and sanitize input
    if (!input || typeof input !== 'string') {
      throw new ValidationError('Input text is required');
    }

    const sanitizedInput = sanitizeInput(input);
    if (!sanitizedInput) {
      throw new ValidationError('Input text cannot be empty after sanitization');
    }

    // Validate options
    const validatedOptions = options
      ? generateOptionsSchema.parse(options)
      : generateOptionsSchema.parse({});

    // Truncate input to max length
    const { text: truncatedInput, truncated } = truncateInput(
      sanitizedInput,
      this.maxInputLength
    );

    // Check cache
    const cacheKey = await generateCacheKey(
      `${truncatedInput}-${validatedOptions.count}`
    );
    const cachedResponse = this._getCached(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Build messages
    const messages = buildMessages(truncatedInput, validatedOptions.count);

    // Build completion options
    const completionOptions: CompletionOptions = {
      model: this.model,
      temperature: validatedOptions.temperature ?? this.defaultTemperature,
      maxTokens: validatedOptions.maxTokens ?? this.defaultMaxTokens,
      responseFormat: getFlashcardResponseFormat(),
    };

    // Make API request with retry logic
    const startTime = Date.now();
    const apiResponse = await this._retryWithBackoff(() =>
      this._makeRequest(this._buildRequestBody(messages, completionOptions))
    );

    // Parse and validate response
    const flashcardResponse = this._parseFlashcardResponse(apiResponse, truncated);

    // Update stats
    this._updateUsageStats(apiResponse.usage.total_tokens, Date.now() - startTime);

    // Cache response
    this._setCached(cacheKey, flashcardResponse);

    return flashcardResponse;
  }

  /**
   * Low-level method for custom chat completions
   *
   * @param messages - Array of chat messages
   * @param options - Completion parameters
   * @returns Promise resolving to completion response
   * @throws {ValidationError} If messages are invalid
   * @throws {OpenRouterError} If API request fails
   */
  async generateCompletion(
    messages: Message[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError('Messages array is required and cannot be empty');
    }

    // Validate options
    const validatedOptions = options
      ? completionOptionsSchema.parse(options)
      : completionOptionsSchema.parse({});

    // Build request body
    const requestBody = this._buildRequestBody(messages, validatedOptions);

    // Make API request with retry logic
    const apiResponse = await this._retryWithBackoff(() => this._makeRequest(requestBody));

    // Update stats
    this._updateUsageStats(apiResponse.usage.total_tokens, 0);

    // Transform to CompletionResponse format
    return {
      id: apiResponse.id,
      model: apiResponse.model,
      choices: apiResponse.choices.map((choice) => ({
        message: {
          role: choice.message.role as 'system' | 'user' | 'assistant',
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
        index: choice.index,
      })),
      usage: apiResponse.usage,
      created: apiResponse.created,
    };
  }

  /**
   * Tests the connection to OpenRouter API
   *
   * @returns Promise resolving to true if connection is successful
   * @throws {OpenRouterError} If connection test fails
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: Message[] = [
        { role: 'user', content: 'Hello' },
      ];

      await this._makeRequest(
        this._buildRequestBody(testMessages, {
          model: this.model,
          maxTokens: 5,
        })
      );

      return true;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new NetworkError('Failed to connect to OpenRouter API');
    }
  }

  /**
   * Returns current usage statistics
   *
   * @returns Promise resolving to usage stats
   */
  async getUsageStats(): Promise<UsageStats> {
    return { ...this.usageStats };
  }

  /**
   * Checks rate limit for a user
   *
   * @param userId - User identifier
   * @returns True if rate limit allows request
   */
  checkRateLimit(userId: string): boolean {
    const limit = this.rateLimiter.get(userId);
    const now = Date.now();

    if (!limit || now - limit.resetTime > 60000) {
      // Reset every minute
      this.rateLimiter.set(userId, {
        count: 1,
        resetTime: now,
      });
      return true;
    }

    if (limit.count >= 10) {
      // 10 requests per minute
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ==================== Private Methods ====================

  /**
   * Builds the request body for OpenRouter API
   *
   * @param messages - Array of messages
   * @param options - Completion options
   * @returns Request body object
   */
  private _buildRequestBody(messages: Message[], options: CompletionOptions): RequestBody {
    const body: RequestBody = {
      model: options.model || this.model,
      messages,
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    if (options.responseFormat) {
      body.response_format = options.responseFormat;
    }

    if (options.topP !== undefined) {
      body.top_p = options.topP;
    }

    if (options.frequencyPenalty !== undefined) {
      body.frequency_penalty = options.frequencyPenalty;
    }

    if (options.presencePenalty !== undefined) {
      body.presence_penalty = options.presencePenalty;
    }

    return body;
  }

  /**
   * Makes an HTTP request to OpenRouter API
   *
   * @param body - Request body
   * @returns Promise resolving to API response
   * @throws {OpenRouterError} If request fails
   */
  private async _makeRequest(body: RequestBody): Promise<ApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://10xcards.app',
          'X-Title': '10xCards',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw createErrorFromResponse(
          response.status,
          errorBody,
          `API request failed with status ${response.status}`
        );
      }

      // Parse response
      const data = await response.json();

      // Validate response structure
      const validatedResponse = apiResponseSchema.parse(data);

      return validatedResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${this.timeout}ms`, this.timeout);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed', error);
      }

      // Re-throw OpenRouter errors
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Wrap unknown errors
      throw new OpenRouterError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Parses flashcard response from API
   *
   * @param response - API response
   * @param truncated - Whether input was truncated
   * @returns Flashcard response object
   * @throws {ParseError} If response parsing fails
   */
  private _parseFlashcardResponse(
    response: ApiResponse,
    truncated: boolean
  ): FlashcardResponse {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new ParseError('Empty response content');
      }

      // Parse JSON content
      const parsedContent = safeJsonParse(content);
      if (!parsedContent) {
        throw new ParseError('Failed to parse response JSON', content);
      }

      // Validate structure
      const validated = flashcardArraySchema.parse(parsedContent);

      return {
        flashcards: validated.flashcards,
        tokensUsed: response.usage.total_tokens,
        modelUsed: response.model,
        truncated,
      };
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(
        `Failed to parse flashcard response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Implements retry logic with exponential backoff
   *
   * @param operation - Async operation to retry
   * @returns Promise resolving to operation result
   * @throws {OpenRouterError} If all retries fail
   */
  private async _retryWithBackoff<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.usageStats.totalErrors++;

        // Don't retry non-retryable errors
        if (
          error instanceof OpenRouterError &&
          !error.isRetryable() &&
          !(error instanceof RateLimitError)
        ) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries - 1) {
          throw error;
        }

        // Calculate delay
        let delayMs: number;
        if (error instanceof RateLimitError && error.retryAfter) {
          delayMs = error.retryAfter;
        } else {
          delayMs = calculateBackoffDelay(attempt, this.retryDelay);
        }

        // Wait before retry
        await delay(delayMs);
      }
    }

    throw lastError || new OpenRouterError('Operation failed after retries', 'RETRY_FAILED');
  }

  /**
   * Gets cached response if valid
   *
   * @param key - Cache key
   * @returns Cached response or null
   */
  private _getCached(key: string): FlashcardResponse | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (!isCacheValid(cached.timestamp)) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  /**
   * Sets cached response
   *
   * @param key - Cache key
   * @param response - Response to cache
   */
  private _setCached(key: string, response: FlashcardResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Simple cache size management - remove oldest if too large
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Updates usage statistics
   *
   * @param tokens - Tokens used in request
   * @param responseTime - Response time in milliseconds
   */
  private _updateUsageStats(tokens: number, responseTime: number): void {
    this.usageStats.totalRequests++;
    this.usageStats.totalTokens += tokens;
    this.usageStats.lastRequestTime = Date.now();

    if (responseTime > 0) {
      const currentTotal = this.usageStats.averageResponseTime * (this.usageStats.totalRequests - 1);
      this.usageStats.averageResponseTime =
        (currentTotal + responseTime) / this.usageStats.totalRequests;
    }
  }
}

// Export types and errors for convenience
export * from './types';
export * from './errors';
export * from './schemas';
