/**
 * FlashcardsService - Business logic for flashcard operations
 * Handles database interactions and ownership verification
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BulkCreateFlashcardsCommand,
  BulkCreateFlashcardsResponseDTO,
  CreateFlashcardCommand,
  FlashcardDTO,
  FlashcardListDTO,
  PaginationDTO,
  UpdateFlashcardCommand,
} from "../types";

export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Verify that a deck exists and belongs to the specified user
   * @param deckId - UUID of the deck
   * @param userId - UUID of the user
   * @returns true if user owns the deck, false otherwise
   */
  async verifyDeckOwnership(deckId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    return !error && data !== null;
  }

  /**
   * Verify that a flashcard exists and belongs to the specified user
   * (through the deck relationship)
   * @param flashcardId - UUID of the flashcard
   * @param userId - UUID of the user
   * @returns true if user owns the flashcard, false otherwise
   */
  async verifyFlashcardOwnership(flashcardId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id, decks!inner(user_id)")
      .eq("id", flashcardId)
      .eq("decks.user_id", userId)
      .single();

    return !error && data !== null;
  }

  /**
   * Get paginated list of flashcards for a specific deck
   * @param deckId - UUID of the deck
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page
   * @returns Paginated list of flashcards with metadata
   */
  async getFlashcardsByDeckId(deckId: string, page: number, limit: number): Promise<FlashcardListDTO> {
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const { count, error: countError } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId);

    if (countError) {
      throw new Error(`Failed to count flashcards: ${countError.message}`);
    }

    // Get paginated flashcards
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationDTO = {
      page,
      limit,
      total,
      total_pages: totalPages,
    };

    return {
      data: data as FlashcardDTO[],
      pagination,
    };
  }

  /**
   * Create a single flashcard in a deck
   * @param deckId - UUID of the deck
   * @param command - Flashcard creation data
   * @returns Created flashcard
   */
  async createFlashcard(deckId: string, command: CreateFlashcardCommand): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        deck_id: deckId,
        front: command.front,
        back: command.back,
        is_ai_generated: false, // Manual creation
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    return data as FlashcardDTO;
  }

  /**
   * Create multiple flashcards at once (bulk operation)
   * Uses a transaction to ensure atomicity
   * @param command - Bulk creation data
   * @returns Summary of created flashcards
   */
  async bulkCreateFlashcards(command: BulkCreateFlashcardsCommand): Promise<BulkCreateFlashcardsResponseDTO> {
    // Prepare flashcard records for insertion
    const flashcardsToInsert = command.flashcards.map((fc) => ({
      deck_id: command.deck_id,
      front: fc.front,
      back: fc.back,
      is_ai_generated: fc.is_ai_generated,
    }));

    // Insert all flashcards in a single operation (Supabase handles transaction)
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, deck_id, front, back, is_ai_generated, created_at");

    if (error) {
      throw new Error(`Failed to bulk create flashcards: ${error.message}`);
    }

    return {
      created: data.length,
      flashcards: data,
    };
  }

  /**
   * Update an existing flashcard's content
   * @param id - UUID of the flashcard
   * @param command - Update data
   * @returns Updated flashcard
   */
  async updateFlashcard(id: string, command: UpdateFlashcardCommand): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .update({
        front: command.front,
        back: command.back,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    return data as FlashcardDTO;
  }

  /**
   * Delete a flashcard
   * Cascade deletion of study_records is handled by database
   * @param id - UUID of the flashcard
   */
  async deleteFlashcard(id: string): Promise<void> {
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }
}
