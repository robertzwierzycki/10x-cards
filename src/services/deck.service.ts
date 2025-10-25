/**
 * Deck Service
 *
 * Provides business logic for deck-related operations including
 * retrieving decks with their associated flashcards.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { DeckWithFlashcardsDTO, FlashcardDTO, DeckListDTO, DeckDTO, DeckListQueryParams } from "@/types";

/**
 * Service class for deck operations
 */
export class DeckService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves a deck with all its flashcards
   *
   * @param deckId - UUID of the deck to retrieve
   * @param userId - UUID of the authenticated user
   * @returns DeckWithFlashcardsDTO if found and user is authorized, null otherwise
   *
   * @remarks
   * This method performs a single JOIN query to retrieve the deck and all
   * associated flashcards in one database round-trip for optimal performance.
   *
   * Authorization is enforced at the application level by checking user_id,
   * and additionally backed by Supabase RLS policies.
   */
  async getDeckWithFlashcards(deckId: string, userId: string): Promise<DeckWithFlashcardsDTO | null> {
    try {
      // Single query with JOIN to fetch deck and flashcards together
      const { data, error } = await this.supabase
        .from("decks")
        .select(
          `
          id,
          name,
          created_at,
          updated_at,
          user_id,
          flashcards (
            id,
            deck_id,
            front,
            back,
            is_ai_generated,
            created_at,
            updated_at
          )
        `
        )
        .eq("id", deckId)
        .eq("user_id", userId)
        .single();

      // Handle query errors
      if (error) {
        console.error("[DeckService] Error fetching deck:", error);
        return null;
      }

      // No deck found or user not authorized
      if (!data) {
        return null;
      }

      // Transform database response to DTO format
      const deckDTO: DeckWithFlashcardsDTO = {
        id: data.id,
        name: data.name,
        created_at: data.created_at,
        updated_at: data.updated_at,
        flashcards: (data.flashcards || []) as FlashcardDTO[],
      };

      return deckDTO;
    } catch (error) {
      console.error("[DeckService] Unexpected error in getDeckWithFlashcards:", error);
      return null;
    }
  }

  /**
   * Retrieves a paginated list of decks for a user
   *
   * @param userId - UUID of the authenticated user
   * @param params - Query parameters for pagination and sorting
   * @returns DeckListDTO with paginated deck data
   *
   * @remarks
   * This method performs two queries:
   * 1. COUNT query to get total number of decks
   * 2. Paginated query with flashcard count via LEFT JOIN
   *
   * Uses Supabase RLS policies for additional security layer.
   */
  async getDecks(userId: string, params: DeckListQueryParams): Promise<DeckListDTO> {
    try {
      const { page = 1, limit = 20, sort = "updated_at", order = "desc" } = params;
      const offset = (page - 1) * limit;

      // First, get total count of decks for pagination metadata
      const { count, error: countError } = await this.supabase
        .from("decks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        console.error("[DeckService] Error counting decks:", countError);
        throw new Error("Failed to count decks");
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated decks with flashcard counts
      // Using a raw SQL approach via RPC would be more efficient, but using Supabase client for consistency
      const { data: decks, error: decksError } = await this.supabase
        .from("decks")
        .select(
          `
          id,
          name,
          created_at,
          updated_at,
          flashcards(count)
        `
        )
        .eq("user_id", userId)
        .order(sort, { ascending: order === "asc" })
        .range(offset, offset + limit - 1);

      if (decksError) {
        console.error("[DeckService] Error fetching decks:", decksError);
        throw new Error("Failed to retrieve decks");
      }

      // Transform data to DTO format
      const deckDTOs: DeckDTO[] = (decks || []).map((deck) => ({
        id: deck.id,
        name: deck.name,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        flashcard_count: Array.isArray(deck.flashcards) ? deck.flashcards.length : 0,
      }));

      return {
        data: deckDTOs,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      console.error("[DeckService] Unexpected error in getDecks:", error);
      throw error;
    }
  }

  /**
   * Creates a new deck for a user
   *
   * @param name - Name of the deck (will be trimmed)
   * @param userId - UUID of the authenticated user
   * @returns DeckDTO of the created deck
   * @throws Error if deck with same name already exists or database error occurs
   *
   * @remarks
   * Enforces uniqueness of deck names per user at application level.
   * Database has UNIQUE constraint as additional safeguard.
   */
  async createDeck(name: string, userId: string): Promise<DeckDTO> {
    try {
      const trimmedName = name.trim();

      // Check if deck with this name already exists for this user
      const { data: existing, error: checkError } = await this.supabase
        .from("decks")
        .select("id")
        .eq("user_id", userId)
        .eq("name", trimmedName)
        .maybeSingle();

      if (checkError) {
        console.error("[DeckService] Error checking deck uniqueness:", checkError);
        throw new Error("Failed to verify deck name uniqueness");
      }

      if (existing) {
        throw new Error("Deck with this name already exists");
      }

      // Insert new deck
      const { data: newDeck, error: insertError } = await this.supabase
        .from("decks")
        .insert({
          name: trimmedName,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[DeckService] Error creating deck:", insertError);
        throw new Error("Failed to create deck");
      }

      // Return DTO with flashcard_count = 0 (new deck has no flashcards)
      return {
        id: newDeck.id,
        name: newDeck.name,
        created_at: newDeck.created_at,
        updated_at: newDeck.updated_at,
        flashcard_count: 0,
      };
    } catch (error) {
      console.error("[DeckService] Unexpected error in createDeck:", error);
      throw error;
    }
  }

  /**
   * Updates a deck's name
   *
   * @param deckId - UUID of the deck to update
   * @param name - New name for the deck (will be trimmed)
   * @param userId - UUID of the authenticated user
   * @returns DeckDTO of updated deck, or null if deck not found or user not authorized
   * @throws Error if new name conflicts with existing deck or database error occurs
   *
   * @remarks
   * Verifies user ownership before updating.
   * Checks name uniqueness excluding the current deck.
   */
  async updateDeck(deckId: string, name: string, userId: string): Promise<DeckDTO | null> {
    try {
      const trimmedName = name.trim();

      // First, verify the deck exists and belongs to the user
      const { data: existingDeck, error: fetchError } = await this.supabase
        .from("decks")
        .select("id, name")
        .eq("id", deckId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("[DeckService] Error fetching deck for update:", fetchError);
        throw new Error("Failed to fetch deck");
      }

      if (!existingDeck) {
        return null; // Deck not found or user not authorized
      }

      // Check if another deck with the new name already exists (excluding current deck)
      const { data: duplicate, error: duplicateError } = await this.supabase
        .from("decks")
        .select("id")
        .eq("user_id", userId)
        .eq("name", trimmedName)
        .neq("id", deckId)
        .maybeSingle();

      if (duplicateError) {
        console.error("[DeckService] Error checking name uniqueness:", duplicateError);
        throw new Error("Failed to verify deck name uniqueness");
      }

      if (duplicate) {
        throw new Error("Deck with this name already exists");
      }

      // Update the deck
      const { data: updatedDeck, error: updateError } = await this.supabase
        .from("decks")
        .update({ name: trimmedName })
        .eq("id", deckId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("[DeckService] Error updating deck:", updateError);
        throw new Error("Failed to update deck");
      }

      // Get flashcard count for the updated deck
      const { count, error: countError } = await this.supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("deck_id", deckId);

      if (countError) {
        console.error("[DeckService] Error counting flashcards:", countError);
      }

      return {
        id: updatedDeck.id,
        name: updatedDeck.name,
        created_at: updatedDeck.created_at,
        updated_at: updatedDeck.updated_at,
        flashcard_count: count || 0,
      };
    } catch (error) {
      console.error("[DeckService] Unexpected error in updateDeck:", error);
      throw error;
    }
  }

  /**
   * Deletes a deck and all associated flashcards and study records
   *
   * @param deckId - UUID of the deck to delete
   * @param userId - UUID of the authenticated user
   * @returns true if deck was deleted, false if deck not found or user not authorized
   * @throws Error if database error occurs
   *
   * @remarks
   * Verifies user ownership before deleting.
   * Database CASCADE constraints automatically delete associated flashcards and study_records.
   * This operation is irreversible.
   */
  async deleteDeck(deckId: string, userId: string): Promise<boolean> {
    try {
      // Verify deck exists and belongs to user before deleting
      const { data: existingDeck, error: fetchError } = await this.supabase
        .from("decks")
        .select("id")
        .eq("id", deckId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("[DeckService] Error fetching deck for deletion:", fetchError);
        throw new Error("Failed to fetch deck");
      }

      if (!existingDeck) {
        return false; // Deck not found or user not authorized
      }

      // Delete the deck (CASCADE will handle flashcards and study_records)
      const { error: deleteError } = await this.supabase.from("decks").delete().eq("id", deckId).eq("user_id", userId);

      if (deleteError) {
        console.error("[DeckService] Error deleting deck:", deleteError);
        throw new Error("Failed to delete deck");
      }

      return true;
    } catch (error) {
      console.error("[DeckService] Unexpected error in deleteDeck:", error);
      throw error;
    }
  }
}
