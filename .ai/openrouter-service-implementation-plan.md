# OpenRouter Service Implementation Guide

## Service Description

The OpenRouter Service is a server-side TypeScript service that provides secure integration with the OpenRouter API for generating educational flashcards using GPT-4o-mini. This service handles chat completions, enforces input limits (1000 characters), implements structured JSON responses for flashcard generation, and provides robust error handling with retry logic.

The service is designed to run exclusively on the server-side (Astro API routes) to protect API keys and implement rate limiting, caching, and usage tracking.

## Constructor Description

The constructor initializes the OpenRouter service with required configuration and validates the connection.

**Parameters:**
- `apiKey` (string, required): OpenRouter API key from environment variables
- `options` (OpenRouterOptions, optional): Configuration options

**Configuration Options:**
```typescript
interface OpenRouterOptions {
  baseUrl?: string;              // Default: "https://openrouter.ai/api/v1"
  defaultModel?: string;          // Default: "openai/gpt-4o-mini"
  maxRetries?: number;           // Default: 3
  retryDelay?: number;           // Default: 1000ms
  timeout?: number;              // Default: 30000ms (30 seconds)
  maxInputLength?: number;       // Default: 1000 characters
  defaultTemperature?: number;   // Default: 0.7
  defaultMaxTokens?: number;     // Default: 500
}
```

**Initialization Process:**
1. Validates API key presence
2. Sets default configuration values
3. Creates HTTP client with proper headers
4. Optionally tests connection with a simple prompt

## Public Methods and Fields

### 1. `generateFlashcards(input: string, options?: GenerateOptions): Promise<FlashcardResponse>`

Generates flashcards from user-provided text with automatic truncation and structured JSON response.

**Parameters:**
- `input`: Text to generate flashcards from (auto-truncated to 1000 chars)
- `options`: Optional generation parameters

**Returns:**
```typescript
interface FlashcardResponse {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
  tokensUsed: number;
  modelUsed: string;
  truncated: boolean;
}
```

### 2. `generateCompletion(messages: Message[], options?: CompletionOptions): Promise<CompletionResponse>`

Low-level method for custom chat completions with full control over messages and parameters.

**Parameters:**
- `messages`: Array of chat messages
- `options`: Completion parameters including response_format

### 3. `testConnection(): Promise<boolean>`

Validates API key and connection to OpenRouter.

### 4. `getUsageStats(): Promise<UsageStats>`

Returns current usage statistics and rate limit information.

### 5. Public Fields

```typescript
readonly model: string;           // Current model identifier
readonly maxInputLength: number;  // Maximum input character limit
readonly isInitialized: boolean;  // Service initialization status
```

## Private Methods and Fields

### 1. `_truncateInput(input: string): { text: string; truncated: boolean }`

Truncates input text to maximum allowed length while preserving word boundaries.

### 2. `_buildSystemPrompt(): string`

Constructs the system prompt for flashcard generation with quality guidelines.

### 3. `_buildRequestBody(messages: Message[], options: CompletionOptions): RequestBody`

Assembles the complete request body with proper structure for OpenRouter API.

### 4. `_parseFlashcardResponse(response: any): FlashcardResponse`

Parses and validates the structured JSON response from the API.

### 5. `_handleApiError(error: any, attempt: number): Promise<void>`

Implements error handling logic with exponential backoff for retries.

### 6. `_makeRequest(body: RequestBody): Promise<ApiResponse>`

Executes HTTP request to OpenRouter API with timeout and error handling.

### 7. Private Fields

```typescript
private readonly apiKey: string;
private readonly httpClient: HttpClient;
private readonly rateLimiter: RateLimiter;
private readonly cache: Map<string, CachedResponse>;
private retryCount: Map<string, number>;
```

## Error Handling

### Error Types and Responses

1. **AuthenticationError (401)**
   - Cause: Invalid or missing API key
   - Action: Throw immediately, no retry
   - User message: "Authentication failed. Please check your configuration."

