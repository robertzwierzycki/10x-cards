/**
 * Integration Tests: Flashcard CRUD Operations
 *
 * Tests the complete flow of flashcard management operations:
 * - GET /api/decks/:deckId/flashcards - List flashcards with pagination
 * - POST /api/decks/:deckId/flashcards - Create a flashcard
 * - PUT /api/flashcards/:id - Update flashcard content
 * - DELETE /api/flashcards/:id - Delete flashcard
 */

import { describe, it, expect, vi } from "vitest";
import { GET as getFlashcards, POST as createFlashcard } from "@/pages/api/decks/[deckId]/flashcards";
import { PUT as updateFlashcard, DELETE as deleteFlashcard } from "@/pages/api/flashcards/[id]";
import {
  createMockSupabaseClient,
  createUnauthenticatedSupabaseClient,
  mockUser,
  generateUUID,
} from "./helpers/test-utils";
import {
  mockFlashcardListQueries,
  mockFlashcardCreateQueries,
  mockFlashcardUpdateQueries,
  mockFlashcardDeleteQueries,
} from "./helpers/supabase-mocks";

describe("Flashcard CRUD Integration Tests", () => {
  describe("GET /api/decks/:deckId/flashcards - List Flashcards", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards`);

      // Act
      const response = await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid deck UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const url = new URL("http://localhost:3000/api/decks/invalid-uuid/flashcards");

      // Act
      const response = await getFlashcards({
        params: { deckId: "invalid-uuid" },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 404 when deck does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards`);

      // Mock deck not found
      mockFlashcardListQueries(supabase, deckId, 0, [], false);

      // Act
      const response = await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
    });

    it("should return 403 when user does not own the deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards`);

      // Mock deck exists but user doesn't own it
      mockFlashcardListQueries(supabase, deckId, 0, [], true, false);

      // Act
      const response = await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("Access denied");
    });

    it("should return empty list when deck has no flashcards", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards`);

      // Mock empty flashcard list
      mockFlashcardListQueries(supabase, deckId, 0, []);

      // Act
      const response = await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it("should return paginated list of flashcards with default parameters", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards`);

      const mockFlashcards = [
        {
          id: generateUUID(),
          deck_id: deckId,
          front: "Question 1",
          back: "Answer 1",
          is_ai_generated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: generateUUID(),
          deck_id: deckId,
          front: "Question 2",
          back: "Answer 2",
          is_ai_generated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock flashcard list with 2 items
      mockFlashcardListQueries(supabase, deckId, 2, mockFlashcards);

      // Act
      const response = await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].front).toBe("Question 1");
      expect(data.pagination.total).toBe(2);
    });

    it("should handle pagination parameters correctly", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards?page=2&limit=10`);

      // Create a range spy to verify pagination
      const rangeSpy = vi.fn().mockReturnThis();

      // First call - ownership check
      supabase.from.mockImplementationOnce((table: string) => {
        if (table === "decks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: deckId },
                error: null
              })
            })
          };
        }
        return {};
      });

      // Second call - count query
      supabase.from.mockImplementationOnce((table: string) => {
        if (table === "flashcards") {
          return {
            select: vi.fn().mockImplementation((columns?: any, options?: any) => {
              if (options?.count === "exact" && options?.head === true) {
                return {
                  eq: vi.fn().mockReturnThis(),
                  then: vi.fn((resolve) => resolve({ count: 0, error: null, data: null }))
                };
              }
              return {};
            })
          };
        }
        return {};
      });

      // Third call - data query with range spy
      supabase.from.mockImplementationOnce((table: string) => {
        if (table === "flashcards") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              range: rangeSpy,
              then: vi.fn((resolve) => resolve({ data: [], error: null, count: null }))
            })
          };
        }
        return {};
      });

      // Act
      await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      // Assert
      // Page 2 with limit 10 should call range(10, 19)
      expect(rangeSpy).toHaveBeenCalledWith(10, 19);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const url = new URL(`http://localhost:3000/api/decks/${deckId}/flashcards?page=-1&limit=1000`);

      // Act
      const response = await getFlashcards({
        params: { deckId },
        url,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("POST /api/decks/:deckId/flashcards - Create Flashcard", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "Answer" }),
      });

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid deck UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks/invalid-uuid/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "Answer" }),
      });

      // Act
      const response = await createFlashcard({
        params: { deckId: "invalid-uuid" },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON in request body");
    });

    it("should return 400 when front text is missing", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ back: "Answer" }),
      });

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 when back text is missing", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question" }),
      });

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 when front text is empty", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "", back: "Answer" }),
      });

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when back text is empty", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "" }),
      });

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 404 when deck does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "Answer" }),
      });

      // Mock deck not found
      mockFlashcardCreateQueries(supabase, false, null);

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
    });

    it("should return 403 when user does not own the deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "Answer" }),
      });

      // Mock deck exists but user doesn't own it
      mockFlashcardCreateQueries(supabase, true, { deck_id: deckId }, false);

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("Access denied");
    });

    it("should successfully create a flashcard with valid data", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "Answer" }),
      });

      const newFlashcard = {
        id: flashcardId,
        deck_id: deckId,
        front: "Question",
        back: "Answer",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock successful flashcard creation
      mockFlashcardCreateQueries(supabase, true, newFlashcard);

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.id).toBe(flashcardId);
      expect(data.front).toBe("Question");
      expect(data.back).toBe("Answer");
      expect(data.is_ai_generated).toBe(false);
    });

    it("should trim whitespace from front and back text", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "  Question  ", back: "  Answer  " }),
      });

      const newFlashcard = {
        id: flashcardId,
        deck_id: deckId,
        front: "Question",
        back: "Answer",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock successful flashcard creation
      mockFlashcardCreateQueries(supabase, true, newFlashcard);

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.front).toBe("Question");
      expect(data.back).toBe("Answer");
    });

    it("should set is_ai_generated to false for manually created flashcards", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Question", back: "Answer" }),
      });

      const newFlashcard = {
        id: flashcardId,
        deck_id: deckId,
        front: "Question",
        back: "Answer",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock successful flashcard creation
      mockFlashcardCreateQueries(supabase, true, newFlashcard);

      // Act
      const response = await createFlashcard({
        params: { deckId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(data.is_ai_generated).toBe(false);
    });

  });

  describe("PUT /api/flashcards/:id - Update Flashcard", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question", back: "Updated Answer" }),
      });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid flashcard UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/flashcards/invalid-uuid", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question", back: "Updated Answer" }),
      });

      // Act
      const response = await updateFlashcard({
        params: { id: "invalid-uuid" },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON in request body");
    });

    it("should return 400 when front text is missing", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ back: "Updated Answer" }),
      });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when back text is missing", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question" }),
      });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when front text is empty", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "", back: "Updated Answer" }),
      });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when back text is empty", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question", back: "" }),
      });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 404 when flashcard does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question", back: "Updated Answer" }),
      });

      // Mock flashcard not found
      mockFlashcardUpdateQueries(supabase, false, false, null);

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Flashcard not found");
    });

    it("should return 403 when user does not own the flashcard", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question", back: "Updated Answer" }),
      });

      // Mock flashcard exists but user doesn't own it
      mockFlashcardUpdateQueries(supabase, true, false, { id: flashcardId });

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("Access denied");
    });

    it("should successfully update flashcard content", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "Updated Question", back: "Updated Answer" }),
      });

      const updatedFlashcard = {
        id: flashcardId,
        deck_id: deckId,
        front: "Updated Question",
        back: "Updated Answer",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock successful flashcard update
      mockFlashcardUpdateQueries(supabase, true, true, updatedFlashcard);

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.id).toBe(flashcardId);
      expect(data.front).toBe("Updated Question");
      expect(data.back).toBe("Updated Answer");
    });

    it("should trim whitespace from updated front and back text", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: "  Updated Question  ", back: "  Updated Answer  " }),
      });

      // Mock ownership verification
      vi.spyOn(supabase.from("flashcards"), "select").mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: flashcardId, deck_id: deckId },
          error: null,
        }),
      } as any);

      vi.spyOn(supabase.from("decks"), "select").mockReturnValueOnce({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: deckId, user_id: mockUser.id },
          error: null,
        }),
      } as any);

      // Mock flashcard update
      vi.spyOn(supabase.from("flashcards"), "update").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: flashcardId,
              deck_id: deckId,
              front: "Updated Question",
              back: "Updated Answer",
              is_ai_generated: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      } as any);

      // Act
      const response = await updateFlashcard({
        params: { id: flashcardId },
        request,
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.front).toBe("Updated Question");
      expect(data.back).toBe("Updated Answer");
    });

  });

  describe("DELETE /api/flashcards/:id - Delete Flashcard", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const flashcardId = generateUUID();

      // Act
      const response = await deleteFlashcard({
        params: { id: flashcardId },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid flashcard UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);

      // Act
      const response = await deleteFlashcard({
        params: { id: "invalid-uuid" },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 404 when flashcard does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();

      // Mock flashcard not found
      mockFlashcardDeleteQueries(supabase, false, false);

      // Act
      const response = await deleteFlashcard({
        params: { id: flashcardId },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Flashcard not found");
    });

    it("should return 403 when user does not own the flashcard", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();

      // Mock flashcard exists but user doesn't own it
      mockFlashcardDeleteQueries(supabase, true, false);

      // Act
      const response = await deleteFlashcard({
        params: { id: flashcardId },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("Access denied");
    });

    it("should successfully delete flashcard and return 204", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();

      // Mock successful flashcard deletion
      mockFlashcardDeleteQueries(supabase, true, true);

      // Act
      const response = await deleteFlashcard({
        params: { id: flashcardId },
        locals: { supabase, user: mockUser },
      } as any);

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should cascade delete study records when deleting flashcard", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();

      // Mock successful flashcard deletion (CASCADE handled by database)
      mockFlashcardDeleteQueries(supabase, true, true);

      // Act
      const response = await deleteFlashcard({
        params: { id: flashcardId },
        locals: { supabase, user: mockUser },
      } as any);

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should return 500 when database operation fails", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const flashcardId = generateUUID();
      const deckId = generateUUID();

      // Mock ownership verification
      supabase.from.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: flashcardId, deck_id: deckId },
            error: null,
          }),
        })
      }));

      // Mock delete to throw error
      supabase.from.mockImplementationOnce(() => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error("Database error")),
        })
      }));

      // Act
      const response = await deleteFlashcard({
        params: { id: flashcardId },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
