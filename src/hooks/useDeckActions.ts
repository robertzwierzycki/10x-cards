/**
 * Hook with CRUD actions for decks
 * Provides functions to create, update, and delete decks with API integration
 */

import { useState } from "react";
import { toast } from "sonner";
import { useDecksStore } from "@/stores/decks.store";
import type { CreateDeckCommand, UpdateDeckCommand, DeckDTO, ErrorResponseDTO } from "@/types";

/**
 * Hook for deck CRUD operations
 * @returns Object with create, update, delete functions and loading state
 */
export function useDeckActions() {
  const { addDeck, updateDeck: updateDeckInStore, removeDeck } = useDecksStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Create a new deck
   * @param command - Create deck command with name
   * @returns Created deck or null if failed
   */
  async function createDeck(command: CreateDeckCommand): Promise<DeckDTO | null> {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();

        if (response.status === 409) {
          throw new Error("Talia o tej nazwie już istnieje");
        }

        throw new Error(error.error || "Nie udało się utworzyć talii");
      }

      const deck: DeckDTO = await response.json();
      addDeck(deck);
      toast.success("Talia została utworzona");

      return deck;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Update deck name
   * @param deckId - UUID of the deck to update
   * @param command - Update deck command with new name
   * @returns Updated deck or null if failed
   */
  async function updateDeck(deckId: string, command: UpdateDeckCommand): Promise<DeckDTO | null> {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();

        if (response.status === 409) {
          throw new Error("Talia o tej nazwie już istnieje");
        }

        if (response.status === 404) {
          throw new Error("Talia nie została znaleziona");
        }

        if (response.status === 403) {
          throw new Error("Nie masz uprawnień do tej talii");
        }

        throw new Error(error.error || "Nie udało się zaktualizować talii");
      }

      const deck: DeckDTO = await response.json();
      updateDeckInStore(deckId, deck);
      toast.success("Nazwa talii została zmieniona");

      return deck;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Delete a deck
   * @param deckId - UUID of the deck to delete
   * @returns true if successful, false otherwise
   */
  async function deleteDeck(deckId: string): Promise<boolean> {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();

        if (response.status === 404) {
          throw new Error("Talia nie została znaleziona");
        }

        if (response.status === 403) {
          throw new Error("Nie masz uprawnień do tej talii");
        }

        throw new Error(error.error || "Nie udało się usunąć talii");
      }

      removeDeck(deckId);
      toast.success("Talia została usunięta");

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    createDeck,
    updateDeck,
    deleteDeck,
    isSubmitting,
  };
}
