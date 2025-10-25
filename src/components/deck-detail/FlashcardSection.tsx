/**
 * FlashcardSection - Section displaying flashcard list with pagination
 */

import { Loader2 } from "lucide-react";
import { FlashcardTable } from "./FlashcardTable";
import { FlashcardGrid } from "./FlashcardGrid";
import { EmptyState } from "./EmptyState";
import type { FlashcardDTO } from "@/types";

interface FlashcardSectionProps {
  flashcards: FlashcardDTO[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
  onAddFlashcard: () => void;
}

export function FlashcardSection({
  flashcards,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  onAddFlashcard,
}: FlashcardSectionProps) {
  if (flashcards.length === 0) {
    return <EmptyState onAddFlashcard={onAddFlashcard} />;
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <h2 className="text-xl font-semibold">Fiszki ({flashcards.length})</h2>

      {/* Desktop table view */}
      <FlashcardTable flashcards={flashcards} onEdit={onEdit} onDelete={onDelete} />

      {/* Mobile grid view */}
      <FlashcardGrid flashcards={flashcards} onEdit={onEdit} onDelete={onDelete} />

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ładowanie...
              </>
            ) : (
              "Załaduj więcej"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
