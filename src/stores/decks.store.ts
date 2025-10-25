/**
 * Zustand store for managing decks state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { DeckDTO, PaginationDTO } from "@/types";

/**
 * Decks store state and actions
 */
interface DecksStore {
  // State
  decks: DeckDTO[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationDTO | null;

  // Actions
  /**
   * Set decks list (replaces existing)
   */
  setDecks: (decks: DeckDTO[], pagination: PaginationDTO) => void;

  /**
   * Append decks to existing list (for pagination)
   */
  appendDecks: (decks: DeckDTO[], pagination: PaginationDTO) => void;

  /**
   * Add a single deck to the beginning of the list
   */
  addDeck: (deck: DeckDTO) => void;

  /**
   * Update an existing deck
   */
  updateDeck: (id: string, updates: Partial<DeckDTO>) => void;

  /**
   * Remove a deck from the list
   */
  removeDeck: (id: string) => void;

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => void;

  /**
   * Set error message
   */
  setError: (error: string | null) => void;

  /**
   * Clear all decks and reset state
   */
  clearDecks: () => void;
}

/**
 * Decks store with devtools middleware for debugging
 */
export const useDecksStore = create<DecksStore>()(
  devtools(
    (set) => ({
      // Initial state
      decks: [],
      isLoading: false,
      error: null,
      pagination: null,

      // Actions
      setDecks: (decks, pagination) => set({ decks, pagination, error: null }, false, "setDecks"),

      appendDecks: (newDecks, pagination) =>
        set(
          (state) => ({
            decks: [...state.decks, ...newDecks],
            pagination,
          }),
          false,
          "appendDecks"
        ),

      addDeck: (deck) =>
        set(
          (state) => ({
            decks: [deck, ...state.decks],
            pagination: state.pagination
              ? {
                  ...state.pagination,
                  total: state.pagination.total + 1,
                }
              : null,
          }),
          false,
          "addDeck"
        ),

      updateDeck: (id, updates) =>
        set(
          (state) => ({
            decks: state.decks.map((deck) => (deck.id === id ? { ...deck, ...updates } : deck)),
          }),
          false,
          "updateDeck"
        ),

      removeDeck: (id) =>
        set(
          (state) => ({
            decks: state.decks.filter((deck) => deck.id !== id),
            pagination: state.pagination
              ? {
                  ...state.pagination,
                  total: state.pagination.total - 1,
                }
              : null,
          }),
          false,
          "removeDeck"
        ),

      setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      clearDecks: () => set({ decks: [], pagination: null, error: null }, false, "clearDecks"),
    }),
    { name: "decks-store" }
  )
);
