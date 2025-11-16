/**
 * Supabase Mock Helpers
 *
 * Provides flexible mocking utilities for Supabase client in tests
 */

import { vi } from "vitest";

/**
 * Create a flexible mock Supabase query builder
 * @param defaultData - Default data to return
 * @param defaultError - Default error to return
 * @returns Mock query builder with chainable methods
 */
export function createMockQueryBuilder(defaultData: any = null, defaultError: any = null) {
  const queryBuilder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    // Final execution methods
    then: vi.fn((resolve) => resolve({ data: defaultData, error: defaultError })),
  };

  // Make chainable
  Object.keys(queryBuilder).forEach((key) => {
    if (typeof queryBuilder[key].mockReturnThis === "function") {
      queryBuilder[key].mockReturnThis();
    }
  });

  return queryBuilder;
}

/**
 * Setup mock for deck list queries (count + data)
 * @param supabase - Mock Supabase client
 * @param count - Total count of items
 * @param data - Data to return for main query
 */
export function mockDeckListQueries(supabase: any, count: number, data: any[]) {
  // First call to from("decks") - count query
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockImplementation((columns?: any, options?: any) => {
          if (options?.count === "exact" && options?.head === true) {
            return {
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((resolve) => resolve({ count, error: null, data: null })),
            };
          }
          return createMockQueryBuilder(data, null);
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // Second call to from("decks") - data query
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data, error: null, count: null })),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for deck creation (uniqueness check + insert)
 * @param supabase - Mock Supabase client
 * @param existingDeck - Existing deck for uniqueness check (null if none)
 * @param newDeck - New deck data to return after insert
 */
export function mockDeckCreateQueries(supabase: any, existingDeck: any, newDeck: any) {
  // First call to from("decks") - uniqueness check
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: existingDeck, error: null }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // Second call to from("decks") - insert operation
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newDeck, error: null }),
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for single deck queries
 * @param supabase - Mock Supabase client
 * @param deck - Deck data to return
 * @param flashcards - Flashcards for the deck
 */
export function mockDeckWithFlashcardsQuery(supabase: any, deck: any, flashcards: any[]) {
  // Single call to from("decks") - get deck with flashcards
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: deck ? { ...deck, flashcards } : null,
            error: deck ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for deck update
 * @param supabase - Mock Supabase client
 * @param existingDeck - Existing deck for update check
 * @param updatedDeck - Updated deck data
 */
export function mockDeckUpdateQueries(supabase: any, existingDeck: any, updatedDeck: any) {
  // First call to from("decks") - check if deck exists
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: existingDeck,
            error: existingDeck ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // Second call to from("decks") - check for duplicate name
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // Third call to from("decks") - update operation
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedDeck,
              error: null,
            }),
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // Fourth call to from("flashcards") - count flashcards
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        select: vi.fn().mockImplementation((columns?: any, options?: any) => {
          if (options?.count === "exact" && options?.head === true) {
            return {
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((resolve) => resolve({ count: 0, error: null, data: null })),
            };
          }
          return createMockQueryBuilder();
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for deck deletion
 * @param supabase - Mock Supabase client
 * @param existingDeck - Deck to delete (null if not found)
 * @param deleteError - Error to return during delete operation (optional)
 */
export function mockDeckDeleteQueries(supabase: any, existingDeck: any, deleteError: any = null) {
  // First call to from("decks") - for checking if deck exists (with two .eq() calls)
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(), // First .eq("id", deckId)
          maybeSingle: vi.fn().mockResolvedValue({
            data: existingDeck,
            error: existingDeck ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // If deck doesn't exist, don't mock delete operation (will not be called)
  if (!existingDeck) {
    return supabase.from;
  }

  // Second call to from("decks") - for delete operation (with two .eq() calls)
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(), // First .eq("id", deckId) - chains to second
          then: vi.fn((resolve) =>
            resolve({
              data: null,
              error: deleteError,
            })
          ),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for flashcard list queries (count + data)
 * @param supabase - Mock Supabase client
 * @param deckId - UUID of the deck
 * @param count - Total count of flashcards
 * @param data - Flashcard data to return
 * @param deckExists - Whether the deck exists (for ownership check)
 * @param userOwns - Whether the user owns the deck (for 403 case)
 */
export function mockFlashcardListQueries(
  supabase: any,
  deckId: string,
  count: number,
  data: any[],
  deckExists = true,
  userOwns = true
) {
  // First call to from("decks") - ownership check via verifyDeckOwnership
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: deckExists && userOwns ? { id: deckId } : null,
            error: deckExists && userOwns ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // If ownership verification failed (!deckExists OR !userOwns), API makes second call
  if (!deckExists || !userOwns) {
    supabase.from.mockImplementationOnce((table: string) => {
      if (table === "decks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: deckExists ? { id: deckId } : null,
              error: deckExists ? null : { message: "Not found", code: "404" },
            }),
          }),
        };
      }
      return createMockQueryBuilder();
    });
    return supabase.from;
  }

  // Second call to from("flashcards") - count query
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        select: vi.fn().mockImplementation((columns?: any, options?: any) => {
          if (options?.count === "exact" && options?.head === true) {
            return {
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((resolve) => resolve({ count, error: null, data: null })),
            };
          }
          return createMockQueryBuilder();
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // Third call to from("flashcards") - data query
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data, error: null, count: null })),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for flashcard creation
 * @param supabase - Mock Supabase client
 * @param deckExists - Whether the deck exists (for ownership check)
 * @param newFlashcard - New flashcard data to return
 * @param userOwns - Whether the user owns the deck (for 403 case)
 */
