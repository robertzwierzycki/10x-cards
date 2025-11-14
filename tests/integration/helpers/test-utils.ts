/**
 * Integration Test Utilities
 *
 * Provides helper functions for integration tests:
 * - Mock Supabase client creation
 * - Mock user authentication
 * - Test data generators
 * - Response validation helpers
 */

import { createClient } from "@supabase/supabase-js";
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

  const client = createClient(supabaseUrl, supabaseKey);

  // Mock auth methods
  (client.auth.getUser as any) = async () => ({
    data: { user },
    error: null,
  });

  (client.auth.getSession as any) = async () => ({
    data: { session: { user, access_token: "mock-token" } },
    error: null,
  });

  return client;
}

/**
 * Create a mock Supabase client without authenticated user
 */
export function createUnauthenticatedSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
  const supabaseKey = process.env.SUPABASE_KEY || "mock-key";

  const client = createClient(supabaseUrl, supabaseKey);

  // Mock auth methods to return no user
  (client.auth.getUser as any) = async () => ({
    data: { user: null },
    error: { message: "Not authenticated" },
  });

  (client.auth.getSession as any) = async () => ({
    data: { session: null },
    error: { message: "Not authenticated" },
  });

  return client;
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
