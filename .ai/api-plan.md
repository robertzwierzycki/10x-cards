# REST API Plan

## 1. Resources

- **Profiles** → `public.profiles` table
- **Decks** → `public.decks` table
- **Flashcards** → `public.flashcards` table
- **Study Records** → `public.study_records` table
- **AI Generation** → External service (OpenRouter/GPT-4o-mini)
- **Study Sessions** → Computed from `study_records` and SR algorithm

## 2. Endpoints

### Authentication
*Handled directly by Supabase Auth SDK on client-side. No custom endpoints required.*

### Decks Resource

#### GET /api/decks
**Description:** Retrieve all decks for the authenticated user
**Query Parameters:**
- `page` (optional, number, default: 1)
- `limit` (optional, number, default: 20, max: 100)
- `sort` (optional, string, values: "name", "created_at", "updated_at", default: "updated_at")
- `order` (optional, string, values: "asc", "desc", default: "desc")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "flashcard_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**Error Responses:**
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 500 Internal Server Error: `{ "error": "Failed to retrieve decks" }`

#### POST /api/decks
**Description:** Create a new deck
**Request Body:**
```json
{
  "name": "string (1-255 characters, required)"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "string",
  "flashcard_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 409 Conflict: `{ "error": "Deck with this name already exists" }`
- 401 Unauthorized: `{ "error": "Authentication required" }`

#### GET /api/decks/:id
**Description:** Retrieve a specific deck with its flashcards

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "is_ai_generated": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Error Responses:**
- 404 Not Found: `{ "error": "Deck not found" }`
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### PUT /api/decks/:id
**Description:** Update a deck's name
**Request Body:**
```json
{
  "name": "string (1-255 characters, required)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "flashcard_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 404 Not Found: `{ "error": "Deck not found" }`
- 409 Conflict: `{ "error": "Deck with this name already exists" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### DELETE /api/decks/:id
**Description:** Delete a deck and all its flashcards

**Response (204 No Content):** Empty response

**Error Responses:**
- 404 Not Found: `{ "error": "Deck not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

### Flashcards Resource

#### GET /api/decks/:deckId/flashcards
**Description:** Retrieve all flashcards in a deck
**Query Parameters:**
- `page` (optional, number, default: 1)
- `limit` (optional, number, default: 50, max: 200)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
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

**Error Responses:**
- 404 Not Found: `{ "error": "Deck not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### POST /api/decks/:deckId/flashcards
**Description:** Create a single flashcard
**Request Body:**
```json
{
  "front": "string (1-5000 characters, required)",
  "back": "string (1-5000 characters, required)"
}
```

**Response (201 Created):**
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

**Error Responses:**
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 404 Not Found: `{ "error": "Deck not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### POST /api/flashcards/bulk
**Description:** Create multiple flashcards at once (for AI generation)
**Request Body:**
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

**Response (201 Created):**
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

**Error Responses:**
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 404 Not Found: `{ "error": "Deck not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### PUT /api/flashcards/:id
**Description:** Update a flashcard
**Request Body:**
```json
{
  "front": "string (1-5000 characters, required)",
  "back": "string (1-5000 characters, required)"
}
```

**Response (200 OK):**
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

**Error Responses:**
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 404 Not Found: `{ "error": "Flashcard not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### DELETE /api/flashcards/:id
**Description:** Delete a flashcard

**Response (204 No Content):** Empty response

**Error Responses:**
- 404 Not Found: `{ "error": "Flashcard not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

### AI Generation

#### POST /api/ai/generate
**Description:** Generate flashcard suggestions from text
**Request Body:**
```json
{
  "text": "string (1-1000 characters, required)"
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "front": "string",
      "back": "string"
    }
  ],
  "count": 5,
  "truncated": false
}
```

**Error Responses:**
- 400 Bad Request: `{ "error": "Text exceeds 1000 character limit" }`
- 429 Too Many Requests: `{ "error": "Rate limit exceeded", "retry_after": 60 }`
- 500 Internal Server Error: `{ "error": "AI service unavailable" }`
- 503 Service Unavailable: `{ "error": "Failed to generate flashcards" }`

### Study Mode

#### GET /api/study/session/:deckId
**Description:** Start a study session and get cards due for review
**Query Parameters:**
- `limit` (optional, number, default: 20, max: 50)

**Response (200 OK):**
```json
{
  "session_id": "uuid",
  "deck_id": "uuid",
  "deck_name": "string",
  "cards_due": [
    {
      "flashcard_id": "uuid",
      "front": "string",
      "back": "string",
      "study_record_id": "uuid",
      "state": "new|learning|review|relearning"
    }
  ],
  "total_due": 10,
  "session_started_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- 404 Not Found: `{ "error": "Deck not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### POST /api/study/review
**Description:** Submit review rating for a flashcard
**Request Body:**
```json
{
  "study_record_id": "uuid",
  "flashcard_id": "uuid",
  "rating": "again|good|easy"
}
```

**Response (200 OK):**
```json
{
  "study_record_id": "uuid",
  "next_review_date": "2024-01-02T00:00:00Z",
  "stability": 2.5,
  "difficulty": 5.0,
  "state": "learning"
}
```

**Error Responses:**
- 400 Bad Request: `{ "error": "Invalid rating value" }`
- 404 Not Found: `{ "error": "Study record not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

#### GET /api/study/stats/:deckId
**Description:** Get study statistics for a deck

**Response (200 OK):**
```json
{
  "deck_id": "uuid",
  "total_cards": 50,
  "cards_studied_today": 15,
  "cards_due_today": 5,
  "cards_due_tomorrow": 8,
  "average_difficulty": 5.2,
  "retention_rate": 0.85,
  "streak_days": 7
}
```

**Error Responses:**
- 404 Not Found: `{ "error": "Deck not found" }`
- 403 Forbidden: `{ "error": "Access denied" }`

### Metrics Resource

#### GET /api/metrics/ai-adoption
**Description:** Get AI adoption metrics for KSM 2 tracking (percentage of active flashcards that are AI-generated)
**Response (200 OK):**
```json
{
  "total_active_flashcards": 1000,
  "ai_generated_active_flashcards": 750,
  "adoption_rate": 0.75,
  "meets_target": true,
  "target_rate": 0.75
}
```

**Error Responses:**
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 500 Internal Server Error: `{ "error": "Failed to calculate metrics" }`

#### GET /api/metrics/ai-acceptance
**Description:** Get AI acceptance rate for KSM 1 tracking (percentage of generated flashcards accepted by users)
**Query Parameters:**
- `period` (optional, string, values: "day", "week", "month", "all", default: "all")

**Response (200 OK):**
```json
{
  "period": "all",
  "total_suggested": 1000,
  "total_accepted": 800,
  "total_rejected": 200,
  "acceptance_rate": 0.80,
  "meets_target": true,
  "target_rate": 0.75
}
```

**Error Responses:**
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 400 Bad Request: `{ "error": "Invalid period parameter" }`

### Profile Resource

#### GET /api/profile
**Description:** Get current user's profile
**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string|null",
  "email": "string",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 404 Not Found: `{ "error": "Profile not found" }`

#### PUT /api/profile
**Description:** Update current user's profile
**Request Body:**
```json
{
  "username": "string (3-50 characters, alphanumeric + underscore, optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 409 Conflict: `{ "error": "Username already taken" }`
- 401 Unauthorized: `{ "error": "Authentication required" }`

### System Resource

#### GET /api/health
**Description:** Health check endpoint for monitoring and load balancers
**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "ai_service": "available"
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "disconnected",
    "ai_service": "available"
  }
}
```

## 3. Authentication and Authorization

### Authentication Mechanism
- **Type:** JWT Bearer Token (managed by Supabase Auth)
- **Header:** `Authorization: Bearer <token>`
- **Token Source:** Supabase Auth SDK handles token generation and refresh
- **Implementation:**
  - All API endpoints (except health checks) require valid JWT token
  - Tokens are verified using Supabase middleware in `src/middleware/index.ts`
  - User ID is extracted from token and available in `context.locals.user`

### Authorization Rules
- Users can only access their own resources
- Deck ownership verified through `user_id` field
- Flashcard access verified through deck ownership chain
- Study records scoped to authenticated user
- Enforced by Supabase Row Level Security (RLS) policies

## 4. Validation and Business Logic

### Input Validation

#### Deck Validation
- `name`: Required, 1-255 characters
- Uniqueness: Name must be unique per user
- Trimming: Leading/trailing whitespace removed

#### Flashcard Validation
- `front`: Required, 1-5000 characters, non-empty after trimming
- `back`: Required, 1-5000 characters, non-empty after trimming
- `is_ai_generated`: Boolean, defaults to false for manual creation

#### AI Generation Validation
- `text`: Required, 1-1000 characters
- Auto-truncation: Text exceeding 1000 chars is truncated with warning
- Character counting: Performed before submission

#### Study Review Validation
- `rating`: Must be one of: "again", "good", "easy"
- `study_record_id`: Must belong to authenticated user
- `flashcard_id`: Must match the study record

### Business Logic Implementation

#### AI Generation Logic
1. Text truncated to 1000 characters if exceeded
2. Request sent to OpenRouter API with system prompt
3. Response parsed to extract flashcard pairs
4. Empty or malformed responses handled gracefully
5. P95 response time monitored (must be < 5 seconds)

#### Spaced Repetition Algorithm
1. Uses open-source SR algorithm (FSRS or SM-2)
2. Rating mapped to algorithm input:
   - "again" → Failed/Forgot (0)
   - "good" → Recalled (3)
   - "easy" → Perfect (5)
3. Algorithm calculates:
   - Next review date (`due_date`)
   - Card stability
   - Difficulty adjustment
   - Learning state transition

#### Cascade Deletion Rules
- Deleting deck → Deletes all flashcards and study records
- Deleting user → Deletes profile, decks, flashcards, and study records
- Implemented via database CASCADE constraints

#### Rate Limiting
- AI generation: 10 requests per minute per user
- Bulk operations: 100 flashcards per request maximum
- General API: 1000 requests per hour per user

### Error Handling Strategy
- Validation errors return 400 with detailed field errors
- Not found resources return 404 with descriptive message
- Authorization failures return 403 (not 404) to prevent enumeration
- Server errors logged internally, return 500 with generic message
- AI service failures return 503 with retry guidance

## 5. Additional Specifications

### CORS Configuration
- **Allowed Origins:** Configured via environment variable (development: http://localhost:3000)
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization
- **Exposed Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Credentials:** true (required for Supabase Auth cookies)

### Date and Time Format
- **Format:** ISO 8601 with timezone (RFC 3339)
- **Example:** `2024-01-01T00:00:00Z`
- **Timezone:** All dates stored and returned in UTC
- **Client Responsibility:** Convert to local timezone for display

### Request/Response Limits
- **Maximum Request Body Size:** 1MB (general), 10MB (bulk operations)
- **Maximum URL Length:** 2048 characters
- **Maximum Flashcards per Bulk Request:** 100
- **Maximum Page Size:** 100 (decks), 200 (flashcards)
- **Response Timeout:** 30 seconds (general), 60 seconds (AI generation)

### API Versioning Strategy
- **Current Version:** v1 (implied, not in URL for MVP)
- **Future Strategy:** Version in URL path (`/api/v2/`) for breaking changes
- **Deprecation Policy:** 6-month notice before removing old versions

### Study Records Initialization
- **Automatic Creation:** When a flashcard is first accessed in study mode
- **Initial State:** `state: "new"`, `due_date: NOW()`, `difficulty: 5.0`, `stability: null`
- **Batch Initialization:** When starting study session for deck with uninitialized cards