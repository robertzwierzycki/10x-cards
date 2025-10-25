/**
 * FlashcardGrid - Mobile card view for flashcards
 */

import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardDTO } from "@/types";

interface FlashcardGridProps {
  flashcards: FlashcardDTO[];
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

export function FlashcardGrid({ flashcards, onEdit, onDelete }: FlashcardGridProps) {
  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="md:hidden space-y-3">
      {flashcards.map((flashcard) => (
        <div key={flashcard.id} className="border rounded-lg p-4 space-y-3">
          {/* Front */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Przód</div>
            <div className="text-sm">{truncateText(flashcard.front)}</div>
          </div>

          {/* Back */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Tył</div>
            <div className="text-sm">{truncateText(flashcard.back)}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={() => onEdit(flashcard)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm font-medium transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edytuj
            </button>
            <button
              onClick={() => onDelete(flashcard)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Usuń
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
