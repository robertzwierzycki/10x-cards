/**
 * Unit tests for Deck Utility Functions
 *
 * Tests cover:
 * - formatFlashcardCount() - Polish plural forms for flashcard counts
 * - mapToDeckCardViewModel() - DeckDTO to DeckCardViewModel mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatFlashcardCount, mapToDeckCardViewModel } from './deck-utils';
import type { DeckDTO } from '@/types';

describe('formatFlashcardCount', () => {
  describe('Zero and singular', () => {
    it('should format 0 flashcards', () => {
      expect(formatFlashcardCount(0)).toBe('0 fiszek');
    });

    it('should format 1 flashcard with singular form', () => {
      expect(formatFlashcardCount(1)).toBe('1 fiszka');
    });
  });

  describe('Polish plural forms - "fiszki" (2-4, except 12-14)', () => {
    it('should format 2 with "fiszki"', () => {
      expect(formatFlashcardCount(2)).toBe('2 fiszki');
    });

    it('should format 3 with "fiszki"', () => {
      expect(formatFlashcardCount(3)).toBe('3 fiszki');
    });

    it('should format 4 with "fiszki"', () => {
      expect(formatFlashcardCount(4)).toBe('4 fiszki');
    });

    it('should format 22 with "fiszki"', () => {
      expect(formatFlashcardCount(22)).toBe('22 fiszki');
    });

    it('should format 23 with "fiszki"', () => {
      expect(formatFlashcardCount(23)).toBe('23 fiszki');
    });

    it('should format 24 with "fiszki"', () => {
      expect(formatFlashcardCount(24)).toBe('24 fiszki');
    });

    it('should format 102 with "fiszki"', () => {
      expect(formatFlashcardCount(102)).toBe('102 fiszki');
    });

    it('should format 103 with "fiszki"', () => {
      expect(formatFlashcardCount(103)).toBe('103 fiszki');
    });

    it('should format 104 with "fiszki"', () => {
      expect(formatFlashcardCount(104)).toBe('104 fiszki');
    });
  });

  describe('Polish plural forms - "fiszek" (5-21, 25-31, etc.)', () => {
    it('should format 5 with "fiszek"', () => {
      expect(formatFlashcardCount(5)).toBe('5 fiszek');
    });

    it('should format 10 with "fiszek"', () => {
      expect(formatFlashcardCount(10)).toBe('10 fiszek');
    });

    it('should format 11 with "fiszek"', () => {
      expect(formatFlashcardCount(11)).toBe('11 fiszek');
    });

    it('should format 12 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(12)).toBe('12 fiszek');
    });

    it('should format 13 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(13)).toBe('13 fiszek');
    });

    it('should format 14 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(14)).toBe('14 fiszek');
    });

    it('should format 15 with "fiszek"', () => {
      expect(formatFlashcardCount(15)).toBe('15 fiszek');
    });

    it('should format 20 with "fiszek"', () => {
      expect(formatFlashcardCount(20)).toBe('20 fiszek');
    });

    it('should format 21 with "fiszek"', () => {
      expect(formatFlashcardCount(21)).toBe('21 fiszek');
    });

    it('should format 25 with "fiszek"', () => {
      expect(formatFlashcardCount(25)).toBe('25 fiszek');
    });

    it('should format 50 with "fiszek"', () => {
      expect(formatFlashcardCount(50)).toBe('50 fiszek');
    });

    it('should format 100 with "fiszek"', () => {
      expect(formatFlashcardCount(100)).toBe('100 fiszek');
    });

    it('should format 111 with "fiszek"', () => {
      expect(formatFlashcardCount(111)).toBe('111 fiszek');
    });

    it('should format 112 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(112)).toBe('112 fiszek');
    });

    it('should format 113 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(113)).toBe('113 fiszek');
    });

    it('should format 114 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(114)).toBe('114 fiszek');
    });
  });

  describe('Large numbers', () => {
    it('should format 1000 with "fiszek"', () => {
      expect(formatFlashcardCount(1000)).toBe('1000 fiszek');
    });

    it('should format 1002 with "fiszki"', () => {
      expect(formatFlashcardCount(1002)).toBe('1002 fiszki');
    });

    it('should format 9999 with "fiszek"', () => {
      expect(formatFlashcardCount(9999)).toBe('9999 fiszek');
    });
  });

  describe('Edge cases', () => {
    it('should handle 32 with "fiszki"', () => {
      expect(formatFlashcardCount(32)).toBe('32 fiszki');
    });

    it('should handle 42 with "fiszki"', () => {
      expect(formatFlashcardCount(42)).toBe('42 fiszki');
    });

    it('should handle 52 with "fiszki"', () => {
      expect(formatFlashcardCount(52)).toBe('52 fiszki');
    });

    it('should handle 212 with "fiszek" (exception)', () => {
      expect(formatFlashcardCount(212)).toBe('212 fiszek');
    });

    it('should handle 222 with "fiszki"', () => {
      expect(formatFlashcardCount(222)).toBe('222 fiszki');
    });
  });
});

describe('mapToDeckCardViewModel', () => {
  beforeEach(() => {
    // Mock current time to make tests deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-26T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should map deck with all required fields', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Deck',
      flashcard_count: 10,
      cards_due: 5,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result).toHaveProperty('id', mockDeck.id);
    expect(result).toHaveProperty('name', mockDeck.name);
    expect(result).toHaveProperty('flashcard_count', mockDeck.flashcard_count);
    expect(result).toHaveProperty('cards_due', mockDeck.cards_due);
    expect(result).toHaveProperty('created_at', mockDeck.created_at);
    expect(result).toHaveProperty('updated_at', mockDeck.updated_at);
    expect(result).toHaveProperty('user_id', mockDeck.user_id);
  });

  it('should add relativeTime field', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Deck',
      flashcard_count: 10,
      cards_due: 5,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result).toHaveProperty('relativeTime');
    expect(typeof result.relativeTime).toBe('string');
    // Should contain Polish locale text (e.g., "około godziny temu")
    expect(result.relativeTime).toBeTruthy();
  });

  it('should add flashcardCountText field', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Deck',
      flashcard_count: 10,
      cards_due: 5,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result).toHaveProperty('flashcardCountText');
    expect(result.flashcardCountText).toBe('10 fiszek');
  });

  it('should format flashcardCountText with singular form for 1', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Single Card Deck',
      flashcard_count: 1,
      cards_due: 0,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result.flashcardCountText).toBe('1 fiszka');
  });

  it('should format flashcardCountText with "fiszki" for 3', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Three Cards Deck',
      flashcard_count: 3,
      cards_due: 1,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result.flashcardCountText).toBe('3 fiszki');
  });

  it('should format flashcardCountText with "fiszek" for 0', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Empty Deck',
      flashcard_count: 0,
      cards_due: 0,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result.flashcardCountText).toBe('0 fiszek');
  });

  it('should preserve all original deck properties', () => {
    const mockDeck: DeckDTO = {
      id: 'deck-id-123',
      name: 'Preserve Props Deck',
      flashcard_count: 25,
      cards_due: 10,
      created_at: '2025-10-25T12:00:00Z',
      updated_at: '2025-10-26T09:30:00Z',
      user_id: 'user-456',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    // Check that all original properties are preserved
    expect(result.id).toBe(mockDeck.id);
    expect(result.name).toBe(mockDeck.name);
    expect(result.flashcard_count).toBe(mockDeck.flashcard_count);
    expect(result.cards_due).toBe(mockDeck.cards_due);
    expect(result.created_at).toBe(mockDeck.created_at);
    expect(result.updated_at).toBe(mockDeck.updated_at);
    expect(result.user_id).toBe(mockDeck.user_id);
  });

  it('should handle deck with large flashcard count', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Large Deck',
      flashcard_count: 1000,
      cards_due: 500,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result.flashcardCountText).toBe('1000 fiszek');
  });

  it('should handle deck with special characters in name', () => {
    const mockDeck: DeckDTO = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Talia #1: Pytania & Odpowiedzi 🎓',
      flashcard_count: 15,
      cards_due: 5,
      created_at: '2025-10-26T10:00:00Z',
      updated_at: '2025-10-26T11:00:00Z',
      user_id: 'user-123',
    };

    const result = mapToDeckCardViewModel(mockDeck);

    expect(result.name).toBe('Talia #1: Pytania & Odpowiedzi 🎓');
    expect(result.flashcardCountText).toBe('15 fiszek');
  });
});
