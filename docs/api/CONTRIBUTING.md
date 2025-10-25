# Contributing to 10xCards API

This guide helps developers contribute new API endpoints to the 10xCards project.

## Table of Contents

- [Overview](#overview)
- [Adding a New Endpoint](#adding-a-new-endpoint)
- [Testing Your Endpoint](#testing-your-endpoint)
- [Updating Documentation](#updating-documentation)
- [Best Practices](#best-practices)

---

## Overview

The 10xCards API follows a structured pattern for implementing endpoints. Each endpoint consists of:

1. **Service Layer** (`src/services/`) - Business logic
2. **Validation Schema** (`src/schemas/`) - Request/response validation
3. **API Route** (`src/pages/api/`) - Endpoint handler
4. **Types** (`src/types.ts`) - DTOs and interfaces
5. **Documentation** (`docs/api/openapi.yaml`) - OpenAPI spec

---

## Adding a New Endpoint

### Step 1: Define Types

Add DTOs and command models to `src/types.ts`:

```typescript
/**
 * Command to create a new deck
 * Used in: POST /api/decks
 */
export interface CreateDeckCommand {
  name: string; // 1-255 characters, trimmed
}

/**
 * Response for created deck
 * Used in: POST /api/decks response
 */
export interface CreateDeckResponseDTO {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

### Step 2: Create Validation Schema

Add Zod schema to `src/schemas/<resource>.schema.ts`:

```typescript
import { z } from "zod";

/**
 * Schema for creating a new deck
 * Used in: POST /api/decks
 */
export const createDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name is required")
    .max(255, "Deck name must be less than 255 characters")
    .transform((val) => val.trim()),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
```

### Step 3: Implement Service Layer

Add business logic to `src/services/<resource>.service.ts`:

```typescript
/**
 * Creates a new deck for the authenticated user
 *
 * @param name - Name of the deck (already validated and trimmed)
 * @param userId - UUID of the authenticated user
 * @returns Created deck DTO
 * @throws Error if database operation fails
 */
async createDeck(
  name: string,
  userId: string
): Promise<CreateDeckResponseDTO> {
  const { data, error } = await this.supabase
    .from("decks")
    .insert({
      name,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[DeckService] Error creating deck:", error);
    throw new Error("Failed to create deck");
  }

  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
```

### Step 4: Create API Route

Add endpoint handler to `src/pages/api/<resource>/<action>.ts`:

```typescript
/**
 * POST /api/decks
 *
 * Creates a new deck for the authenticated user
 *
 * @returns 201 Created - CreateDeckResponseDTO
 * @returns 400 Bad Request - Validation error
 * @returns 401 Unauthorized - Missing authentication
 * @returns 500 Internal Server Error - Server error
 */

import type { APIRoute } from "astro";
import { DeckService } from "@/services/deck.service";
import { createDeckSchema } from "@/schemas/deck.schema";
import type { CreateDeckResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication check
    if (!locals.user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = createDeckSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: validation.error.errors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Create deck
    const deckService = new DeckService(locals.supabase);
    const deck = await deckService.createDeck(
      validation.data.name,
      locals.user.id
    );

    // 4. Return success response
    const response: CreateDeckResponseDTO = deck;
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/decks/${deck.id}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/decks] Unexpected error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to create deck",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 5: Update OpenAPI Documentation

Add endpoint to `docs/api/openapi.yaml`:

```yaml
paths:
  /api/decks:
    post:
      tags:
        - Decks
      summary: Create new deck
      description: Creates a new flashcard deck for the authenticated user
      operationId: createDeck
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 255
                  description: Name of the deck
                  example: "JavaScript Basics"
      responses:
        "201":
          description: Deck created successfully
          headers:
            Location:
              schema:
                type: string
              description: URL of the created deck
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Deck"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "500":
          $ref: "#/components/responses/InternalServerError"
```

---

## Testing Your Endpoint

### Manual Testing with Swagger UI

1. Start the dev server: `npm run dev`
2. Visit: `http://localhost:3000/api-docs`
3. Click "Authorize" and enter your JWT token
4. Find your endpoint and click "Try it out"
5. Enter test data and click "Execute"

### Testing with cURL

```bash
# Get JWT token first (replace with your credentials)
TOKEN="your-jwt-token-here"

# Test the endpoint
curl -X POST "http://localhost:3000/api/decks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Deck"
  }'
```

### Testing with TypeScript

```typescript
// Create a test file: tests/api/decks.test.ts
import { describe, it, expect } from "vitest";

describe("POST /api/decks", () => {
  it("should create a new deck", async () => {
    const response = await fetch("http://localhost:3000/api/decks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Test Deck" }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("Test Deck");
    expect(data.id).toBeTruthy();
  });
});
```

---

## Updating Documentation

After implementing an endpoint, update:

1. **OpenAPI Spec** (`docs/api/openapi.yaml`)
   - Add path definition
   - Add request/response schemas
   - Add examples

2. **API README** (`docs/api/README.md`)
   - Add endpoint to table of contents
   - Add detailed usage section
   - Add code examples

3. **Project README** (`README.md`)
   - Update "Currently Implemented Endpoints" table
   - Update any relevant sections

4. **Copy OpenAPI to public**
   ```bash
   cp docs/api/openapi.yaml public/openapi.yaml
   ```

---

## Best Practices

### 1. Authentication

Always check authentication at the start of the endpoint:

```typescript
if (!locals.user) {
  return new Response(
    JSON.stringify({ error: "Authentication required" }),
    { status: 401 }
  );
}
```

### 2. Validation

Use Zod for all input validation:

```typescript
const validation = schema.safeParse(input);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: validation.error.errors,
    }),
    { status: 400 }
  );
}
```

### 3. Error Handling

Always use try-catch and provide user-friendly errors:

```typescript
try {
  // Your logic
} catch (error) {
  console.error("[Endpoint] Error:", error);
  return new Response(
    JSON.stringify({ error: "Operation failed" }),
    { status: 500 }
  );
}
```

### 4. Response Headers

Set appropriate headers:

```typescript
return new Response(JSON.stringify(data), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "private, max-age=300", // If cacheable
  },
});
```

### 5. Type Safety

Always use proper types:

```typescript
// ✅ Good
const response: DeckDTO = deck;

// ❌ Bad
const response = deck as any;
```

### 6. Documentation

Document all functions with JSDoc:

```typescript
/**
 * Brief description
 *
 * @param paramName - Description
 * @returns Description
 * @throws Error description
 */
```

### 7. Security

- Never expose internal error details to clients
- Always validate UUIDs
- Use RLS policies in Supabase
- Log security-relevant events
- Don't leak information about resource existence to unauthorized users

### 8. Performance

- Use single queries instead of N+1
- Add appropriate indexes to database
- Cache responses when possible
- Use pagination for large result sets

---

## File Structure Reference

```
10x-cards/
├── src/
│   ├── pages/
│   │   └── api/
│   │       └── decks/
│   │           ├── [id].ts          # GET /api/decks/:id
│   │           └── index.ts         # GET /api/decks, POST /api/decks
│   ├── services/
│   │   └── deck.service.ts          # Business logic
│   ├── schemas/
│   │   └── deck.schema.ts           # Validation schemas
│   └── types.ts                     # DTOs and types
├── docs/
│   └── api/
│       ├── openapi.yaml             # OpenAPI specification
│       ├── README.md                # API documentation
│       └── CONTRIBUTING.md          # This file
└── public/
    └── openapi.yaml                 # Copy for Swagger UI
```

---

## Questions?

If you have questions about implementing endpoints:

1. Check existing endpoints (e.g., `GET /api/decks/:id`) as reference
2. Review the OpenAPI specification
3. Read the CLAUDE.md file for architecture guidelines
4. Open a GitHub issue for clarification

---

## Checklist for New Endpoints

Before submitting a PR with a new endpoint, ensure:

- [ ] Types defined in `src/types.ts`
- [ ] Validation schema in `src/schemas/<resource>.schema.ts`
- [ ] Service method in `src/services/<resource>.service.ts`
- [ ] API route in `src/pages/api/<path>.ts`
- [ ] OpenAPI spec updated in `docs/api/openapi.yaml`
- [ ] OpenAPI copied to `public/openapi.yaml`
- [ ] README updated with examples
- [ ] Authentication implemented
- [ ] All error cases handled
- [ ] JSDoc comments added
- [ ] Manual testing completed
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
