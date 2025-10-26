import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Example Integration Test with MSW
 * Tests API integration by mocking HTTP requests
 */

describe('API Integration', () => {
  it('should fetch decks successfully', async () => {
    const response = await fetch('/api/decks');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.decks).toHaveLength(2);
    expect(data.decks[0].name).toBe('Test Deck 1');
  });

  it('should create a new deck', async () => {
    const newDeck = { name: 'My New Deck' };

    const response = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeck),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('My New Deck');
    expect(data.id).toBeDefined();
  });

  it('should handle AI generation', async () => {
    const inputText = 'Test input for AI generation';

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.flashcards).toHaveLength(2);
    expect(data.flashcards[0]).toHaveProperty('front');
    expect(data.flashcards[0]).toHaveProperty('back');
  });

  it('should handle rate limiting', async () => {
    const response = await fetch('/api/ai/generate-rate-limited', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    });

    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded');
    expect(data.retryAfter).toBe(60);
  });

  describe('Custom error handling', () => {
    beforeEach(() => {
      // Override handler for this test suite
      server.use(
        http.post('/api/ai/generate', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );
    });

    it('should handle server errors', async () => {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' }),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
