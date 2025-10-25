/**
 * Utility functions for deck formatting and mapping
 */

import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { DeckDTO, DeckCardViewModel } from "@/types";

/**
 * Formats flashcard count with proper Polish plural forms
 * @param count - Number of flashcards
 * @returns Formatted string like "0 fiszek", "1 fiszka", "25 fiszek"
 */
export function formatFlashcardCount(count: number): string {
  if (count === 0) return "0 fiszek";
  if (count === 1) return "1 fiszka";

  // Polish plural rules for 2-4 (except 12-14)
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return `${count} fiszki`;
  }

  return `${count} fiszek`;
}

/**
 * Maps DeckDTO to DeckCardViewModel with formatted fields
 * @param deck - Raw deck data from API
 * @returns View model with formatted fields for UI display
 */
export function mapToDeckCardViewModel(deck: DeckDTO): DeckCardViewModel {
  return {
    ...deck,
    relativeTime: formatDistanceToNow(new Date(deck.updated_at), {
      addSuffix: true,
      locale: pl,
    }),
    flashcardCountText: formatFlashcardCount(deck.flashcard_count),
  };
}
