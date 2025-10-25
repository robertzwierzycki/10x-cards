/**
 * useGenerator hook
 * Main hook for AI Generator logic, combining store with business logic
 */

import { useCallback } from 'react';
import { useGeneratorStore } from '@/stores/generator.store';
import { useRateLimit } from './useRateLimit';
import {
  generateFlashcards,
  createDeck,
  saveFlashcards,
  APIError,
} from '@/services/generator.service';
import { textInputSchema } from '@/schemas/generator.schema';
import type { EditableSuggestion } from '@/types/generator.types';

export function useGenerator() {
  const store = useGeneratorStore();
  const rateLimit = useRateLimit();

  /**
   * Handle flashcard generation from text
   */
  const handleGenerate = useCallback(async () => {
    // Validate text
    const validation = textInputSchema.safeParse(store.text);
    if (!validation.success) {
      store.setError(validation.error.errors[0]?.message || 'Błąd walidacji');
      return;
    }

    // Check rate limit
    if (rateLimit.isLimited) {
      store.setError('Przekroczono limit żądań. Spróbuj ponownie za chwilę.');
      return;
    }

    try {
      // Set loading state
      store.setViewState('loading');
      store.setLoadingStartTime(Date.now());
      store.setError(null);

      // Call API
      const response = await generateFlashcards(store.text);

      // Convert suggestions to EditableSuggestion format
      const suggestions: EditableSuggestion[] = response.suggestions.map(
        (s, index) => ({
          id: `suggestion-${Date.now()}-${index}`,
          front: s.front,
          back: s.back,
          isDeleted: false,
        })
      );

      // Update store
      store.setSuggestions(suggestions);
      store.setTruncated(response.truncated);
      store.setViewState('review');
      store.setLoadingStartTime(null);

      // Update rate limit (assume 1 request consumed)
      if (rateLimit.remaining > 0) {
        rateLimit.updateRateLimit(rateLimit.remaining - 1, 60);
      }
    } catch (error) {
      store.setLoadingStartTime(null);

      if (error instanceof APIError) {
        // Handle specific error cases
        if (error.status === 429) {
          // Rate limit exceeded
          const retryAfter = error.data.retry_after || 60;
          rateLimit.updateRateLimit(0, retryAfter);
          store.setError(
            `Przekroczono limit żądań. Spróbuj ponownie za ${retryAfter} sekund.`
          );
        } else if (error.status === 503) {
          // Service unavailable
          store.setError(
            'Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę.'
          );
        } else {
          store.setError(error.message);
        }
      } else {
        store.setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }

      store.setViewState('input');
    }
  }, [store, rateLimit]);

  /**
   * Handle saving flashcards to deck
   */
  const handleSave = useCallback(
    async (deckId: string, newDeckName?: string) => {
      try {
        store.setViewState('saving');
        store.setError(null);

        let targetDeckId = deckId;

        // Create new deck if needed
        if (newDeckName && newDeckName.trim()) {
          const newDeck = await createDeck(newDeckName.trim());
          targetDeckId = newDeck.id;
        }

        // Save flashcards
        await saveFlashcards(targetDeckId, store.suggestions);

        // Success - reset and return
        store.reset();
        return targetDeckId;
      } catch (error) {
        if (error instanceof APIError) {
          if (error.status === 409) {
            // Deck name conflict
            store.setError('Talia o tej nazwie już istnieje. Wybierz inną nazwę.');
          } else {
            store.setError(error.message);
          }
        } else {
          store.setError('Nie udało się zapisać fiszek. Spróbuj ponownie.');
        }

        store.setViewState('review');
        throw error;
      }
    },
    [store]
  );

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    store.setViewState('input');
    store.setSuggestions([]);
    store.setTruncated(false);
    store.setError(null);
  }, [store]);

  /**
   * Handle regenerate action
   */
  const handleRegenerate = useCallback(async () => {
    // Keep the text but regenerate suggestions
    await handleGenerate();
  }, [handleGenerate]);

  return {
    // State
    ...store,
    rateLimit,

    // Actions
    handleGenerate,
    handleSave,
    handleCancel,
    handleRegenerate,
  };
}