export function mockFlashcardCreateQueries(supabase: any, deckExists: boolean, newFlashcard: any, userOwns = true) {
  // First call to from("decks") - ownership check via verifyDeckOwnership
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "decks") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: deckExists && userOwns ? { id: newFlashcard?.deck_id || "deck-id" } : null,
            error: deckExists && userOwns ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // If ownership verification failed (!deckExists OR !userOwns), API makes second call
  if (!deckExists || !userOwns) {
    supabase.from.mockImplementationOnce((table: string) => {
      if (table === "decks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: deckExists ? { id: newFlashcard?.deck_id || "deck-id" } : null,
              error: deckExists ? null : { message: "Not found", code: "404" },
            }),
          }),
        };
      }
      return createMockQueryBuilder();
    });
    return supabase.from;
  }

  // Second call to from("flashcards") - insert
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newFlashcard,
              error: null,
            }),
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for flashcard update
 * @param supabase - Mock Supabase client
 * @param flashcardExists - Whether the flashcard exists
 * @param userOwnsFlashcard - Whether the user owns the flashcard
 * @param updatedFlashcard - Updated flashcard data
 */
export function mockFlashcardUpdateQueries(
  supabase: any,
  flashcardExists: boolean,
  userOwnsFlashcard: boolean,
  updatedFlashcard: any
) {
  // First call to from("flashcards") - ownership verification via JOIN with decks
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: flashcardExists && userOwnsFlashcard ? { id: updatedFlashcard?.id || "flashcard-id" } : null,
            error: flashcardExists && userOwnsFlashcard ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // If ownership verification failed (!flashcardExists OR !userOwns), API makes second call
  if (!flashcardExists || !userOwnsFlashcard) {
    supabase.from.mockImplementationOnce((table: string) => {
      if (table === "flashcards") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: flashcardExists ? { id: updatedFlashcard?.id || "flashcard-id" } : null,
              error: flashcardExists ? null : { message: "Not found", code: "404" },
            }),
          }),
        };
      }
      return createMockQueryBuilder();
    });
    return supabase.from;
  }

  // Second call to from("flashcards") - update
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedFlashcard,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}

/**
 * Setup mock for flashcard deletion
 * @param supabase - Mock Supabase client
 * @param flashcardExists - Whether the flashcard exists
 * @param userOwnsFlashcard - Whether the user owns the flashcard
 */
export function mockFlashcardDeleteQueries(supabase: any, flashcardExists: boolean, userOwnsFlashcard: boolean) {
  // First call to from("flashcards") - ownership verification via JOIN with decks
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: flashcardExists && userOwnsFlashcard ? { id: "flashcard-id" } : null,
            error: flashcardExists && userOwnsFlashcard ? null : { message: "Not found", code: "404" },
          }),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  // If ownership verification failed (!flashcardExists OR !userOwns), API makes second call
  if (!flashcardExists || !userOwnsFlashcard) {
    supabase.from.mockImplementationOnce((table: string) => {
      if (table === "flashcards") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: flashcardExists ? { id: "flashcard-id" } : null,
              error: flashcardExists ? null : { message: "Not found", code: "404" },
            }),
          }),
        };
      }
      return createMockQueryBuilder();
    });
    return supabase.from;
  }

  // Second call to from("flashcards") - delete
  supabase.from.mockImplementationOnce((table: string) => {
    if (table === "flashcards") {
      return {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({
              data: null,
              error: null,
            })
          ),
        }),
      };
    }
    return createMockQueryBuilder();
  });

  return supabase.from;
}
