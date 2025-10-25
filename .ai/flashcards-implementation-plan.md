# API Endpoint Implementation Plan: Flashcards Resource

## Overview

This document provides a comprehensive implementation plan for all flashcard-related API endpoints. The flashcards resource enables CRUD operations for flashcards within decks, including bulk creation for AI-generated content.

---

## GET /api/decks/:deckId/flashcards

### 1. Endpoint Overview
Retrieves a paginated list of flashcards for a specific deck. Users can only access flashcards from their own decks.

### 2. Request Details
- **HTTP Method:** GET
- **URL Pattern:** `/api/decks/:deckId/flashcards`
- **URL Parameters:**
  - Required: `deckId` (UUID format)
- **Query Parameters:**
  - Optional: `page` (number, default: 1, min: 1)
  - Optional: `limit` (number, default: 50, max: 200)

### 3. Used Types
```typescript
// Input validation
interface QueryParams {
  page?: string;
  limit?: string;
}

// Output types
FlashcardListDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}
```

### 4. Response Details
- **Success (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "deck_id": "uuid",
        "front": "string",
        "back": "string",
        "is_ai_generated": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3
    }
  }
  ```
- **Error Responses:**
  - 401: Authentication required
  - 403: Access denied (deck belongs to another user)
  - 404: Deck not found

### 5. Data Flow
1. Extract and validate deckId from URL params
2. Parse and validate query parameters
3. Verify user authentication via Supabase
4. Check deck ownership (user_id matches)
5. Query flashcards with pagination
6. Calculate total count for pagination metadata
7. Return formatted response

### 6. Security Considerations
- Authenticate user via Supabase JWT token
- Verify deck ownership before returning flashcards
- Validate UUID format for deckId
- Sanitize query parameters to prevent injection

### 7. Error Handling
- Invalid UUID format → 400 Bad Request
- Missing authentication → 401 Unauthorized
- Deck not found → 404 Not Found
- Deck belongs to another user → 403 Forbidden
- Database error → 500 Internal Server Error

### 8. Performance Considerations
- Use database indexes on `deck_id` column
- Implement cursor-based pagination for large datasets (future enhancement)
- Consider caching frequently accessed decks

### 9. Implementation Steps
1. Create validation schema with Zod:
   ```typescript
   const paramsSchema = z.object({
     deckId: z.string().uuid()
   });
   const querySchema = z.object({
     page: z.coerce.number().min(1).optional().default(1),
     limit: z.coerce.number().min(1).max(200).optional().default(50)
   });
   ```
2. Extract user from `locals.user` (set by middleware)
3. Validate request parameters
4. Create FlashcardsService if not exists
5. Implement `verifyDeckOwnership()` method
6. Implement `getFlashcardsByDeckId()` with pagination
7. Format response as FlashcardListDTO
8. Add error handling with appropriate status codes

---

## POST /api/decks/:deckId/flashcards

### 1. Endpoint Overview
Creates a single flashcard within a specified deck. The flashcard is marked as manually created (is_ai_generated = false).

### 2. Request Details
- **HTTP Method:** POST
- **URL Pattern:** `/api/decks/:deckId/flashcards`
- **URL Parameters:**
  - Required: `deckId` (UUID format)
- **Request Body:**
  ```json
  {
    "front": "string (1-5000 characters, required)",
    "back": "string (1-5000 characters, required)"
  }
  ```

### 3. Used Types
```typescript
// Input
CreateFlashcardCommand {
  front: string;
  back: string;
}

