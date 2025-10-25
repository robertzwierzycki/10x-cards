/**
 * DeckDetailContent - Main React component for deck detail view
 */

import { useState } from "react";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { DeckDetailSkeleton } from "./DeckDetailSkeleton";
import { DeckDetailError } from "./DeckDetailError";
import { DeckHeader } from "./DeckHeader";
import { DeckActions } from "./DeckActions";
import { FlashcardSection } from "./FlashcardSection";
import { FlashcardEditorDialog } from "./FlashcardEditorDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { FlashcardDTO, FlashcardFormData } from "@/types";

interface DeckDetailContentProps {
  deckId: string;
}

interface DialogState {
  flashcardEditor: {
    isOpen: boolean;
    flashcard?: FlashcardDTO;
  };
  deleteConfirm: {
    isOpen: boolean;
    target: "deck" | "flashcard";
    flashcard?: FlashcardDTO;
  };
}

export function DeckDetailContent({ deckId }: DeckDetailContentProps) {
  const {
    deck,
    stats,
    flashcards,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    updateDeckName,
    deleteDeck,
    createFlashcard,
    updateFlashcardContent,
    deleteFlashcard,
    loadMoreFlashcards,
  } = useDeckDetail(deckId);

  const [dialogState, setDialogState] = useState<DialogState>({
    flashcardEditor: { isOpen: false },
    deleteConfirm: { isOpen: false, target: "deck" },
  });

  // Loading state
  if (isLoading) {
    return <DeckDetailSkeleton />;
  }

  // Error state
  if (error) {
    return <DeckDetailError error={error} />;
  }

  // No deck found (shouldn't happen if error handling is correct)
  if (!deck) {
    return <DeckDetailError error={{ code: 404, message: "Talia nie została znaleziona" }} />;
  }

  // Dialog handlers
  const handleOpenAddFlashcard = () => {
    setDialogState({
      ...dialogState,
      flashcardEditor: { isOpen: true, flashcard: undefined },
    });
  };

  const handleOpenEditFlashcard = (flashcard: FlashcardDTO) => {
    setDialogState({
      ...dialogState,
      flashcardEditor: { isOpen: true, flashcard },
    });
  };

  const handleCloseFlashcardEditor = () => {
    setDialogState({
      ...dialogState,
      flashcardEditor: { isOpen: false, flashcard: undefined },
    });
  };

  const handleSaveFlashcard = async (data: FlashcardFormData) => {
    const { flashcard } = dialogState.flashcardEditor;

    if (flashcard) {
      // Edit mode
      await updateFlashcardContent(flashcard.id, data);
    } else {
      // Create mode
      await createFlashcard(data);
    }
  };

  const handleOpenDeleteFlashcard = (flashcard: FlashcardDTO) => {
    setDialogState({
      ...dialogState,
      deleteConfirm: { isOpen: true, target: "flashcard", flashcard },
    });
  };

  const handleOpenDeleteDeck = () => {
    setDialogState({
      ...dialogState,
      deleteConfirm: { isOpen: true, target: "deck" },
    });
  };

  const handleCloseDeleteConfirm = () => {
    setDialogState({
      ...dialogState,
      deleteConfirm: { isOpen: false, target: "deck", flashcard: undefined },
    });
  };

  const handleConfirmDelete = async () => {
    const { target, flashcard } = dialogState.deleteConfirm;

    if (target === "deck") {
      await deleteDeck();
      // Redirect to decks list
      window.location.href = "/decks";
    } else if (target === "flashcard" && flashcard) {
      await deleteFlashcard(flashcard.id);
    }
  };

  // Delete dialog text
  const deleteDialogText = () => {
    const { target } = dialogState.deleteConfirm;

    if (target === "deck") {
      return {
        title: "Usuń talię",
        description: `Czy na pewno chcesz usunąć talię "${deck.name}"? Wszystkie fiszki w tej talii również zostaną usunięte.`,
        itemCount: flashcards.length,
      };
    } else {
      return {
        title: "Usuń fiszkę",
        description: "Czy na pewno chcesz usunąć tę fiszkę?",
        itemCount: undefined,
      };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <DeckHeader deck={deck} stats={stats} onNameUpdate={updateDeckName} />

      {/* Actions */}
      <DeckActions
        deckId={deckId}
        cardsDueToday={stats?.cards_due_today || 0}
        hasFlashcards={flashcards.length > 0}
        onAddFlashcard={handleOpenAddFlashcard}
        onDeleteDeck={handleOpenDeleteDeck}
      />

      {/* Flashcards section */}
      <FlashcardSection
        flashcards={flashcards}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreFlashcards}
        onEdit={handleOpenEditFlashcard}
        onDelete={handleOpenDeleteFlashcard}
        onAddFlashcard={handleOpenAddFlashcard}
      />

      {/* Flashcard Editor Dialog */}
      <FlashcardEditorDialog
        isOpen={dialogState.flashcardEditor.isOpen}
        flashcard={dialogState.flashcardEditor.flashcard}
        onClose={handleCloseFlashcardEditor}
        onSave={handleSaveFlashcard}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={dialogState.deleteConfirm.isOpen}
        {...deleteDialogText()}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteConfirm}
      />
    </div>
  );
}
