/**
 * useDeckDetail - Custom hook for managing deck detail view state and operations
 */

import { useState, useEffect, useCallback } from "react";
import { useDeckStore } from "@/stores/deck.store";
import type { DeckWithFlashcardsDTO, StudyStatsDTO, FlashcardDTO } from "@/types";

interface ErrorState {
  code: 403 | 404 | 500;
  message: string;
  retry?: () => void;
}

interface FlashcardFormData {
  front: string;
  back: string;
}

interface UseDeckDetailReturn {
  // State
  deck: DeckWithFlashcardsDTO | null;
  stats: StudyStatsDTO | null;
  flashcards: FlashcardDTO[];
  totalFlashcards: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isUpdating: boolean;
  error: ErrorState | null;
  currentPage: number;
  hasMore: boolean;

  // Methods
  fetchDeck: () => Promise<void>;
  fetchStats: () => Promise<void>;
  loadMoreFlashcards: () => Promise<void>;
  updateDeckName: (name: string) => Promise<void>;
  deleteDeck: () => Promise<void>;
  createFlashcard: (data: FlashcardFormData) => Promise<void>;
  updateFlashcardContent: (id: string, data: FlashcardFormData) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
}

const FLASHCARDS_PER_PAGE = 50;

export function useDeckDetail(deckId: string): UseDeckDetailReturn {
  // Zustand store
  const {
    decks,
    flashcards: flashcardsMap,
    setDeck,
    updateDeck,
    removeDeck,
    addFlashcard,
    updateFlashcard,
    removeFlashcard,
    appendFlashcards,
  } = useDeckStore();

  // Local state
  const [stats, setStats] = useState<StudyStatsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFlashcards, setTotalFlashcards] = useState(0);

  // Get deck and flashcards from store
  const deck = decks.get(deckId) || null;
  const flashcards = flashcardsMap.get(deckId) || [];
  const hasMore = flashcards.length < totalFlashcards;

  /**
   * Fetch deck with initial flashcards
   */
  const fetchDeck = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/decks/${deckId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError({
            code: 404,
            message: "Talia nie została znaleziona",
            retry: fetchDeck,
          });
          return;
        }

        if (response.status === 403) {
          setError({
            code: 403,
            message: "Nie masz dostępu do tej talii",
          });
          return;
        }

        throw new Error("Failed to fetch deck");
      }

      const data: DeckWithFlashcardsDTO = await response.json();
      setDeck(data);
      setTotalFlashcards(data.flashcards.length);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching deck:", err);
      setError({
        code: 500,
        message: "Wystąpił błąd podczas ładowania talii",
        retry: fetchDeck,
      });
    } finally {
      setIsLoading(false);
    }
  }, [deckId, setDeck]);

  /**
   * Fetch study statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/study/stats/${deckId}`);

      if (response.ok) {
        const data: StudyStatsDTO = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Stats are not critical, don't show error to user
    }
  }, [deckId]);

  /**
   * Load more flashcards (pagination)
   */
  const loadMoreFlashcards = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);

      const nextPage = currentPage + 1;
      const response = await fetch(`/api/decks/${deckId}/flashcards?page=${nextPage}&limit=${FLASHCARDS_PER_PAGE}`);

      if (!response.ok) {
        throw new Error("Failed to load more flashcards");
      }

      const data = await response.json();
      appendFlashcards(deckId, data.data);
      setCurrentPage(nextPage);
      setTotalFlashcards(data.pagination.total);
    } catch (err) {
      console.error("Error loading more flashcards:", err);
      // Show toast or notification
    } finally {
      setIsLoadingMore(false);
    }
  }, [deckId, currentPage, isLoadingMore, hasMore, appendFlashcards]);

  /**
   * Update deck name
   */
  const updateDeckName = useCallback(
    async (name: string) => {
      if (!deck) return;

      try {
        setIsUpdating(true);

        const response = await fetch(`/api/decks/${deckId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            throw new Error("Talia o tej nazwie już istnieje");
          }
          throw new Error("Failed to update deck name");
        }

        const data = await response.json();
        updateDeck(deckId, { name: data.name, updated_at: data.updated_at });
      } catch (err) {
        console.error("Error updating deck name:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [deck, deckId, updateDeck]
  );

  /**
   * Delete deck
   */
  const deleteDeck = useCallback(async () => {
    try {
      setIsUpdating(true);

      const response = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete deck");
      }

      removeDeck(deckId);
      // Redirect will be handled by component
    } catch (err) {
      console.error("Error deleting deck:", err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [deckId, removeDeck]);

  /**
   * Create new flashcard
   */
  const createFlashcard = useCallback(
    async (data: FlashcardFormData) => {
      try {
        setIsUpdating(true);

        const response = await fetch(`/api/decks/${deckId}/flashcards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create flashcard");
        }

        const flashcard: FlashcardDTO = await response.json();
        addFlashcard(deckId, flashcard);
        setTotalFlashcards((prev) => prev + 1);

        // Refresh stats
        await fetchStats();
      } catch (err) {
        console.error("Error creating flashcard:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [deckId, addFlashcard, fetchStats]
  );

  /**
   * Update flashcard content
   */
  const updateFlashcardContent = useCallback(
    async (id: string, data: FlashcardFormData) => {
      try {
        setIsUpdating(true);

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update flashcard");
        }

        const flashcard: FlashcardDTO = await response.json();
        updateFlashcard(flashcard);
      } catch (err) {
        console.error("Error updating flashcard:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateFlashcard]
  );

  /**
   * Delete flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: string) => {
      try {
        setIsUpdating(true);

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete flashcard");
        }

        removeFlashcard(deckId, id);
        setTotalFlashcards((prev) => prev - 1);

        // Refresh stats
        await fetchStats();
      } catch (err) {
        console.error("Error deleting flashcard:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [deckId, removeFlashcard, fetchStats]
  );

  // Initial load
  useEffect(() => {
    fetchDeck();
    fetchStats();
  }, [fetchDeck, fetchStats]);

  return {
    // State
    deck,
    stats,
    flashcards,
    totalFlashcards,
    isLoading,
    isLoadingMore,
    isUpdating,
    error,
    currentPage,
    hasMore,

    // Methods
    fetchDeck,
    fetchStats,
    loadMoreFlashcards,
    updateDeckName,
    deleteDeck,
    createFlashcard,
    updateFlashcardContent,
    deleteFlashcard,
  };
}
