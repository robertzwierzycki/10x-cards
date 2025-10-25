# API Endpoint Implementation Plan: /api/metrics

## 1. Endpoint Overview

The metrics API provides two endpoints for tracking key success metrics (KSMs) of the AI flashcard generation feature:
- **AI Adoption Metrics** (`/api/metrics/ai-adoption`): Measures the percentage of active flashcards that are AI-generated
- **AI Acceptance Metrics** (`/api/metrics/ai-acceptance`): Measures the percentage of AI-generated flashcard suggestions that users accept

Both endpoints require authentication and return calculated metrics with target comparisons.

## 2. Request Details

### GET /api/metrics/ai-adoption
- **HTTP Method**: GET
- **URL Pattern**: `/api/metrics/ai-adoption`
- **Parameters**: None
- **Request Body**: None
- **Authentication**: Required (JWT Bearer Token)

### GET /api/metrics/ai-acceptance
- **HTTP Method**: GET
- **URL Pattern**: `/api/metrics/ai-acceptance`
- **Parameters**:
  - **Optional**: `period` (query parameter)
    - Values: "day", "week", "month", "all"
    - Default: "all"
- **Request Body**: None
- **Authentication**: Required (JWT Bearer Token)

## 3. Required Types

```typescript
// Already defined in types.ts
interface AIAdoptionMetricsDTO {
  total_active_flashcards: number;
  ai_generated_active_flashcards: number;
  adoption_rate: number;
  meets_target: boolean;
  target_rate: number;
}

interface AIAcceptanceMetricsDTO {
  period: MetricsPeriod;
  total_suggested: number;
  total_accepted: number;
  total_rejected: number;
  acceptance_rate: number;
  meets_target: boolean;
  target_rate: number;
}

type MetricsPeriod = "day" | "week" | "month" | "all";

// Validation schemas (to be created)
const aiAcceptanceQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "all"]).optional().default("all")
});
```

## 4. Response Details

### AI Adoption Response (200 OK)
```json
{
  "total_active_flashcards": 1000,
  "ai_generated_active_flashcards": 750,
  "adoption_rate": 0.75,
  "meets_target": true,
  "target_rate": 0.75
}
```

### AI Acceptance Response (200 OK)
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

### Error Responses
- **401 Unauthorized**: `{ "error": "Authentication required" }`
- **400 Bad Request**: `{ "error": "Invalid period parameter" }`
- **500 Internal Server Error**: `{ "error": "Failed to calculate metrics" }`

## 5. Data Flow

### AI Adoption Metrics Flow:
1. Authenticate user via middleware
2. Query database for total active flashcards (flashcards with recent study_records)
3. Count AI-generated flashcards among active ones
4. Calculate adoption rate (ai_generated / total)
5. Compare against target rate (0.75)
6. Return formatted metrics

### AI Acceptance Metrics Flow:
1. Authenticate user via middleware
2. Validate period parameter
3. Calculate date range based on period
4. Query AI-generated flashcards within period
5. Track acceptance (saved) vs rejection (not saved/deleted)
6. Calculate acceptance rate
7. Compare against target rate (0.75)
8. Return formatted metrics

## 6. Security Considerations

### Authentication:
- Verify JWT token via Supabase Auth middleware
- Extract user context from `context.locals.user`
- Return 401 if authentication fails

### Authorization:
- Metrics are system-wide, not user-specific
- Consider adding admin role check for production
- Log all metric access attempts

### Input Validation:
- Validate `period` parameter using Zod schema
- Sanitize query parameters before database queries
- Use parameterized queries to prevent SQL injection

## 7. Error Handling

### Potential Errors:
1. **Authentication Failure**
   - Status: 401
   - Response: `{ "error": "Authentication required" }`
   - Log: User attempt without valid token

2. **Invalid Period Parameter**
   - Status: 400
   - Response: `{ "error": "Invalid period parameter" }`
   - Log: Invalid parameter value

3. **Database Connection Error**
   - Status: 500
   - Response: `{ "error": "Failed to calculate metrics" }`
   - Log: Database connection details and error

