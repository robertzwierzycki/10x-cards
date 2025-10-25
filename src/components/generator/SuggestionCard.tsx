/**
 * SuggestionCard component
 * Editable flashcard suggestion with front/back fields and delete button
 */

import { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionCardProps } from '@/types/generator.types';

const MAX_CONTENT_LENGTH = 5000;

export function SuggestionCard({
  suggestion,
  index,
  onEdit,
  onDelete,
}: SuggestionCardProps) {
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const handleFrontChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;

      if (value.length > MAX_CONTENT_LENGTH) {
        setFrontError(`Maksymalnie ${MAX_CONTENT_LENGTH} znaków`);
        return;
      }

      if (value.trim().length === 0) {
        setFrontError('Pole nie może być puste');
      } else {
        setFrontError(null);
      }

      onEdit(suggestion.id, 'front', value);
    },
    [suggestion.id, onEdit]
  );

  const handleBackChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;

      if (value.length > MAX_CONTENT_LENGTH) {
        setBackError(`Maksymalnie ${MAX_CONTENT_LENGTH} znaków`);
        return;
      }

      if (value.trim().length === 0) {
        setBackError('Pole nie może być puste');
      } else {
        setBackError(null);
      }

      onEdit(suggestion.id, 'back', value);
    },
    [suggestion.id, onEdit]
  );

  const handleDelete = useCallback(() => {
    onDelete(suggestion.id);
  }, [suggestion.id, onDelete]);

  if (suggestion.isDeleted) {
    return null;
  }

  return (
    <Card className="relative p-4 space-y-4">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        aria-label={`Usuń fiszkę ${index + 1}`}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Card number */}
      <div className="text-sm font-medium text-muted-foreground">
        Fiszka #{index + 1}
      </div>

      {/* Front field */}
      <div className="space-y-2">
        <label
          htmlFor={`front-${suggestion.id}`}
          className="text-sm font-medium"
        >
          Przód
        </label>
        <textarea
          id={`front-${suggestion.id}`}
          value={suggestion.front}
          onChange={handleFrontChange}
          className={cn(
            'min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y',
            frontError ? 'border-destructive' : 'border-input'
          )}
          placeholder="Pytanie lub termin..."
        />
        {frontError && (
          <p className="text-xs text-destructive">{frontError}</p>
        )}
        <p className="text-xs text-muted-foreground text-right">
          {suggestion.front.length}/{MAX_CONTENT_LENGTH}
        </p>
      </div>

      {/* Separator */}
      <div className="border-t" />

      {/* Back field */}
      <div className="space-y-2">
        <label
          htmlFor={`back-${suggestion.id}`}
          className="text-sm font-medium"
        >
          Tył
        </label>
        <textarea
          id={`back-${suggestion.id}`}
          value={suggestion.back}
          onChange={handleBackChange}
          className={cn(
            'min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y',
            backError ? 'border-destructive' : 'border-input'
          )}
          placeholder="Odpowiedź lub definicja..."
        />
        {backError && (
          <p className="text-xs text-destructive">{backError}</p>
        )}
        <p className="text-xs text-muted-foreground text-right">
          {suggestion.back.length}/{MAX_CONTENT_LENGTH}
        </p>
      </div>
    </Card>
  );
}
