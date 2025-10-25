# API Endpoint Implementation Plan: Study Mode Endpoints

## Overview

This document provides a comprehensive implementation plan for the Study Mode API endpoints. These endpoints handle spaced repetition learning, study sessions, and progress tracking for flashcards.

---

## GET /api/study/session/:deckId

### 1. Endpoint Overview

Initializes a study session for a specific deck and returns cards due for review. Automatically creates study_records for new flashcards and calculates due cards based on the SR algorithm.

### 2. Request Details

- **HTTP Method:** GET
- **URL Pattern:** `/api/study/session/:deckId`
- **Parameters:**
  - **Required:**
    - `deckId` (UUID in URL path) - The deck to study
  - **Optional:**
    - `limit` (query parameter, number) - Maximum cards to return (default: 20, max: 50)
- **Headers:**
  - `Authorization: Bearer <token>` - Supabase JWT token

### 3. Used Types

```typescript
// From src/types.ts
- StudySessionDTO (response)
- StudyCardDTO (nested in response)
- StudySessionQueryParams (request validation)
- StudyState (enum)
```

### 4. Response Details

**Success (200 OK):**
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
- 401 Unauthorized: `{ "error": "Authentication required" }`

### 5. Data Flow

```
1. Validate deckId format and query parameters
2. Verify deck exists and user owns it
3. Fetch all flashcards in the deck
4. For each flashcard without study_record:
   - Create new study_record with initial state
5. Fetch study_records where due_date <= NOW()
6. Join with flashcards to get card content
7. Sort by priority (new cards first, then by due_date)
8. Apply limit to result set
9. Generate session_id (UUID)
10. Return formatted response
```

### 6. Security Considerations

- **Authentication:** Verify JWT token via Supabase middleware
- **Authorization:** Check deck.user_id matches authenticated user
- **Data Isolation:** Use RLS policies to ensure user can only access own data
- **UUID Validation:** Validate deckId is proper UUID format
- **Parameter Sanitization:** Validate limit is positive integer ≤ 50

### 7. Error Handling

| Scenario | Status Code | Response |
|----------|------------|----------|
| Invalid UUID format | 400 | `{ "error": "Invalid deck ID format" }` |
| Deck not found | 404 | `{ "error": "Deck not found" }` |
| User doesn't own deck | 403 | `{ "error": "Access denied" }` |
| Invalid limit parameter | 400 | `{ "error": "Invalid limit parameter" }` |
| Database connection error | 500 | `{ "error": "Internal server error" }` |
| No authentication token | 401 | `{ "error": "Authentication required" }` |

### 8. Performance Considerations

- **Indexing:** Ensure composite index on (user_id, due_date) in study_records
- **Query Optimization:** Use single query with JOINs instead of multiple queries
- **Caching:** Consider caching deck metadata (name) in Redis
- **Batch Initialization:** Create multiple study_records in single INSERT
- **Connection Pooling:** Use Supabase connection pool

### 9. Implementation Steps

1. Create validation schema using Zod:
   ```typescript
   const paramsSchema = z.object({
     deckId: z.string().uuid()
   });
   const querySchema = z.object({
     limit: z.number().min(1).max(50).optional().default(20)
   });
   ```

2. Implement route handler in `src/pages/api/study/session/[deckId].ts`

3. Create StudyService class in `src/services/study.service.ts`:
   - `initializeStudyRecords(userId, flashcardIds)`
   - `getDueCards(userId, deckId, limit)`
   - `generateSessionId()`

4. Implement database queries:
   - Verify deck ownership
   - Batch insert study_records for new cards
   - Fetch due cards with flashcard content

5. Format response according to StudySessionDTO

6. Add comprehensive error handling with proper status codes

7. Implement request logging for debugging

---

## POST /api/study/review

### 1. Endpoint Overview

Submits a review rating for a flashcard and updates the study record using the SR algorithm to calculate the next review date and difficulty adjustments.

### 2. Request Details

- **HTTP Method:** POST
- **URL Pattern:** `/api/study/review`
- **Headers:**
  - `Authorization: Bearer <token>` - Supabase JWT token
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "study_record_id": "uuid",
  "flashcard_id": "uuid",
  "rating": "again|good|easy"
}
```

### 3. Used Types

```typescript
// From src/types.ts
- SubmitReviewCommand (request)
- ReviewResponseDTO (response)
- ReviewRating (enum)
- StudyState (enum)
```

### 4. Response Details

**Success (200 OK):**
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

### 5. Data Flow

```
1. Validate request body structure
2. Verify rating is valid enum value
3. Fetch study_record with user_id check
4. Verify flashcard_id matches study_record
5. Apply SR algorithm:
   - Map rating to algorithm input (0, 3, or 5)
   - Calculate new stability, difficulty, and state
   - Compute next_review_date based on stability
