/**
 * Zustand store for AI Generator state management
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GeneratorStore, ViewState, EditableSuggestion } from "@/types/generator.types";

/**
 * Initial state for the generator
 */
const initialState = {
  viewState: "input" as ViewState,
  text: "",
  suggestions: [],
  truncated: false,
  selectedDeckId: null,
  isCreatingNewDeck: false,
  newDeckName: "",
  rateLimitRemaining: 10,
  rateLimitResetTime: null,
  loadingStartTime: null,
  error: null,
};

/**
 * Generator store with actions
 */
export const useGeneratorStore = create<GeneratorStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Text input actions
      setText: (text: string) => set({ text: text.slice(0, 1000) }, false, "setText"),

      // Suggestions actions
      setSuggestions: (suggestions: EditableSuggestion[]) => set({ suggestions }, false, "setSuggestions"),

      updateSuggestion: (id: string, field: "front" | "back", value: string) =>
        set(
          (state) => ({
            suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
          }),
          false,
          "updateSuggestion"
        ),

      deleteSuggestion: (id: string) =>
        set(
          (state) => ({
            suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, isDeleted: true } : s)),
          }),
          false,
          "deleteSuggestion"
        ),

      // Deck selection actions
      setSelectedDeck: (deckId: string) =>
        set({ selectedDeckId: deckId, isCreatingNewDeck: false }, false, "setSelectedDeck"),

      setNewDeckName: (name: string) => set({ newDeckName: name }, false, "setNewDeckName"),

      toggleCreateNewDeck: () =>
        set(
          (state) => ({
            isCreatingNewDeck: !state.isCreatingNewDeck,
            selectedDeckId: state.isCreatingNewDeck ? state.selectedDeckId : null,
            newDeckName: state.isCreatingNewDeck ? "" : state.newDeckName,
          }),
          false,
          "toggleCreateNewDeck"
        ),

      // View state actions
      setViewState: (viewState: ViewState) => set({ viewState }, false, "setViewState"),

      // Rate limit actions
      setRateLimit: (remaining: number, resetTime: number) =>
        set({ rateLimitRemaining: remaining, rateLimitResetTime: resetTime }, false, "setRateLimit"),

      // Error handling
      setError: (error: string | null) => set({ error }, false, "setError"),

      // Loading state
      setLoadingStartTime: (time: number | null) => set({ loadingStartTime: time }, false, "setLoadingStartTime"),

      // Truncated flag
      setTruncated: (truncated: boolean) => set({ truncated }, false, "setTruncated"),

      // Reset to initial state
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "GeneratorStore" }
  )
);
