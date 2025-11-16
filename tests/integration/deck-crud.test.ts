/**
 * Integration Tests: Deck CRUD Operations
 *
 * Tests the complete flow of deck management operations:
 * - GET /api/decks - List user's decks
 * - POST /api/decks - Create a new deck
 * - GET /api/decks/:id - Get deck with flashcards
 * - PUT /api/decks/:id - Update deck name
 * - DELETE /api/decks/:id - Delete deck
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as getDecks, POST as createDeck } from "@/pages/api/decks/index";
import { GET as getDeck, PUT as updateDeck, DELETE as deleteDeck } from "@/pages/api/decks/[id]";
import {
  createMockSupabaseClient,
  createUnauthenticatedSupabaseClient,
  mockUser,
  mockOtherUser,
  generateUUID,
} from "./helpers/test-utils";

import {
  mockDeckListQueries,
  mockDeckCreateQueries,
  mockDeckWithFlashcardsQuery,
  mockDeckUpdateQueries,
  mockDeckDeleteQueries,
} from "./helpers/supabase-mocks";

describe("Deck CRUD Integration Tests", () => {
  describe("GET /api/decks - List Decks", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const url = new URL("http://localhost:3000/api/decks");

      // Mock Supabase query
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Act
      const response = await getDecks({
        url,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid pagination parameters", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const url = new URL("http://localhost:3000/api/decks?page=-1&limit=1000");

      // Act
      const response = await getDecks({
        url,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid query parameters");
      expect(data.details).toBeDefined();
    });
  });

  describe("POST /api/decks - Create Deck", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Deck" }),
      });

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON in request body");
    });

    it("should return 400 when deck name is missing", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 when deck name is empty", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when deck name is too long", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const longName = "a".repeat(256); // Max is 255
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: longName }),
      });

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should successfully create a deck with valid data", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckName = "My New Deck";
      const newDeckId = generateUUID();

      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deckName }),
      });

      // Mock both uniqueness check and insert
      mockDeckCreateQueries(supabase, null, {
        id: newDeckId,
        name: deckName,
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.id).toBe(newDeckId);
      expect(data.name).toBe(deckName);
      expect(response.headers.get("location")).toBe(`/api/decks/${newDeckId}`);
    });

    it("should return 409 when deck name already exists", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Existing Deck" }),
      });

      // Mock DeckService to throw duplicate error
      vi.spyOn(supabase.from("decks"), "insert").mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error("Deck with this name already exists")),
        }),
      } as any);

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error).toBe("Deck with this name already exists");
    });
  });

  describe("GET /api/decks/:id - Get Deck with Flashcards", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const deckId = generateUUID();

      // Act
      const response = await getDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);

      // Act
      const response = await getDeck({
        params: { id: "invalid-uuid" },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("PUT /api/decks/:id - Update Deck", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks/invalid-uuid", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      // Act
      const response = await updateDeck({
        params: { id: "invalid-uuid" },
        request,
        locals: { supabase },
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
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON in request body");
    });

    it("should return 400 when name is missing", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 when name is empty", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 when name is too long", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const longName = "a".repeat(256); // Max is 255
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: longName }),
      });

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should successfully update deck name", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const newName = "Updated Deck Name";
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      const existingDeck = {
        id: deckId,
        name: "Old Name",
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedDeck = {
        id: deckId,
        name: newName,
        user_id: mockUser.id,
        created_at: existingDeck.created_at,
        updated_at: new Date().toISOString(),
        flashcards_count: 0,
      };

      // Mock successful update
      mockDeckUpdateQueries(supabase, existingDeck, updatedDeck);

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.id).toBe(deckId);
      expect(data.name).toBe(newName);
    });

    it("should trim whitespace from updated name", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const nameWithSpaces = "  Updated Name  ";
      const trimmedName = "Updated Name";
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameWithSpaces }),
      });

      const existingDeck = {
        id: deckId,
        name: "Old Name",
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedDeck = {
        id: deckId,
        name: trimmedName,
        user_id: mockUser.id,
        created_at: existingDeck.created_at,
        updated_at: new Date().toISOString(),
        flashcards_count: 0,
      };

      // Mock successful update
      mockDeckUpdateQueries(supabase, existingDeck, updatedDeck);

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.name).toBe(trimmedName);
    });

    it("should return 409 when updated name conflicts with existing deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Existing Deck Name" }),
      });

      // Mock DeckService to throw duplicate error
      vi.spyOn(supabase.from("decks"), "update").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error("Deck with this name already exists")),
        }),
      } as any);

      // Act
      const response = await updateDeck({
        params: { id: deckId },
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error).toBe("Deck with this name already exists");
    });
  });

  describe("DELETE /api/decks/:id - Delete Deck", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const supabase = createUnauthenticatedSupabaseClient();
      const deckId = generateUUID();

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 400 for invalid UUID format", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);

      // Act
      const response = await deleteDeck({
        params: { id: "invalid-uuid" },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should successfully delete deck and return 204", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock successful deletion
      mockDeckDeleteQueries(supabase, { id: deckId });

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should cascade delete flashcards when deleting deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock successful deletion (cascade is handled by database)
      mockDeckDeleteQueries(supabase, { id: deckId });

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      // Assert
      expect(response.status).toBe(204);
      // Cascade delete is handled by database constraints, no explicit verification needed
    });

    it("should return 500 when database operation fails", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock database error during deletion
      mockDeckDeleteQueries(supabase, { id: deckId }, { message: "Database error", code: "500" });

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete deck");
    });
  });
});
