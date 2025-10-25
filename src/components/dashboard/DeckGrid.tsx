/**
 * Grid of deck cards
 * Displays cards in responsive grid or empty state
 */

import { DeckCard } from "./DeckCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import type { DeckCardViewModel } from "@/types";

interface DeckGridProps {
  /**
   * Array of decks to display
   */
  decks: DeckCardViewModel[];

  /**
   * Whether search is active (affects empty state message)
   */
  isSearchActive?: boolean;

  /**
   * Handler for edit action
   */
  onEdit: (deckId: string) => void;

  /**
   * Handler for delete action
   */
  onDelete: (deckId: string, deckName: string, flashcardCount: number) => void;

  /**
   * Handler for create button in empty state
   */
  onCreateClick?: () => void;

  /**
   * Handler for generate button in empty state
   */
  onGenerateClick?: () => void;
}

/**
 * Responsive grid of deck cards
 * Shows empty state when no decks available
 */
export function DeckGrid({
  decks,
  isSearchActive = false,
  onEdit,
  onDelete,
  onCreateClick,
  onGenerateClick,
}: DeckGridProps) {
  // Empty state when no decks
  if (decks.length === 0) {
    return (
      <EmptyState
        title={isSearchActive ? "Brak wyników" : "Brak talii"}
        description={
          isSearchActive
            ? "Nie znaleziono talii pasujących do wyszukiwania"
            : "Stwórz swoją pierwszą talię lub wygeneruj ją z AI!"
        }
        actions={
          !isSearchActive && (
            <>
              {onCreateClick && <Button onClick={onCreateClick}>Stwórz pierwszą talię</Button>}
              {onGenerateClick && (
                <Button variant="outline" onClick={onGenerateClick}>
                  Wygeneruj z AI
                </Button>
              )}
            </>
          )
        }
      />
    );
  }

  // Grid of deck cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
