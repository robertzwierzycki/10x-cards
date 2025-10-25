/**
 * FlashcardTable - Desktop table view for flashcards
 */

import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardDTO } from "@/types";

interface FlashcardTableProps {
  flashcards: FlashcardDTO[];
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

export function FlashcardTable({ flashcards, onEdit, onDelete }: FlashcardTableProps) {
  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="hidden md:block border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-sm">Przód</th>
            <th className="text-left px-4 py-3 font-semibold text-sm">Tył</th>
            <th className="text-right px-4 py-3 font-semibold text-sm w-24">Akcje</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {flashcards.map((flashcard) => (
            <tr key={flashcard.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3">
                <div className="text-sm">{truncateText(flashcard.front)}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm">{truncateText(flashcard.back)}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(flashcard)}
                    className="p-2 rounded hover:bg-accent transition-colors"
                    aria-label="Edytuj fiszkę"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(flashcard)}
                    className="p-2 rounded hover:bg-destructive/10 text-destructive transition-colors"
                    aria-label="Usuń fiszkę"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
