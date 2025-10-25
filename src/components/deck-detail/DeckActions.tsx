/**
 * DeckActions - Action buttons for deck operations
 */

import { Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckActionsProps {
  deckId: string;
  cardsDueToday: number;
  hasFlashcards: boolean;
  onAddFlashcard: () => void;
  onDeleteDeck: () => void;
}

export function DeckActions({ deckId, cardsDueToday, hasFlashcards, onAddFlashcard, onDeleteDeck }: DeckActionsProps) {
  const canStartStudy = hasFlashcards && cardsDueToday > 0;

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {/* Start Study Button */}
      <div className="relative group">
        <a
          href={canStartStudy ? `/study/${deckId}` : undefined}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
            canStartStudy
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          onClick={(e) => {
            if (!canStartStudy) {
              e.preventDefault();
            }
          }}
          aria-disabled={!canStartStudy}
        >
          <Play className="h-4 w-4" />
          Rozpocznij naukę
        </a>

        {/* Tooltip for disabled state */}
        {!canStartStudy && (
          <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {!hasFlashcards ? "Dodaj fiszki aby rozpocząć naukę" : "Brak fiszek do powtórki dzisiaj"}
          </div>
        )}
      </div>

      {/* Add Flashcard Button */}
      <button
        onClick={onAddFlashcard}
        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium transition-colors"
      >
        <Plus className="h-4 w-4" />
        Dodaj fiszkę
      </button>

      {/* Generate with AI Button */}
      <a
        href={`/generate?deckId=${deckId}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 font-medium transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Wygeneruj z AI
      </a>

      {/* Delete Deck Button */}
      <button
        onClick={onDeleteDeck}
        className="inline-flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground font-medium transition-colors ml-auto"
      >
        <Trash2 className="h-4 w-4" />
        Usuń talię
      </button>
    </div>
  );
}
