# AI Flashcard Generation - Setup Guide

## Overview

The AI generation endpoint (`POST /api/ai/generate`) uses OpenRouter to access GPT-4o-mini for generating educational flashcards from user-provided text.

## Environment Configuration

### Required Environment Variable

Add your OpenRouter API key to the `.env` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
```

### Getting an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key and add it to your `.env` file

### Environment Variable Types

The `OPENROUTER_API_KEY` is already typed in `src/env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string; // ✓ Already configured
}
```

## API Endpoint Details

### Endpoint
```
POST /api/ai/generate
```

### Request Format
```json
{
  "text": "Your educational text here (1-1000 characters)"
}
```

### Response Format
```json
{
  "suggestions": [
    {
      "front": "What is the capital of France?",
      "back": "Paris"
    }
    // ... up to 5 suggestions
  ],
  "count": 5,
  "truncated": false
}
```

### Rate Limiting
- **Limit:** 10 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit: 10`
  - `X-RateLimit-Remaining: 9`
  - `X-RateLimit-Reset: 45` (seconds until reset)

### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation failed | Invalid or empty text input |
| 401 | Authentication required | Missing or invalid JWT token |
| 429 | Rate limit exceeded | User exceeded 10 req/min limit |
| 500 | Internal server error | Unexpected error occurred |
| 503 | Service unavailable | AI service timeout or rate limited |

## Features

### Input Sanitization
The service automatically sanitizes input to prevent prompt injection:
- Removes angle brackets (`<>`)
- Limits consecutive newlines
- Removes excessive whitespace
- Enforces 1000 character limit

### Performance Monitoring
Each request logs metrics for P95 analysis:
```typescript
{
  userId: "uuid",
  responseTime: 1234, // milliseconds
  flashcardCount: 5,
  textLength: 500,
  truncated: false,
  timestamp: "2024-01-01T00:00:00Z"
}
```

### Timeout Protection
- **Timeout:** 5 seconds
- Requests exceeding 5 seconds are automatically aborted
- Returns 503 Service Unavailable

### Retry Logic
The AI service includes exponential backoff retry logic:
- **Max Retries:** 3
- **Backoff:** 1s, 2s, 4s
- Does not retry on rate limits or service unavailable errors

## Testing

### Using cURL

```bash
# Get your JWT token from Supabase Auth
export JWT_TOKEN="your-supabase-jwt-token"

# Make request
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "text": "The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration."
  }'
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Authorization header automatically included by Supabase client
  },
  body: JSON.stringify({
    text: 'Your educational text here...'
  })
});

const data = await response.json();

if (response.ok) {
  console.log(`Generated ${data.count} flashcards:`, data.suggestions);
} else {
  console.error('Error:', data.error);
}
```

## Cost Considerations

### OpenRouter Pricing
- Model: `openai/gpt-4o-mini`
- Cost: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average request: ~200 input tokens, ~300 output tokens
- **Estimated cost per request:** ~$0.0002 USD

### Rate Limiting Economics
With 10 req/min limit:
- Max requests per user per hour: 600
- Max requests per user per day: 14,400
- Estimated daily cost per active user: ~$2.88

## Security

### API Key Protection
- ✓ Stored in environment variables
- ✓ Never exposed in client-side code
- ✓ Server-side endpoint only
- ✓ Not included in response headers or logs

### Input Validation
- ✓ Zod schema validation
- ✓ Character limit enforcement (1000)
- ✓ Prompt injection prevention
- ✓ Sanitization of dangerous characters

### Authentication
- ✓ Supabase JWT verification
- ✓ User must be authenticated
- ✓ Per-user rate limiting

## Troubleshooting

### "OPENROUTER_API_KEY environment variable is not set"
- **Cause:** Missing or invalid API key in `.env`
- **Solution:** Add valid OpenRouter API key to `.env` file

### "Rate limit exceeded"
- **Cause:** User exceeded 10 requests per minute
- **Solution:** Wait for rate limit to reset (check `retry_after` in response)

### "AI service request timed out"
- **Cause:** OpenRouter API took longer than 5 seconds
- **Solution:** Retry the request or contact support if persistent

### "Failed to generate valid flashcards from AI response"
- **Cause:** AI returned malformed JSON or no valid flashcards
- **Solution:** Retry with different input text or check OpenRouter status

## Future Enhancements

1. **Response Streaming** - Stream flashcards as they're generated
2. **Language Detection** - Support multilingual flashcard generation
3. **Caching** - Cache similar requests to improve response times
4. **Async Processing** - Queue large batch generations
5. **Custom Prompts** - Allow users to customize generation style
6. **Quality Scoring** - Rate flashcard quality automatically

## Related Files

- **Endpoint:** `src/pages/api/ai/generate.ts`
- **Service:** `src/services/ai-generation.service.ts`
- **Schema:** `src/schemas/ai-generation.schema.ts`
- **Rate Limiter:** `src/services/rate-limiter.service.ts`
- **Types:** `src/types.ts` (GenerateFlashcardsCommand, GenerateFlashcardsResponseDTO)