4. **Calculation Error**
   - Status: 500
   - Response: `{ "error": "Failed to calculate metrics" }`
   - Log: Calculation error with stack trace

## 8. Performance Considerations

### Query Optimization:
- Use database indexes on `is_ai_generated` and `last_review_date` fields
- Consider materialized views for frequently accessed metrics
- Implement query result caching (5-minute TTL)

### Caching Strategy:
- Cache metrics results in memory with short TTL
- Invalidate cache on flashcard creation/deletion
- Consider Redis for distributed caching in production

### Response Time:
- Target: < 500ms for metric calculation
- Monitor query performance
- Add database query timeouts (5 seconds)

## 9. Implementation Steps

### Step 1: Create MetricsService
```typescript
// src/services/MetricsService.ts
class MetricsService {
  constructor(private supabase: SupabaseClient) {}

  async calculateAIAdoptionMetrics(): Promise<AIAdoptionMetricsDTO>
  async calculateAIAcceptanceMetrics(period: MetricsPeriod): Promise<AIAcceptanceMetricsDTO>
  private getDateRangeForPeriod(period: MetricsPeriod): { start: Date, end: Date }
}
```

### Step 2: Implement AI Adoption Endpoint
```typescript
// src/pages/api/metrics/ai-adoption.ts
1. Set prerender = false for dynamic route
2. Create GET handler function
3. Verify authentication via context.locals.user
4. Instantiate MetricsService with Supabase client
5. Call calculateAIAdoptionMetrics()
6. Return JSON response with appropriate status
7. Implement error handling with proper status codes
```

### Step 3: Implement AI Acceptance Endpoint
```typescript
// src/pages/api/metrics/ai-acceptance.ts
1. Set prerender = false for dynamic route
2. Create GET handler function
3. Verify authentication via context.locals.user
4. Parse and validate query parameters with Zod
5. Instantiate MetricsService with Supabase client
6. Call calculateAIAcceptanceMetrics(period)
7. Return JSON response with appropriate status
8. Implement error handling with proper status codes
```

### Step 4: Implement Service Methods

#### AI Adoption Calculation:
```sql
-- Count total active flashcards (studied in last 30 days)
SELECT
  COUNT(DISTINCT f.id) as total_active,
  COUNT(DISTINCT CASE WHEN f.is_ai_generated THEN f.id END) as ai_generated_active
FROM flashcards f
INNER JOIN study_records sr ON f.id = sr.flashcard_id
WHERE sr.last_review_date >= NOW() - INTERVAL '30 days'
```

#### AI Acceptance Calculation:
```sql
-- Track AI-generated flashcards and their retention
SELECT
  COUNT(*) FILTER (WHERE is_ai_generated = true) as total_suggested,
  COUNT(*) FILTER (WHERE is_ai_generated = true AND deleted_at IS NULL) as total_accepted
FROM flashcards
WHERE created_at >= :start_date AND created_at <= :end_date
```

### Step 5: Add Configuration
```typescript
// src/config/metrics.ts
export const METRICS_CONFIG = {
  TARGET_ADOPTION_RATE: 0.75,
  TARGET_ACCEPTANCE_RATE: 0.75,
  ACTIVE_FLASHCARD_DAYS: 30,
  CACHE_TTL_SECONDS: 300
};
```

### Step 6: Implement Caching (Optional)
```typescript
// src/lib/cache.ts
1. Create simple in-memory cache with TTL
2. Add cache key generation based on endpoint and parameters
3. Implement cache invalidation strategy
```

### Step 7: Add Logging
```typescript
// Add structured logging for:
1. Authentication attempts
2. Invalid parameters
3. Database query errors
4. Calculation errors
5. Response times
```

### Step 8: Create Database Indexes
```sql
-- Optimize query performance
CREATE INDEX idx_flashcards_ai_generated ON flashcards(is_ai_generated);
CREATE INDEX idx_study_records_review_date ON study_records(last_review_date);
CREATE INDEX idx_flashcards_created_at ON flashcards(created_at);
```