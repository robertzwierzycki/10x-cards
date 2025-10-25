/**
 * EmptyState - Component for empty flashcard list
 */

import { FileText } from "lucide-react";

interface EmptyStateProps {
  onAddFlashcard: () => void;
}

export function EmptyState({ onAddFlashcard }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Brak fiszek w tej talii</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Rozpocznij dodawanie fiszek ręcznie lub wygeneruj je automatycznie przy pomocy AI.
      </p>

      <button
        onClick={onAddFlashcard}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Dodaj pierwszą fiszkę
      </button>
    </div>
  );
}
