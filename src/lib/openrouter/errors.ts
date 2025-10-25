/**
 * OpenRouter Service Custom Error Classes
 *
 * This file contains custom error classes for handling various error scenarios
 * in the OpenRouter service with appropriate error codes and retry strategies.
 */

/**
 * Base error class for all OpenRouter service errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'OpenRouterError';
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns a user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Returns whether this error should trigger a retry
   */
  isRetryable(): boolean {
    return this.retryable;
  }
}

/**
 * Authentication error - Invalid or missing API key
 * Status: 401
 * Retryable: No
 */
export class AuthenticationError extends OpenRouterError {
  constructor(message: string = 'Authentication failed. Please check your configuration.') {
    super(message, 'AUTHENTICATION_ERROR', 401, false);
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate limit error - Too many requests
 * Status: 429
 * Retryable: Yes (with exponential backoff)
 */
export class RateLimitError extends OpenRouterError {
  constructor(
    message: string = 'Service is busy. Please try again in a moment.',
    retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, retryAfter);
    this.name = 'RateLimitError';
  }
}

/**
 * Validation error - Invalid request parameters
 * Status: 400
 * Retryable: No
 */
export class ValidationError extends OpenRouterError {
  constructor(
    message: string = 'Invalid input. Please check your request.',
    public details?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400, false);
    this.name = 'ValidationError';
  }
}

/**
 * Timeout error - Request exceeds timeout limit
 * Retryable: Yes (with increased timeout)
 */
export class TimeoutError extends OpenRouterError {
  constructor(
    message: string = 'Request timed out. Trying again...',
    public timeout: number
  ) {
    super(message, 'TIMEOUT_ERROR', undefined, true);
    this.name = 'TimeoutError';
  }
}

/**
 * Network error - Connection issues
 * Retryable: Yes (with exponential backoff)
 */
export class NetworkError extends OpenRouterError {
  constructor(
    message: string = 'Connection error. Please check your internet connection.',
    public originalError?: Error
  ) {
    super(message, 'NETWORK_ERROR', undefined, true);
    this.name = 'NetworkError';
  }
}

/**
 * Parse error - Invalid JSON in response
 * Retryable: Yes (retry once, then fallback)
 */
export class ParseError extends OpenRouterError {
  constructor(
    message: string = 'Unexpected response format. Attempting to process...',
    public rawResponse?: string
  ) {
    super(message, 'PARSE_ERROR', undefined, true);
    this.name = 'ParseError';
  }
}

/**
 * Service unavailable error - OpenRouter API is down
 * Status: 503
 * Retryable: Yes
 */
export class ServiceUnavailableError extends OpenRouterError {
  constructor(message: string = 'Service temporarily unavailable. Please try again later.') {
    super(message, 'SERVICE_UNAVAILABLE', 503, true);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Insufficient quota error - API quota exceeded
 * Status: 402
 * Retryable: No
 */
export class InsufficientQuotaError extends OpenRouterError {
  constructor(message: string = 'API quota exceeded. Please check your account.') {
    super(message, 'INSUFFICIENT_QUOTA', 402, false);
    this.name = 'InsufficientQuotaError';
  }
}

/**
 * Model not found error - Requested model is not available
 * Status: 404
 * Retryable: No
 */
export class ModelNotFoundError extends OpenRouterError {
  constructor(
    message: string = 'Requested model not found.',
    public modelName?: string
  ) {
    super(message, 'MODEL_NOT_FOUND', 404, false);
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Content filter error - Content was filtered by OpenRouter
 * Status: 400
 * Retryable: No
 */
export class ContentFilterError extends OpenRouterError {
  constructor(message: string = 'Content was filtered. Please modify your input.') {
    super(message, 'CONTENT_FILTER_ERROR', 400, false);
    this.name = 'ContentFilterError';
  }
}

/**
 * Helper function to create appropriate error from HTTP response
 */
export function createErrorFromResponse(
  statusCode: number,
  responseBody: unknown,
  defaultMessage: string
): OpenRouterError {
  const message = extractErrorMessage(responseBody) || defaultMessage;

  switch (statusCode) {
    case 401:
    case 403:
      return new AuthenticationError(message);
    case 429:
      const retryAfter = extractRetryAfter(responseBody);
      return new RateLimitError(message, retryAfter);
    case 400:
      if (isContentFilterError(responseBody)) {
        return new ContentFilterError(message);
      }
      return new ValidationError(message, responseBody);
    case 402:
      return new InsufficientQuotaError(message);
    case 404:
      return new ModelNotFoundError(message);
    case 503:
    case 504:
      return new ServiceUnavailableError(message);
    default:
      return new OpenRouterError(
        message,
        'UNKNOWN_ERROR',
        statusCode,
        statusCode >= 500 // Retry on server errors
      );
  }
}

/**
 * Extract error message from response body
 */
function extractErrorMessage(responseBody: unknown): string | null {
  if (!responseBody || typeof responseBody !== 'object') {
    return null;
  }

  const body = responseBody as Record<string, unknown>;

  // Try common error message fields
  if (typeof body.error === 'string') {
    return body.error;
  }

  if (typeof body.message === 'string') {
    return body.message;
  }

  if (body.error && typeof body.error === 'object') {
    const errorObj = body.error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }

  return null;
}

/**
 * Extract retry-after header value from response
 */
function extractRetryAfter(responseBody: unknown): number | undefined {
  if (!responseBody || typeof responseBody !== 'object') {
    return undefined;
  }

  const body = responseBody as Record<string, unknown>;

  if (typeof body.retry_after === 'number') {
    return body.retry_after * 1000; // Convert to milliseconds
  }

  if (typeof body.retryAfter === 'number') {
    return body.retryAfter * 1000;
  }

  return undefined;
}

/**
 * Check if error is a content filter error
 */
function isContentFilterError(responseBody: unknown): boolean {
  if (!responseBody || typeof responseBody !== 'object') {
    return false;
  }

  const body = responseBody as Record<string, unknown>;
  const message = extractErrorMessage(responseBody)?.toLowerCase() || '';

  return (
    message.includes('content filter') ||
    message.includes('content policy') ||
    message.includes('inappropriate') ||
    body.code === 'content_filter'
  );
}
