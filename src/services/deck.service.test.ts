/**
 * Unit tests for DeckService
 *
 * Tests cover:
 * - getDeckWithFlashcards() - retrieve deck with flashcards
 * - getDecks() - retrieve paginated list of decks
 * - createDeck() - create new deck
 * - updateDeck() - update deck name
 * - deleteDeck() - delete deck
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeckService } from './deck.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mock = {
    from: vi.fn(),
  };

  return mock as unknown as SupabaseClient<Database>;
};

describe('DeckService', () => {
  let deckService: DeckService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    deckService = new DeckService(mockSupabase as SupabaseClient<Database>);
  });

  describe('getDeckWithFlashcards', () => {
    it('should return deck with flashcards for valid deck and user', async () => {
      const mockDeckData = {
        id: 'deck-123',
        name: 'Test Deck',
        created_at: '2025-10-26T10:00:00Z',
        updated_at: '2025-10-26T11:00:00Z',
        user_id: 'user-123',
        flashcards: [
          {
            id: 'card-1',
            deck_id: 'deck-123',
            front: 'Question 1',
            back: 'Answer 1',
            is_ai_generated: false,
            created_at: '2025-10-26T10:00:00Z',
            updated_at: '2025-10-26T10:00:00Z',
          },
          {
            id: 'card-2',
            deck_id: 'deck-123',
            front: 'Question 2',
            back: 'Answer 2',
            is_ai_generated: true,
            created_at: '2025-10-26T10:00:00Z',
            updated_at: '2025-10-26T10:00:00Z',
          },
        ],
      };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDeckData, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      });

      const result = await deckService.getDeckWithFlashcards('deck-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('deck-123');
      expect(result?.name).toBe('Test Deck');
      expect(result?.flashcards).toHaveLength(2);
      expect(result?.flashcards[0].front).toBe('Question 1');
      expect(result?.flashcards[1].is_ai_generated).toBe(true);
    });

    it('should return null when deck not found', async () => {
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      });

      const result = await deckService.getDeckWithFlashcards('nonexistent-id', 'user-123');

      expect(result).toBeNull();
    });

    it('should return null when database error occurs', async () => {
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: '500' },
        }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      });

      const result = await deckService.getDeckWithFlashcards('deck-123', 'user-123');

      expect(result).toBeNull();
    });

    it('should return deck with empty flashcards array when no flashcards', async () => {
      const mockDeckData = {
        id: 'deck-123',
        name: 'Empty Deck',
        created_at: '2025-10-26T10:00:00Z',
        updated_at: '2025-10-26T11:00:00Z',
        user_id: 'user-123',
        flashcards: [],
      };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDeckData, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      });

      const result = await deckService.getDeckWithFlashcards('deck-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.flashcards).toEqual([]);
    });

    it('should return null when unexpected error is thrown', async () => {
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      });

      const result = await deckService.getDeckWithFlashcards('deck-123', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('getDecks', () => {
    it('should return paginated list of decks', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          name: 'Deck 1',
          created_at: '2025-10-26T10:00:00Z',
          updated_at: '2025-10-26T10:00:00Z',
          flashcards: [{}, {}], // 2 flashcards
        },
        {
          id: 'deck-2',
          name: 'Deck 2',
          created_at: '2025-10-26T11:00:00Z',
          updated_at: '2025-10-26T11:00:00Z',
          flashcards: [{}], // 1 flashcard
        },
      ];

      // Mock count query
      const countChain = {
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };

      // Mock decks query
      const decksChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockDecks, error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(decksChain),
        });

      const result = await deckService.getDecks('user-123', {
        page: 1,
        limit: 20,
        sort: 'updated_at',
        order: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('deck-1');
      expect(result.data[0].flashcard_count).toBe(2);
      expect(result.data[1].flashcard_count).toBe(1);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.total_pages).toBe(1);
    });

    it('should calculate correct pagination metadata', async () => {
      const countChain = {
        eq: vi.fn().mockResolvedValue({ count: 50, error: null }),
      };

      const decksChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(decksChain),
        });

      const result = await deckService.getDecks('user-123', {
        page: 2,
        limit: 10,
        sort: 'name',
        order: 'asc',
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        total_pages: 5,
      });
    });

    it('should throw error when count query fails', async () => {
      const countChain = {
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Count error', code: '500' },
        }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(countChain),
      });

      await expect(
        deckService.getDecks('user-123', { page: 1, limit: 20, sort: 'updated_at', order: 'desc' })
      ).rejects.toThrow('Failed to count decks');
    });

    it('should throw error when decks query fails', async () => {
      const countChain = {
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };

      const decksChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query error', code: '500' },
        }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(decksChain),
        });

      await expect(
        deckService.getDecks('user-123', { page: 1, limit: 20, sort: 'updated_at', order: 'desc' })
      ).rejects.toThrow('Failed to retrieve decks');
    });

    it('should return empty list when user has no decks', async () => {
      const countChain = {
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const decksChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(decksChain),
        });

      const result = await deckService.getDecks('user-123', {
        page: 1,
        limit: 20,
        sort: 'updated_at',
        order: 'desc',
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.total_pages).toBe(0);
    });
  });

  describe('createDeck', () => {
    it('should create new deck successfully', async () => {
      const mockNewDeck = {
        id: 'deck-new',
        name: 'New Deck',
        created_at: '2025-10-26T12:00:00Z',
        updated_at: '2025-10-26T12:00:00Z',
        user_id: 'user-123',
      };

      // Mock uniqueness check
      const checkChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock insert
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNewDeck, error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(checkChain),
        })
        .mockReturnValueOnce(insertChain);

      const result = await deckService.createDeck('New Deck', 'user-123');

      expect(result.id).toBe('deck-new');
      expect(result.name).toBe('New Deck');
      expect(result.flashcard_count).toBe(0);
    });

    it('should trim deck name before creating', async () => {
      const mockNewDeck = {
        id: 'deck-new',
        name: 'Trimmed Name',
        created_at: '2025-10-26T12:00:00Z',
        updated_at: '2025-10-26T12:00:00Z',
        user_id: 'user-123',
      };

      const checkChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNewDeck, error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(checkChain),
        })
        .mockReturnValueOnce(insertChain);

      const result = await deckService.createDeck('  Trimmed Name  ', 'user-123');

      expect(result.name).toBe('Trimmed Name');
    });

    it('should throw error when deck name already exists', async () => {
      const checkChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-deck' },
          error: null,
        }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(checkChain),
      });

      await expect(deckService.createDeck('Existing Deck', 'user-123')).rejects.toThrow(
        'Deck with this name already exists'
      );
    });

    it('should throw error when uniqueness check fails', async () => {
      const checkChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Check error', code: '500' },
        }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(checkChain),
      });

      await expect(deckService.createDeck('New Deck', 'user-123')).rejects.toThrow(
        'Failed to verify deck name uniqueness'
      );
    });

    it('should throw error when insert fails', async () => {
      const checkChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert error', code: '500' },
        }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(checkChain),
        })
        .mockReturnValueOnce(insertChain);

      await expect(deckService.createDeck('New Deck', 'user-123')).rejects.toThrow('Failed to create deck');
    });
  });

  describe('updateDeck', () => {
    it('should update deck name successfully', async () => {
      const mockUpdatedDeck = {
        id: 'deck-123',
        name: 'Updated Name',
        created_at: '2025-10-26T10:00:00Z',
        updated_at: '2025-10-26T12:00:00Z',
        user_id: 'user-123',
      };

      // Mock fetch existing deck
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123', name: 'Old Name' },
          error: null,
        }),
      };

      // Mock duplicate check
      const duplicateChain = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock update
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedDeck, error: null }),
      };

      // Mock flashcard count
      const countChain = {
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(duplicateChain),
        })
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        });

      const result = await deckService.updateDeck('deck-123', 'Updated Name', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(result?.flashcard_count).toBe(5);
    });

    it('should return null when deck not found', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(fetchChain),
      });

      const result = await deckService.updateDeck('nonexistent-id', 'New Name', 'user-123');

      expect(result).toBeNull();
    });

    it('should throw error when fetch fails during update', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch error', code: '500' },
        }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(fetchChain),
      });

      await expect(deckService.updateDeck('deck-123', 'New Name', 'user-123')).rejects.toThrow(
        'Failed to fetch deck'
      );
    });

    it('should throw error when new name conflicts with existing deck', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123', name: 'Old Name' },
          error: null,
        }),
      };

      const duplicateChain = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'other-deck' },
          error: null,
        }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(duplicateChain),
        });

      await expect(deckService.updateDeck('deck-123', 'Duplicate Name', 'user-123')).rejects.toThrow(
        'Deck with this name already exists'
      );
    });

    it('should trim deck name before updating', async () => {
      const mockUpdatedDeck = {
        id: 'deck-123',
        name: 'Trimmed Name',
        created_at: '2025-10-26T10:00:00Z',
        updated_at: '2025-10-26T12:00:00Z',
        user_id: 'user-123',
      };

      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123', name: 'Old Name' },
          error: null,
        }),
      };

      const duplicateChain = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedDeck, error: null }),
      };

      const countChain = {
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(duplicateChain),
        })
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        });

      const result = await deckService.updateDeck('deck-123', '  Trimmed Name  ', 'user-123');

      expect(result?.name).toBe('Trimmed Name');
    });

    it('should throw error when uniqueness check fails', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123', name: 'Old Name' },
          error: null,
        }),
      };

      const duplicateChain = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Uniqueness check error', code: '500' },
        }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(duplicateChain),
        });

      await expect(deckService.updateDeck('deck-123', 'New Name', 'user-123')).rejects.toThrow(
        'Failed to verify deck name uniqueness'
      );
    });

    it('should throw error when update operation fails', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123', name: 'Old Name' },
          error: null,
        }),
      };

      const duplicateChain = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed', code: '500' },
        }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(duplicateChain),
        })
        .mockReturnValueOnce(updateChain);

      await expect(deckService.updateDeck('deck-123', 'Updated Name', 'user-123')).rejects.toThrow(
        'Failed to update deck'
      );
    });

    it('should handle flashcard count error gracefully', async () => {
      const mockUpdatedDeck = {
        id: 'deck-123',
        name: 'Updated Name',
        created_at: '2025-10-26T10:00:00Z',
        updated_at: '2025-10-26T12:00:00Z',
        user_id: 'user-123',
      };

      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123', name: 'Old Name' },
          error: null,
        }),
      };

      const duplicateChain = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedDeck, error: null }),
      };

      // Mock flashcard count with error
      const countChain = {
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Count error', code: '500' },
        }),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(duplicateChain),
        })
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(countChain),
        });

      const result = await deckService.updateDeck('deck-123', 'Updated Name', 'user-123');

      // Should still return result with flashcard_count = 0 when count fails
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(result?.flashcard_count).toBe(0);
    });
  });

  describe('deleteDeck', () => {
    it('should delete deck successfully', async () => {
      // Mock fetch existing deck
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123' },
          error: null,
        }),
      };

      // Mock delete - needs two .eq() calls
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Last eq() call returns the result
      deleteChain.eq.mockReturnValueOnce(deleteChain).mockResolvedValueOnce({ error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce(deleteChain);

      const result = await deckService.deleteDeck('deck-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false when deck not found', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(fetchChain),
      });

      const result = await deckService.deleteDeck('nonexistent-id', 'user-123');

      expect(result).toBe(false);
    });

    it('should throw error when fetch fails', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch error', code: '500' },
        }),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(fetchChain),
      });

      await expect(deckService.deleteDeck('deck-123', 'user-123')).rejects.toThrow('Failed to fetch deck');
    });

    it('should throw error when delete fails', async () => {
      const fetchChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'deck-123' },
          error: null,
        }),
      };

      // Mock delete - needs two .eq() calls
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Last eq() call returns the error
      deleteChain.eq.mockReturnValueOnce(deleteChain).mockResolvedValueOnce({
        error: { message: 'Delete error', code: '500' },
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(fetchChain),
        })
        .mockReturnValueOnce(deleteChain);

      await expect(deckService.deleteDeck('deck-123', 'user-123')).rejects.toThrow('Failed to delete deck');
    });
  });
});