2. **RateLimitError (429)**
   - Cause: Too many requests
   - Action: Exponential backoff with jitter
   - User message: "Service is busy. Please try again in a moment."

3. **ValidationError (400)**
   - Cause: Invalid request parameters
   - Action: Log error, no retry
   - User message: "Invalid input. Please check your request."

4. **TimeoutError**
   - Cause: Request exceeds timeout limit
   - Action: Retry with increased timeout
   - User message: "Request timed out. Trying again..."

5. **NetworkError**
   - Cause: Connection issues
   - Action: Retry with exponential backoff
   - User message: "Connection error. Please check your internet connection."

6. **ParseError**
   - Cause: Invalid JSON in response
   - Action: Retry once, then fallback to text parsing
   - User message: "Unexpected response format. Attempting to process..."

### Error Recovery Strategy

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// Exponential backoff implementation
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!this.isRetryable(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

## Security Considerations

### 1. API Key Protection
- Store API key in environment variables (`OPENROUTER_API_KEY`)
- Never expose in client-side code or Git repository
- Implement key rotation mechanism
- Use Supabase Edge Functions or Astro API routes for all API calls

### 2. Input Validation
- Sanitize all user inputs before processing
- Implement Zod schemas for request validation
- Enforce character limits on client and server
- Prevent injection attacks through proper escaping

### 3. Rate Limiting
- Implement per-user rate limiting using Supabase auth
- Track usage in database for billing/quotas
- Use Redis or in-memory cache for rate limit counters
- Return appropriate 429 status codes

### 4. Data Privacy
- Never log full API keys or sensitive user data
- Implement request/response logging with PII redaction
- Use HTTPS for all API communications
- Store generated flashcards with proper user isolation

### 5. Error Information Disclosure
- Never expose internal error details to clients
- Log detailed errors server-side only
- Return generic error messages to users
- Implement proper error monitoring (e.g., Sentry)

## Step-by-Step Implementation Plan

### Phase 1: Setup and Configuration (Day 1)

1. **Create service directory structure:**
   ```
   src/services/openrouter/
   ├── index.ts           // Main service class
   ├── types.ts           // TypeScript interfaces
   ├── errors.ts          // Custom error classes
   ├── schemas.ts         // Zod validation schemas
   └── utils.ts           // Helper functions
   ```

2. **Define TypeScript interfaces in `types.ts`:**
   ```typescript
   export interface Message {
     role: 'system' | 'user' | 'assistant';
     content: string;
   }

   export interface FlashcardSchema {
     type: 'json_schema';
     json_schema: {
       name: 'flashcard_generation';
       strict: true;
       schema: {
         type: 'object';
         properties: {
           flashcards: {
             type: 'array';
             items: {
               type: 'object';
               properties: {
                 front: { type: 'string' };
                 back: { type: 'string' };
               };
               required: ['front', 'back'];
             };
           };
         };
         required: ['flashcards'];
       };
     };
   }
   ```

3. **Create Zod validation schemas in `schemas.ts`:**
   ```typescript
   import { z } from 'zod';

   export const flashcardSchema = z.object({
     flashcards: z.array(z.object({
       front: z.string().min(1).max(500),
       back: z.string().min(1).max(500)
     })).min(1).max(10)
   });

   export const generateRequestSchema = z.object({
     input: z.string().min(1).max(1000),
     count: z.number().min(1).max(10).optional()
   });
   ```

### Phase 2: Core Service Implementation (Day 2)

4. **Implement main service class in `index.ts`:**
   ```typescript
   export class OpenRouterService {
     private readonly apiKey: string;
     private readonly baseUrl: string;
     private readonly defaultModel: string = 'openai/gpt-4o-mini';

     constructor(options: OpenRouterOptions) {
       if (!options.apiKey) {
         throw new Error('OpenRouter API key is required');
       }
       this.apiKey = options.apiKey;
       this.baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
     }

     async generateFlashcards(input: string, count: number = 5): Promise<FlashcardResponse> {
       // Implementation here
     }
   }
   ```

5. **Implement error handling in `errors.ts`:**
   ```typescript
   export class OpenRouterError extends Error {
     constructor(
       message: string,
       public code: string,
       public statusCode?: number,
       public retryable: boolean = false
     ) {
       super(message);
       this.name = 'OpenRouterError';
     }
   }
   ```

### Phase 3: API Integration (Day 3)

6. **Create Astro API endpoint in `src/pages/api/flashcards/generate.ts`:**
   ```typescript
   import type { APIRoute } from 'astro';
   import { OpenRouterService } from '@/services/openrouter';
   import { generateRequestSchema } from '@/services/openrouter/schemas';

   export const prerender = false;

   export const POST: APIRoute = async ({ request, locals }) => {
     const supabase = locals.supabase;
     const session = await supabase.auth.getSession();

     if (!session.data.session) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), {
         status: 401
       });
     }

     try {
       const body = await request.json();
       const validated = generateRequestSchema.parse(body);

       const service = new OpenRouterService({
         apiKey: import.meta.env.OPENROUTER_API_KEY
       });

       const response = await service.generateFlashcards(validated.input);

       return new Response(JSON.stringify(response), {
         status: 200,
         headers: { 'Content-Type': 'application/json' }
       });
     } catch (error) {
       // Error handling
     }
   };
   ```

### Phase 4: Message Building and Response Parsing (Day 4)

7. **Implement message builders in service:**
   ```typescript
   private buildSystemPrompt(): string {
     return `You are an expert educational content creator. Generate clear, concise flashcards that:
     - Focus on key concepts and definitions
     - Use simple, understandable language
     - Avoid ambiguity in questions and answers
     - Create cards that test understanding, not just memorization`;
   }

   private buildMessages(input: string): Message[] {
     return [
       { role: 'system', content: this.buildSystemPrompt() },
       { role: 'user', content: `Create flashcards from this text: ${this.truncateInput(input)}` }
     ];
   }
   ```

8. **Implement response format configuration:**
   ```typescript
   private getResponseFormat(): FlashcardSchema {
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
                   back: { type: 'string' }
                 },
                 required: ['front', 'back']
               }
             }
           },
           required: ['flashcards']
         }
       }
     };
   }
   ```

### Phase 5: Testing and Optimization (Day 5)

9. **Create test suite in `src/services/openrouter/__tests__/`:**
   - Unit tests for input truncation
   - Mock API response tests
   - Error handling scenarios
   - Rate limiting behavior

10. **Implement caching mechanism:**
    ```typescript
    private cache = new Map<string, CachedResponse>();

    private getCacheKey(input: string): string {
      return crypto.createHash('sha256').update(input).digest('hex');
    }

    private getCached(key: string): FlashcardResponse | null {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
        return cached.response;
      }
      return null;
    }
    ```

### Phase 6: Production Readiness (Day 6)

11. **Add monitoring and logging:**
    - Request/response logging (without sensitive data)
    - Performance metrics (response times)
    - Error rate tracking
    - Usage analytics

12. **Implement rate limiting:**
    ```typescript
    private rateLimiter = new Map<string, RateLimitInfo>();

    private checkRateLimit(userId: string): boolean {
      const limit = this.rateLimiter.get(userId);
      const now = Date.now();

      if (!limit || now - limit.resetTime > 60000) { // Reset every minute
        this.rateLimiter.set(userId, {
          count: 1,
          resetTime: now
        });
        return true;
      }

      if (limit.count >= 10) { // 10 requests per minute
        return false;
      }

      limit.count++;
      return true;
    }
    ```

13. **Add usage tracking to database:**
    - Create Supabase table for API usage
    - Track tokens used per user
    - Implement billing/quota checks

### Phase 7: Documentation and Deployment (Day 7)

14. **Create comprehensive documentation:**
    - API endpoint documentation
    - Service configuration guide
    - Error code reference
    - Usage examples

15. **Final deployment checklist:**
    - Environment variables configured
    - Error monitoring enabled
    - Rate limiting tested
    - Security audit completed
    - Performance benchmarks met
    - Documentation reviewed