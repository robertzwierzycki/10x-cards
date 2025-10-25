/**
 * Deck Store - Zustand store for deck and flashcard management
 * Manages state for decks and flashcards across the application
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { DeckWithFlashcardsDTO, DeckDTO, FlashcardDTO } from "@/types";

interface DeckStore {
  // State
  decks: Map<string, DeckWithFlashcardsDTO>;
  flashcards: Map<string, FlashcardDTO[]>;

  // Deck actions
  setDeck: (deck: DeckWithFlashcardsDTO) => void;
  updateDeck: (id: string, updates: Partial<DeckDTO>) => void;
  removeDeck: (id: string) => void;

  // Flashcard actions
  setFlashcards: (deckId: string, flashcards: FlashcardDTO[]) => void;
  addFlashcard: (deckId: string, flashcard: FlashcardDTO) => void;
  updateFlashcard: (flashcard: FlashcardDTO) => void;
  removeFlashcard: (deckId: string, flashcardId: string) => void;
  appendFlashcards: (deckId: string, flashcards: FlashcardDTO[]) => void;

  // Utility actions
  clearDeck: (deckId: string) => void;
}

export const useDeckStore = create<DeckStore>()(
  devtools(
    (set) => ({
      // Initial state
      decks: new Map(),
      flashcards: new Map(),

      // Deck actions
      setDeck: (deck) =>
        set((state) => {
          const newDecks = new Map(state.decks);
          newDecks.set(deck.id, deck);

          const newFlashcards = new Map(state.flashcards);
          newFlashcards.set(deck.id, deck.flashcards);

          return { decks: newDecks, flashcards: newFlashcards };
        }),

      updateDeck: (id, updates) =>
        set((state) => {
          const deck = state.decks.get(id);
          if (!deck) return state;

          const newDecks = new Map(state.decks);
          newDecks.set(id, { ...deck, ...updates });

          return { decks: newDecks };
        }),

      removeDeck: (id) =>
        set((state) => {
          const newDecks = new Map(state.decks);
          newDecks.delete(id);

          const newFlashcards = new Map(state.flashcards);
          newFlashcards.delete(id);

          return { decks: newDecks, flashcards: newFlashcards };
        }),

      // Flashcard actions
      setFlashcards: (deckId, flashcards) =>
        set((state) => {
          const newFlashcards = new Map(state.flashcards);
          newFlashcards.set(deckId, flashcards);

          return { flashcards: newFlashcards };
        }),

      addFlashcard: (deckId, flashcard) =>
        set((state) => {
          const currentFlashcards = state.flashcards.get(deckId) || [];
          const newFlashcards = new Map(state.flashcards);
          newFlashcards.set(deckId, [flashcard, ...currentFlashcards]);

          return { flashcards: newFlashcards };
        }),

      updateFlashcard: (flashcard) =>
        set((state) => {
          const newFlashcards = new Map(state.flashcards);

          // Find the deck containing this flashcard
          for (const [deckId, flashcards] of state.flashcards.entries()) {
            const index = flashcards.findIndex((f) => f.id === flashcard.id);
            if (index !== -1) {
              const updatedFlashcards = [...flashcards];
              updatedFlashcards[index] = flashcard;
              newFlashcards.set(deckId, updatedFlashcards);
              break;
            }
          }

          return { flashcards: newFlashcards };
        }),

      removeFlashcard: (deckId, flashcardId) =>
        set((state) => {
          const currentFlashcards = state.flashcards.get(deckId) || [];
          const newFlashcards = new Map(state.flashcards);
          newFlashcards.set(
            deckId,
            currentFlashcards.filter((f) => f.id !== flashcardId)
          );

          return { flashcards: newFlashcards };
        }),

      appendFlashcards: (deckId, flashcards) =>
        set((state) => {
          const currentFlashcards = state.flashcards.get(deckId) || [];
          const newFlashcards = new Map(state.flashcards);
          newFlashcards.set(deckId, [...currentFlashcards, ...flashcards]);

          return { flashcards: newFlashcards };
        }),

      // Utility actions
      clearDeck: (deckId) =>
        set((state) => {
          const newDecks = new Map(state.decks);
          newDecks.delete(deckId);

          const newFlashcards = new Map(state.flashcards);
          newFlashcards.delete(deckId);

          return { decks: newDecks, flashcards: newFlashcards };
        }),
    }),
    { name: "DeckStore" }
  )
);
