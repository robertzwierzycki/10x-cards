/**
 * Main Dashboard view component
 * Orchestrates all dashboard components and state
 */

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { DeckFilters } from "./DeckFilters";
import { DeckGrid } from "./DeckGrid";
import { SkeletonGrid } from "./SkeletonCard";
import { LoadMoreButton } from "@/components/common/LoadMoreButton";
import { CreateDeckDialog } from "./CreateDeckDialog";
import { EditDeckDialog } from "./EditDeckDialog";
import { DeleteDeckConfirmDialog } from "./DeleteDeckConfirmDialog";
import { Button } from "@/components/ui/button";
import { useDeckList } from "@/hooks/useDeckList";
import { useDebounce } from "@/hooks/useDebounce";
import type { DeckDTO } from "@/types";

/**
 * Main Dashboard view
 * Manages deck list, filtering, sorting, and CRUD operations
 */
export function DashboardView() {
  const { decks, isLoading, error, filters, hasMore, setFilters, loadMore, refetch } = useDeckList();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<{ id: string; name: string } | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<{
    id: string;
    name: string;
    flashcardCount: number;
  } | null>(null);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Create sort value string for DeckFilters
  const sortValue = `${filters.sortBy}:${filters.sortOrder}`;

  // Handlers
  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleDeckCreated = (deck: DeckDTO) => {
    // Deck is automatically added to store by useDeckActions
    console.log("Deck created:", deck);
  };

  const handleSearchChange = (query: string) => {
    setFilters({ ...filters, searchQuery: query });
  };

  const handleSortChange = (sortBy: string, order: "asc" | "desc") => {
    setFilters({ ...filters, sortBy: sortBy as "name" | "created_at" | "updated_at", sortOrder: order });
  };

  const handleEdit = (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    if (deck) {
      setEditingDeck({ id: deck.id, name: deck.name });
    }
  };

  const handleCloseEditDialog = () => {
    setEditingDeck(null);
  };

  const handleDeckUpdated = (deck: DeckDTO) => {
    // Deck is automatically updated in store by useDeckActions
    console.log("Deck updated:", deck);
  };

  const handleDelete = (deckId: string, deckName: string, flashcardCount: number) => {
    setDeletingDeck({ id: deckId, name: deckName, flashcardCount });
  };

  const handleCloseDeleteDialog = () => {
    setDeletingDeck(null);
  };

  const handleDeckDeleted = () => {
    // Deck is automatically removed from store by useDeckActions
    console.log("Deck deleted");
  };

  const handleGenerateClick = () => {
    window.location.href = "/generate";
  };

  const handleRetry = () => {
    refetch();
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardHeader onCreateClick={handleOpenCreateDialog} />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <DashboardHeader onCreateClick={handleOpenCreateDialog} />

      <DeckFilters
        searchQuery={filters.searchQuery}
        sortValue={sortValue}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
      />

      {isLoading && decks.length === 0 ? (
        <SkeletonGrid count={6} />
      ) : (
        <>
          <DeckGrid
            decks={decks}
            isSearchActive={!!debouncedSearchQuery}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateClick={handleOpenCreateDialog}
            onGenerateClick={handleGenerateClick}
          />

          {hasMore && !isLoading && <LoadMoreButton onClick={loadMore} isLoading={isLoading} />}

          {isLoading && decks.length > 0 && (
            <div className="py-4">
              <SkeletonGrid count={3} />
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <CreateDeckDialog isOpen={isCreateDialogOpen} onClose={handleCloseCreateDialog} onSuccess={handleDeckCreated} />

      {editingDeck && (
        <EditDeckDialog
          isOpen={!!editingDeck}
          deckId={editingDeck.id}
          currentName={editingDeck.name}
          onClose={handleCloseEditDialog}
          onSuccess={handleDeckUpdated}
        />
      )}

      {deletingDeck && (
        <DeleteDeckConfirmDialog
          isOpen={!!deletingDeck}
          deckId={deletingDeck.id}
          deckName={deletingDeck.name}
          flashcardCount={deletingDeck.flashcardCount}
          onClose={handleCloseDeleteDialog}
          onSuccess={handleDeckDeleted}
        />
      )}
    </div>
  );
}