// Output
FlashcardDTO (full flashcard object)
```

### 4. Response Details
- **Success (201 Created):**
  ```json
  {
    "id": "uuid",
    "deck_id": "uuid",
    "front": "string",
    "back": "string",
    "is_ai_generated": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
  ```
- **Error Responses:**
  - 400: Validation failed
  - 401: Authentication required
  - 403: Access denied
  - 404: Deck not found

### 5. Data Flow
1. Extract deckId from URL params
2. Parse and validate request body
3. Verify user authentication
4. Verify deck ownership
5. Trim front/back text
6. Insert flashcard with is_ai_generated = false
7. Return created flashcard

### 6. Security Considerations
- Authenticate user via JWT token
- Verify deck ownership before insertion
- Sanitize HTML/script tags from front/back content
- Validate text length after trimming

### 7. Error Handling
- Empty front/back after trim → 400 Bad Request
- Text exceeds 5000 chars → 400 Bad Request
- Invalid UUID → 400 Bad Request
- Deck not found → 404 Not Found
- Unauthorized deck access → 403 Forbidden
- Database constraint violation → 500 Internal Server Error

### 8. Performance Considerations
- Use prepared statements for insertion
- Consider rate limiting for manual creation (e.g., 10/minute)

### 9. Implementation Steps
1. Create validation schemas:
   ```typescript
   const paramsSchema = z.object({
     deckId: z.string().uuid()
   });
   const bodySchema = z.object({
     front: z.string().min(1).max(5000).trim(),
     back: z.string().min(1).max(5000).trim()
   });
   ```
2. Validate authentication and parameters
3. Implement deck ownership verification
4. Sanitize input text (remove dangerous HTML/scripts)
5. Create flashcard in database with is_ai_generated = false
6. Return created flashcard as FlashcardDTO

---

## POST /api/flashcards/bulk

### 1. Endpoint Overview
Creates multiple flashcards at once, primarily used for AI-generated flashcards. Supports up to 100 flashcards per request.

### 2. Request Details
- **HTTP Method:** POST
- **URL Pattern:** `/api/flashcards/bulk`
- **Request Body:**
  ```json
  {
    "deck_id": "uuid (required)",
    "flashcards": [
      {
        "front": "string (1-5000 characters)",
        "back": "string (1-5000 characters)",
        "is_ai_generated": true
      }
    ]
  }
  ```

### 3. Used Types
```typescript
// Input
BulkCreateFlashcardsCommand {
  deck_id: string;
  flashcards: {
    front: string;
    back: string;
    is_ai_generated: boolean;
  }[];
}

// Output
BulkCreateFlashcardsResponseDTO {
  created: number;
  flashcards: Pick<Flashcard, "id" | "deck_id" | "front" | "back" | "is_ai_generated" | "created_at">[];
}
```

### 4. Response Details
- **Success (201 Created):**
  ```json
  {
    "created": 5,
    "flashcards": [
      {
        "id": "uuid",
        "deck_id": "uuid",
        "front": "string",
        "back": "string",
        "is_ai_generated": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```
- **Error Responses:**
  - 400: Validation failed or exceeds 100 flashcards limit
  - 401: Authentication required
  - 403: Access denied to deck
  - 404: Deck not found

### 5. Data Flow
1. Parse and validate request body
2. Check flashcards array length (max 100)
3. Verify user authentication
4. Verify deck ownership
5. Validate each flashcard's content
6. Perform batch insert using transaction
7. Return created flashcards summary

### 6. Security Considerations
- Enforce maximum 100 flashcards per request
- Verify deck ownership before bulk insert
- Sanitize all flashcard content
- Use database transaction for atomicity
- Rate limit bulk operations (e.g., 5 per minute)

### 7. Error Handling
- Array exceeds 100 items → 400 Bad Request
- Any flashcard validation fails → 400 Bad Request with details
- Deck not found → 404 Not Found
- Unauthorized deck access → 403 Forbidden
- Transaction failure → 500 Internal Server Error (rollback)

### 8. Performance Considerations
- Use bulk insert instead of individual inserts
- Wrap in database transaction
- Consider queuing for very large operations (future)
- Monitor database connection pool

### 9. Implementation Steps
1. Create validation schema:
   ```typescript
   const bodySchema = z.object({
     deck_id: z.string().uuid(),
     flashcards: z.array(z.object({
       front: z.string().min(1).max(5000).trim(),
       back: z.string().min(1).max(5000).trim(),
       is_ai_generated: z.boolean()
     })).min(1).max(100)
   });
   ```
2. Validate request body and array length
3. Verify deck ownership
4. Sanitize all flashcard content
5. Begin database transaction
6. Perform bulk insert
7. Commit transaction or rollback on error
8. Return BulkCreateFlashcardsResponseDTO

---

## PUT /api/flashcards/:id

### 1. Endpoint Overview
Updates the content of an existing flashcard. Users can only update flashcards in their own decks.

### 2. Request Details
- **HTTP Method:** PUT
- **URL Pattern:** `/api/flashcards/:id`
- **URL Parameters:**
  - Required: `id` (UUID format)
- **Request Body:**
  ```json
  {
    "front": "string (1-5000 characters, required)",
    "back": "string (1-5000 characters, required)"
  }
  ```

### 3. Used Types
```typescript
// Input
UpdateFlashcardCommand {
  front: string;
  back: string;
}

// Output
FlashcardDTO (updated flashcard)
```

### 4. Response Details
- **Success (200 OK):**
  ```json
  {
    "id": "uuid",
    "deck_id": "uuid",
    "front": "string",
    "back": "string",
    "is_ai_generated": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
  ```
- **Error Responses:**
  - 400: Validation failed
  - 401: Authentication required
  - 403: Access denied
  - 404: Flashcard not found

### 5. Data Flow
1. Extract flashcard ID from URL
2. Parse and validate request body
3. Verify user authentication
4. Fetch flashcard with deck info
5. Verify ownership through deck.user_id
6. Update flashcard content
7. Return updated flashcard

### 6. Security Considerations
- Verify flashcard ownership via deck relationship
- Sanitize updated content
- Prevent updating is_ai_generated flag
- Log update operations for audit trail

### 7. Error Handling
- Invalid UUID format → 400 Bad Request
- Empty content after trim → 400 Bad Request
- Flashcard not found → 404 Not Found
- Unauthorized access → 403 Forbidden
- Database error → 500 Internal Server Error

### 8. Performance Considerations
- Use single JOIN query to verify ownership
- Update only changed fields
- Consider optimistic locking for concurrent updates

### 9. Implementation Steps
1. Create validation schemas:
   ```typescript
   const paramsSchema = z.object({
     id: z.string().uuid()
   });
   const bodySchema = z.object({
     front: z.string().min(1).max(5000).trim(),
     back: z.string().min(1).max(5000).trim()
   });
   ```
2. Validate parameters and body
3. Query flashcard with deck ownership check:
   ```sql
   SELECT f.*, d.user_id
   FROM flashcards f
   JOIN decks d ON f.deck_id = d.id
   WHERE f.id = $1
   ```
4. Verify user_id matches authenticated user
5. Update flashcard content
6. Return updated flashcard

---

## DELETE /api/flashcards/:id

### 1. Endpoint Overview
Deletes a flashcard from the database. Users can only delete flashcards from their own decks.

### 2. Request Details
- **HTTP Method:** DELETE
- **URL Pattern:** `/api/flashcards/:id`
- **URL Parameters:**
  - Required: `id` (UUID format)

### 3. Used Types
```typescript
// No request body
// No response body (204 No Content)
```

### 4. Response Details
- **Success (204 No Content):** Empty response
- **Error Responses:**
  - 401: Authentication required
  - 403: Access denied
  - 404: Flashcard not found

### 5. Data Flow
1. Extract flashcard ID from URL
2. Verify user authentication
3. Fetch flashcard with deck ownership info
4. Verify user owns the deck
5. Delete flashcard (cascade deletes study_records)
6. Return 204 No Content

### 6. Security Considerations
- Verify ownership before deletion
- Cascade deletion handles study_records automatically
- Log deletions for audit purposes
- Consider soft delete for data recovery (future)

### 7. Error Handling
- Invalid UUID format → 400 Bad Request
- Flashcard not found → 404 Not Found
- Unauthorized access → 403 Forbidden
- Database constraint violation → 500 Internal Server Error

### 8. Performance Considerations
- Use single query with JOIN for ownership check
- Database handles cascade deletion efficiently
- Consider archiving instead of hard delete

### 9. Implementation Steps
1. Create validation schema:
   ```typescript
   const paramsSchema = z.object({
     id: z.string().uuid()
   });
   ```
2. Validate flashcard ID format
3. Query for ownership verification:
   ```sql
   SELECT f.id, d.user_id
   FROM flashcards f
   JOIN decks d ON f.deck_id = d.id
   WHERE f.id = $1
   ```
4. Verify user_id matches authenticated user
5. Delete flashcard (CASCADE handles study_records)
6. Return 204 No Content

---

## Shared Service Implementation

### FlashcardsService Structure

```typescript
// src/services/flashcards.service.ts
export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  async verifyDeckOwnership(deckId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    return !error && data !== null;
  }

  async verifyFlashcardOwnership(flashcardId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('id, decks!inner(user_id)')
      .eq('id', flashcardId)
      .eq('decks.user_id', userId)
      .single();

    return !error && data !== null;
  }

  async getFlashcardsByDeckId(
    deckId: string,
    page: number,
    limit: number
  ): Promise<FlashcardListDTO> {
    // Implementation with pagination
  }

  async createFlashcard(
    deckId: string,
    command: CreateFlashcardCommand
  ): Promise<FlashcardDTO> {
    // Implementation
  }

  async bulkCreateFlashcards(
    command: BulkCreateFlashcardsCommand
  ): Promise<BulkCreateFlashcardsResponseDTO> {
    // Implementation with transaction
  }

  async updateFlashcard(
    id: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDTO> {
    // Implementation
  }

  async deleteFlashcard(id: string): Promise<void> {
    // Implementation
  }
}
```

---

## Common Validation Schemas

```typescript
// src/schemas/flashcards.schema.ts
import { z } from 'zod';

export const flashcardContentSchema = z.object({
  front: z.string()
    .min(1, 'Front text is required')
    .max(5000, 'Front text exceeds 5000 characters')
    .trim(),
  back: z.string()
    .min(1, 'Back text is required')
    .max(5000, 'Back text exceeds 5000 characters')
    .trim()
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(200).optional().default(50)
});

export const uuidSchema = z.string().uuid('Invalid ID format');
```

---

## Error Response Helper

```typescript
// src/utils/api-response.ts
export function errorResponse(
  message: string,
  status: number,
  details?: unknown
): Response {
  const body: ErrorResponseDTO = {
    error: message,
    ...(details && { details })
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## Testing Considerations

### Unit Tests
- Test validation schemas with valid and invalid inputs
- Test service methods with mocked Supabase client
- Test ownership verification logic

### Integration Tests
- Test complete request/response cycle
- Test pagination boundaries
- Test bulk operations with transaction rollback
- Test authorization scenarios

### Performance Tests
- Load test bulk creation endpoint
- Test pagination with large datasets
- Monitor query performance

---

## Monitoring and Logging

### Key Metrics
- Response times per endpoint
- Error rates by status code
- Bulk operation sizes
- Database query times

### Logging Requirements
- Log all 4xx and 5xx errors with context
- Log bulk operations with flashcard count
- Log ownership verification failures
- Use structured logging for better searchability

---

## Future Enhancements

1. **Soft Delete**: Implement soft delete for data recovery
2. **Versioning**: Track flashcard edit history
3. **Batch Updates**: Allow updating multiple flashcards at once
4. **Search**: Full-text search across flashcards
5. **Import/Export**: Support CSV/JSON import/export
6. **Rate Limiting**: Implement per-user rate limits
7. **Caching**: Cache frequently accessed decks
8. **Webhooks**: Notify external systems of changes