/**
 * Mock data factories for tests
 * These functions generate consistent test data
 */

export const mockDeck = (overrides = {}) => ({
  id: "mock-deck-1",
  name: "Test Deck",
  user_id: "mock-user-1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  card_count: 0,
  cards_due: 0,
  ...overrides,
});

export const mockFlashcard = (overrides = {}) => ({
  id: "mock-card-1",
  deck_id: "mock-deck-1",
  front: "What is TypeScript?",
  back: "TypeScript is a typed superset of JavaScript.",
  is_ai_generated: false,
  next_review_date: new Date().toISOString(),
  ease_factor: 2.5,
  interval_days: 1,
  repetitions: 0,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: "mock-user-1",
  email: "test@example.com",
  username: "testuser",
  created_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

export const mockAIResponse = (overrides = {}) => ({
  flashcards: [
    {
      front: "AI Generated Question 1",
      back: "AI Generated Answer 1",
    },
    {
      front: "AI Generated Question 2",
      back: "AI Generated Answer 2",
    },
  ],
  ...overrides,
});
