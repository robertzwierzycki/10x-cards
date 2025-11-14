import { http, HttpResponse } from "msw";

/**
 * MSW Request Handlers for API mocking
 * These handlers intercept API requests during testing
 */

// Base URL for API endpoints
const API_BASE = "/api";

export const handlers = [
  // Example: Mock OpenRouter AI generation endpoint
  http.post(`${API_BASE}/ai/generate`, async ({ request }) => {
    const body = await request.json();

    // Simulate AI response
    return HttpResponse.json(
      {
        flashcards: [
          {
            front: "Mock Question 1",
            back: "Mock Answer 1",
          },
          {
            front: "Mock Question 2",
            back: "Mock Answer 2",
          },
        ],
      },
      { status: 200 }
    );
  }),

  // Example: Mock rate limit error
  http.post(`${API_BASE}/ai/generate-rate-limited`, () => {
    return HttpResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: 60,
      },
      { status: 429 }
    );
  }),

  // Example: Mock Supabase deck creation
  http.post(`${API_BASE}/decks`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        id: "mock-deck-id",
        name: (body as any).name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Example: Mock deck listing
  http.get(`${API_BASE}/decks`, () => {
    return HttpResponse.json(
      {
        decks: [
          {
            id: "1",
            name: "Test Deck 1",
            card_count: 10,
            cards_due: 5,
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Test Deck 2",
            card_count: 20,
            cards_due: 0,
            created_at: new Date().toISOString(),
          },
        ],
      },
      { status: 200 }
    );
  }),

  // Add more handlers as needed for your API endpoints
];