6. Update study_record in database
7. Update last_review_date to NOW()
8. Increment lapses if rating is "again"
9. Return updated values
```

### 6. Security Considerations

- **Authentication:** Required via JWT token
- **Authorization:** Verify study_record belongs to authenticated user
- **Data Validation:** Ensure flashcard_id matches the study_record
- **Rating Validation:** Only accept valid rating enum values
- **Idempotency:** Consider making review submissions idempotent

### 7. Error Handling

| Scenario | Status Code | Response |
|----------|------------|----------|
| Missing required fields | 400 | `{ "error": "Validation failed", "details": [...] }` |
| Invalid UUID format | 400 | `{ "error": "Invalid ID format" }` |
| Invalid rating value | 400 | `{ "error": "Invalid rating value" }` |
| Study record not found | 404 | `{ "error": "Study record not found" }` |
| Flashcard ID mismatch | 400 | `{ "error": "Flashcard ID does not match study record" }` |
| User doesn't own record | 403 | `{ "error": "Access denied" }` |
| Database update failed | 500 | `{ "error": "Failed to update study record" }` |

### 8. Performance Considerations

- **Algorithm Efficiency:** Use optimized SR algorithm implementation
- **Database Updates:** Use single UPDATE query with RETURNING clause
- **Transaction Management:** Wrap updates in transaction for consistency
- **Response Time:** Target < 200ms for algorithm calculation

### 9. Implementation Steps

1. Create validation schema:
   ```typescript
   const reviewSchema = z.object({
     study_record_id: z.string().uuid(),
     flashcard_id: z.string().uuid(),
     rating: z.enum(['again', 'good', 'easy'])
   });
   ```

2. Implement route handler in `src/pages/api/study/review.ts`

3. Extend StudyService with SR algorithm:
   - `calculateNextReview(currentState, rating)`
   - `updateStudyRecord(recordId, updates)`
   - Implement FSRS or SM-2 algorithm

4. Create algorithm utilities:
   - Rating to quality mapper (again=0, good=3, easy=5)
   - Stability calculator
   - Difficulty adjuster
   - State transition logic

5. Implement database update with validation

6. Add metrics tracking for algorithm performance

---

## GET /api/study/stats/:deckId

### 1. Endpoint Overview

Returns comprehensive study statistics for a deck, including cards due, difficulty metrics, retention rate, and study streak.

### 2. Request Details

- **HTTP Method:** GET
- **URL Pattern:** `/api/study/stats/:deckId`
- **Parameters:**
  - **Required:**
    - `deckId` (UUID in URL path) - The deck to get stats for
- **Headers:**
  - `Authorization: Bearer <token>` - Supabase JWT token

### 3. Used Types

```typescript
// From src/types.ts
- StudyStatsDTO (response)
```

### 4. Response Details

**Success (200 OK):**
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

### 5. Data Flow

```
1. Validate deckId format
2. Verify deck exists and user owns it
3. Execute parallel queries for efficiency:
   a. Count total flashcards in deck
   b. Count cards with last_review_date = TODAY
   c. Count cards with due_date <= TODAY
   d. Count cards with due_date = TOMORROW
   e. Calculate AVG(difficulty) from study_records
   f. Calculate retention rate from review history
   g. Calculate study streak from review dates
