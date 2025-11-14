/**
 * SuggestionsReview component
 * Container for reviewing and editing AI-generated flashcard suggestions
 */

import { useMemo } from "react";
import { SuggestionCard } from "./SuggestionCard";
import { DeckSelector } from "./DeckSelector";
import { ActionButtons } from "./ActionButtons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { SuggestionsReviewProps } from "@/types/generator.types";

export function SuggestionsReview({
  suggestions,
  truncated,
  onSuggestionsUpdate,
  onSave,
  onCancel,
  onRegenerate,
  decks,
  selectedDeckId,
  isCreatingNewDeck,
  newDeckName,
  onDeckSelect,
  onToggleCreateNew,
  onNewDeckNameChange,
  isAutoSaveMode = false,
}: SuggestionsReviewProps) {
  // Filter out deleted suggestions for display
  const activeSuggestions = useMemo(() => suggestions.filter((s) => !s.isDeleted), [suggestions]);

  // Check if we can save
  const canSave = useMemo(() => {
    // Must have at least one active suggestion
    if (activeSuggestions.length === 0) return false;

    // Must have selected deck or creating new with valid name
    if (isCreatingNewDeck) {
      return newDeckName.trim().length > 0 && newDeckName.trim().length <= 255;
    }

    return selectedDeckId !== null;
  }, [activeSuggestions.length, isCreatingNewDeck, newDeckName, selectedDeckId]);

  const handleEdit = (id: string, field: "front" | "back", value: string) => {
    onSuggestionsUpdate(suggestions.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDelete = (id: string) => {
    onSuggestionsUpdate(suggestions.map((s) => (s.id === id ? { ...s, isDeleted: true } : s)));
  };

  const handleSave = async () => {
    if (!canSave) return;

    if (isCreatingNewDeck) {
      await onSave("", newDeckName);
    } else if (selectedDeckId) {
      await onSave(selectedDeckId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Wygenerowane fiszki</h2>
        <p className="text-muted-foreground mt-1">
          {activeSuggestions.length} {activeSuggestions.length === 1 ? "fiszka" : "fiszek"} do przejrzenia
        </p>
      </div>

      {/* Truncation alert */}
      {truncated && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            Tekst został automatycznie obcięty do 1000 znaków. Niektóre treści mogły nie zostać uwzględnione w
            generowaniu.
          </AlertDescription>
        </Alert>
      )}

      {/* No active suggestions */}
      {activeSuggestions.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Wszystkie fiszki zostały usunięte. Musisz mieć przynajmniej jedną fiszkę, aby zapisać.
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions list */}
      {activeSuggestions.length > 0 && (
        <div className="space-y-4">
          {activeSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              index={index}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Deck selector or auto-save info */}
      {!isAutoSaveMode ? (
        <div className="pt-4 border-t">
          <DeckSelector
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelect={onDeckSelect}
            isCreatingNew={isCreatingNewDeck}
            onToggleCreateNew={onToggleCreateNew}
            newDeckName={newDeckName}
            onNewDeckNameChange={onNewDeckNameChange}
          />
        </div>
      ) : (
        <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Fiszki zostaną automatycznie dodane do talii:{" "}
            <strong>{decks.find((d) => d.id === selectedDeckId)?.name || "wybranej talii"}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <ActionButtons
        onSave={handleSave}
        onCancel={onCancel}
        onRegenerate={onRegenerate}
        canSave={canSave}
        isSaving={false}
      />
    </div>
  );
}
