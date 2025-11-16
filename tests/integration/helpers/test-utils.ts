/**
 * Integration Test Utilities
 *
 * Provides helper functions for integration tests:
 * - Mock Supabase client creation
 * - Mock user authentication
 * - Test data generators
 * - Response validation helpers
 */

import { expect, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

/**
 * Mock user data for testing
 */
export const mockUser: User = {
  id: "test-user-id-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

/**
 * Mock another user for testing access control
 */
export const mockOtherUser: User = {
  id: "other-user-id-456",
  email: "other@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

/**
 * Create a mock Supabase client with authenticated user
 */
export function createMockSupabaseClient(user: User = mockUser) {
  const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
  const supabaseKey = process.env.SUPABASE_KEY || "mock-key";

  // Create a fully mocked Supabase client with proper chainable methods
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user, access_token: "mock-token" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      // Store query state for building response
      const queryState: any = {
        table,
        filters: [],
        ordering: null,
        rangeStart: null,
        rangeEnd: null,
        shouldCount: false,
      };

      // Return chainable query builder
      const queryBuilder: any = {
        select: vi.fn((columns?: string) => {
          queryState.columns = columns;

          // Check if count is requested
          if (columns === "*" && queryBuilder.count) {
            queryState.shouldCount = true;
          }

          return queryBuilder;
        }),
        insert: vi.fn((data) => {
          queryState.action = "insert";
          queryState.data = data;
          return queryBuilder;
        }),
        update: vi.fn((data) => {
          queryState.action = "update";
          queryState.data = data;
          return queryBuilder;
        }),
        upsert: vi.fn((data) => {
          queryState.action = "upsert";
          queryState.data = data;
          return queryBuilder;
        }),
        delete: vi.fn(() => {
          queryState.action = "delete";
          return queryBuilder;
        }),
        eq: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "eq", value });
          return queryBuilder;
        }),
        neq: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "neq", value });
          return queryBuilder;
        }),
        gt: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "gt", value });
          return queryBuilder;
        }),
        gte: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "gte", value });
          return queryBuilder;
        }),
        lt: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "lt", value });
          return queryBuilder;
        }),
        lte: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "lte", value });
          return queryBuilder;
        }),
        like: vi.fn((column, pattern) => {
          queryState.filters.push({ column, op: "like", pattern });
          return queryBuilder;
        }),
        ilike: vi.fn((column, pattern) => {
          queryState.filters.push({ column, op: "ilike", pattern });
          return queryBuilder;
        }),
        is: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "is", value });
          return queryBuilder;
        }),
        in: vi.fn((column, values) => {
          queryState.filters.push({ column, op: "in", values });
          return queryBuilder;
        }),
        contains: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "contains", value });
          return queryBuilder;
        }),
        containedBy: vi.fn((column, value) => {
          queryState.filters.push({ column, op: "containedBy", value });
          return queryBuilder;
        }),
        range: vi.fn((start, end) => {
          queryState.rangeStart = start;
          queryState.rangeEnd = end;
          return queryBuilder;
        }),
        order: vi.fn((column, options = {}) => {
          queryState.ordering = { column, ...options };
          return queryBuilder;
        }),
        limit: vi.fn((count) => {
          queryState.limit = count;
          return queryBuilder;
        }),
        single: vi.fn(() => {
          queryState.single = true;
          return queryBuilder;
        }),
        maybeSingle: vi.fn(() => {
          queryState.maybeSingle = true;
          return queryBuilder;
        }),
        count: vi.fn((algorithm = "exact") => {
          queryState.shouldCount = true;
          queryState.countAlgorithm = algorithm;
          return queryBuilder;
        }),
        // Promise-like methods for execution
        then: vi.fn((resolve) => {
          // Return appropriate mock data based on queryState
          const result: any = { data: null, error: null, count: null };

          // Handle different actions
          if (queryState.action === "insert") {
            // Return inserted data with generated ID if not present
            const insertedData = Array.isArray(queryState.data)
              ? queryState.data.map((d: any) => ({ ...d, id: d.id || generateUUID() }))
              : { ...queryState.data, id: queryState.data.id || generateUUID() };
            result.data = queryState.single ? insertedData : [insertedData];
          } else if (queryState.action === "update") {
            // Return updated data
            result.data = queryState.single ? queryState.data : [queryState.data];
          } else if (queryState.action === "delete") {
            // Return empty data for delete
            result.data = null;
          } else {
            // Default select query - return empty array
            result.data = [];
          }

          // For count queries on empty results
          if (queryState.shouldCount) {
            result.count = Array.isArray(result.data) ? result.data.length : 0;
          }

          resolve(result);
        }),
      };

      return queryBuilder;
    }),
  };

  return client as any;
}

/**
 * Create a mock Supabase client without authenticated user
 */
export function createUnauthenticatedSupabaseClient() {
  // Create a fully mocked Supabase client without auth
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: "Not authenticated" },
      }),
    },
    from: vi.fn((table: string) => {
      // Return chainable query builder mock that returns errors
      const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        // Final execution methods that return auth errors
        then: vi.fn((resolve) =>
          resolve({
            data: null,
            error: { message: "Not authenticated", code: "401" },
          })
        ),
      };

      // Make it return itself for chaining
      Object.keys(queryBuilder).forEach((key) => {
        if (key !== "then") {
          queryBuilder[key].mockReturnValue(queryBuilder);
        }
      });

      return queryBuilder;
    }),
  };

  return client as any;
}

/**
 * Generate mock deck data
 */
export function generateMockDeck(overrides = {}) {
  return {
    id: `deck-${Date.now()}`,
    name: `Test Deck ${Date.now()}`,
    user_id: mockUser.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock flashcard data
 */
export function generateMockFlashcard(deckId: string, overrides = {}) {
  return {
    id: `flashcard-${Date.now()}`,
    deck_id: deckId,
    front: "Test Question",
    back: "Test Answer",
    is_ai_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Validate error response structure
 */
export function validateErrorResponse(response: any, expectedStatus: number, expectedError?: string) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get("content-type")).toContain("application/json");

  if (expectedError) {
    expect(response.data).toHaveProperty("error");
    expect(response.data.error).toBe(expectedError);
  }
}

/**
 * Validate success response structure
 */
export function validateSuccessResponse(response: any, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get("content-type")).toContain("application/json");
}

/**
 * Create mock Request object for API testing
 */
export function createMockRequest(options: {
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
}): Request {
  const { method, url, body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

/**
 * Mock API context with Supabase client
 */
export function createMockAPIContext(user: User = mockUser) {
  const supabase = createMockSupabaseClient(user);

  return {
    locals: {
      supabase,
      user,
    },
    params: {},
    url: new URL("http://localhost:3000"),
  };
}

/**
 * Wait for async operations (useful for testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random UUID for testing
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