4. Aggregate results
5. Return formatted statistics
```

### 6. Security Considerations

- **Authentication:** Verify JWT token
- **Authorization:** Check deck ownership
- **Data Isolation:** Statistics only from user's own data
- **Query Optimization:** Prevent expensive queries on large datasets

### 7. Error Handling

| Scenario | Status Code | Response |
|----------|------------|----------|
| Invalid UUID format | 400 | `{ "error": "Invalid deck ID format" }` |
| Deck not found | 404 | `{ "error": "Deck not found" }` |
| User doesn't own deck | 403 | `{ "error": "Access denied" }` |
| Database query timeout | 500 | `{ "error": "Query timeout" }` |
| No study records exist | 200 | Return zeros for all metrics |

### 8. Performance Considerations

- **Parallel Queries:** Execute statistics queries in parallel
- **Aggregation:** Use database aggregation functions (COUNT, AVG)
- **Caching:** Cache stats with 5-minute TTL in Redis
- **Indexing:** Ensure indexes on due_date, last_review_date
- **Query Timeout:** Set 5-second timeout on statistics queries

### 9. Implementation Steps

1. Create validation schema:
   ```typescript
   const paramsSchema = z.object({
     deckId: z.string().uuid()
   });
   ```

2. Implement route handler in `src/pages/api/study/stats/[deckId].ts`

3. Extend StudyService with statistics methods:
   - `calculateRetentionRate(userId, deckId)`
   - `calculateStudyStreak(userId)`
   - `getCardsDueCount(userId, deckId, date)`
   - `getStudiedTodayCount(userId, deckId)`

4. Create efficient database queries:
   ```sql
   -- Example: Cards due today
   SELECT COUNT(*) FROM study_records sr
   JOIN flashcards f ON sr.flashcard_id = f.id
   WHERE f.deck_id = $1
   AND sr.user_id = $2
   AND sr.due_date <= CURRENT_DATE
   ```

5. Implement caching layer:
   - Cache key: `stats:${userId}:${deckId}`
   - TTL: 300 seconds
   - Invalidate on review submission

6. Add response formatting according to StudyStatsDTO

7. Implement comprehensive error handling

---

## Common Service Layer: StudyService

### Location
`src/services/study.service.ts`

### Core Methods

```typescript
class StudyService {
  // Session Management
  async initializeStudyRecords(userId: string, flashcardIds: string[]): Promise<void>
  async getDueCards(userId: string, deckId: string, limit: number): Promise<StudyCardDTO[]>

  // SR Algorithm (FSRS or SM-2)
  async processReview(recordId: string, rating: ReviewRating): Promise<ReviewResponseDTO>
  private calculateNextReview(current: StudyRecord, rating: ReviewRating): SRCalculation
  private mapRatingToQuality(rating: ReviewRating): number

  // Statistics
  async getDeckStatistics(userId: string, deckId: string): Promise<StudyStatsDTO>
  async calculateRetentionRate(userId: string, deckId: string): Promise<number>
  async calculateStudyStreak(userId: string): Promise<number>

  // Utilities
  private validateDeckOwnership(userId: string, deckId: string): Promise<boolean>
  private generateSessionId(): string
}
```

### SR Algorithm Implementation Notes

**FSRS (Free Spaced Repetition Scheduler) - Recommended:**
- More accurate than SM-2
- Better handles lapses and relearning
- Adaptive difficulty adjustment

**Key Formulas:**
```typescript
// Stability after review
new_stability = stability * (1 + exp(rating) * (11 - difficulty) * stability^(-decay))

// Next review interval
interval = stability * ln(0.9) / ln(retention_goal)

// Difficulty adjustment
new_difficulty = difficulty + 0.1 * (3 - rating)
```

**State Transitions:**
- new → learning (first review)
- learning → review (good/easy rating after learning)
- review → review (successful reviews)
- any → relearning (failed review)

---

## Database Migrations Required

```sql
-- Add indexes for performance
CREATE INDEX idx_study_records_user_due ON study_records(user_id, due_date);
CREATE INDEX idx_study_records_deck_lookup ON study_records(user_id, flashcard_id);
CREATE INDEX idx_study_records_last_review ON study_records(user_id, last_review_date);

-- Add function for streak calculation
CREATE OR REPLACE FUNCTION calculate_study_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM study_records
    WHERE user_id = p_user_id
    AND DATE(last_review_date) = check_date
  ) LOOP
    streak := streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  RETURN streak;
END;
$$ LANGUAGE plpgsql;
```

---

## Testing Considerations

### Unit Tests
- SR algorithm calculations with various inputs
- Rating to quality mapping
- State transition logic
- Date calculation accuracy

### Integration Tests
- End-to-end study session flow
- Review submission and recalculation
- Statistics accuracy
- Concurrent review handling

### Performance Tests
- Large deck initialization (1000+ cards)
- Statistics calculation on heavy usage
- Concurrent session access

---

## Monitoring and Metrics

### Key Metrics to Track
- Average response time per endpoint
- SR algorithm calculation time
- Database query performance
- Cache hit rate for statistics
- Error rate by type

### Logging Requirements
- Log all review submissions with ratings
- Track session initialization times
- Monitor failed authentication attempts
- Log slow queries (> 1 second)

---

## Future Enhancements

1. **Batch Review Processing:** Submit multiple reviews at once
2. **Study Session Caching:** Cache active sessions in Redis
3. **Smart Scheduling:** AI-powered optimal review time suggestions
4. **Study Reminders:** Push notifications for due cards
5. **Detailed Analytics:** Learning curves, forgetting curves, optimal study times
6. **Multi-device Sync:** Real-time synchronization across devices
7. **Offline Mode:** Local storage with sync on reconnect