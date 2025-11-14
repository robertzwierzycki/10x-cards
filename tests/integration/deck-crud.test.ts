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

    it("should return empty list when user has no decks", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const url = new URL("http://localhost:3000/api/decks");

      // Mock Supabase query to return empty array
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      } as any);

      // Act
      const response = await getDecks({
        url,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.decks).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it("should return paginated list of decks with default parameters", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const url = new URL("http://localhost:3000/api/decks");

      const mockDecks = [
        {
          id: generateUUID(),
          name: "Deck 1",
          user_id: mockUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          flashcard_count: 10,
        },
        {
          id: generateUUID(),
          name: "Deck 2",
          user_id: mockUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          flashcard_count: 5,
        },
      ];

      // Mock Supabase query
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockDecks, error: null, count: 2 }),
      } as any);

      // Act
      const response = await getDecks({
        url,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.decks).toHaveLength(2);
      expect(data.decks[0].name).toBe("Deck 1");
      expect(data.pagination.total).toBe(2);
      expect(response.headers.get("cache-control")).toContain("private");
    });

    it("should handle pagination parameters correctly", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const url = new URL("http://localhost:3000/api/decks?page=2&limit=10");

      // Mock Supabase query
      const rangeSpy = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: rangeSpy,
      } as any);

      // Act
      await getDecks({
        url,
        locals: { supabase },
      } as any);

      // Assert
      // Page 2 with limit 10 should call range(10, 19)
      expect(rangeSpy).toHaveBeenCalledWith(10, 19);
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

    it("should handle sorting parameters", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const url = new URL("http://localhost:3000/api/decks?sort=name&order=asc");

      const orderSpy = vi.fn().mockReturnThis();
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: orderSpy,
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      } as any);

      // Act
      await getDecks({
        url,
        locals: { supabase },
      } as any);

      // Assert
      expect(orderSpy).toHaveBeenCalledWith("name", { ascending: true });
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

      // Mock Supabase insert
      vi.spyOn(supabase.from("decks"), "insert").mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: newDeckId,
              name: deckName,
              user_id: mockUser.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      } as any);

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

    it("should trim whitespace from deck name", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckName = "  Deck with spaces  ";
      const trimmedName = "Deck with spaces";
      const newDeckId = generateUUID();

      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deckName }),
      });

      // Mock Supabase insert
      vi.spyOn(supabase.from("decks"), "insert").mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: newDeckId,
              name: trimmedName,
              user_id: mockUser.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      } as any);

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.name).toBe(trimmedName);
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

    it("should return 500 when database operation fails", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const request = new Request("http://localhost:3000/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Deck" }),
      });

      // Mock Supabase to throw generic error
      vi.spyOn(supabase.from("decks"), "insert").mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      } as any);

      // Act
      const response = await createDeck({
        request,
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create deck");
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

    it("should return 404 when deck does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock Supabase query to return null
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      // Act
      const response = await getDeck({
        params: { id: deckId },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
    });

    it("should return deck with flashcards when user owns the deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      const mockDeck = {
        id: deckId,
        name: "Test Deck",
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        flashcards: [
          {
            id: generateUUID(),
            front: "Question 1",
            back: "Answer 1",
            is_ai_generated: false,
          },
        ],
      };

      // Mock Supabase query
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDeck, error: null }),
      } as any);

      // Act
      const response = await getDeck({
        params: { id: deckId },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.id).toBe(deckId);
      expect(data.flashcards).toHaveLength(1);
      expect(response.headers.get("cache-control")).toContain("private");
    });

    it("should return 404 when user tries to access another users deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock Supabase query to return null (RLS prevents access)
      vi.spyOn(supabase.from("decks"), "select").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      // Act
      const response = await getDeck({
        params: { id: deckId },
        locals: { supabase, user: mockUser },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
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

    it("should return 404 when deck does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      // Mock Supabase update to return null
      vi.spyOn(supabase.from("decks"), "update").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
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

      const updatedDeck = {
        id: deckId,
        name: newName,
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase update
      vi.spyOn(supabase.from("decks"), "update").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedDeck, error: null }),
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

      const updatedDeck = {
        id: deckId,
        name: trimmedName,
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase update
      vi.spyOn(supabase.from("decks"), "update").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedDeck, error: null }),
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

    it("should return 500 when database operation fails", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();
      const request = new Request(`http://localhost:3000/api/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      // Mock Supabase to throw generic error
      vi.spyOn(supabase.from("decks"), "update").mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error("Database error")),
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
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update deck");
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

    it("should return 404 when deck does not exist", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock Supabase delete to return count: 0 (no rows deleted)
      vi.spyOn(supabase.from("decks"), "delete").mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      } as any);

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
    });

    it("should successfully delete deck and return 204", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock Supabase delete to return count: 1 (one row deleted)
      vi.spyOn(supabase.from("decks"), "delete").mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ id: deckId }], error: null, count: 1 }),
      } as any);

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

      const deleteSpy = vi.fn().mockResolvedValue({
        data: [{ id: deckId }],
        error: null,
        count: 1,
      });

      vi.spyOn(supabase.from("decks"), "delete").mockReturnValue({
        eq: deleteSpy,
      } as any);

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      // Assert
      expect(response.status).toBe(204);
      // Verify delete was called with correct deck ID
      expect(deleteSpy).toHaveBeenCalled();
    });

    it("should return 404 when trying to delete another users deck", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock Supabase delete to return count: 0 (RLS prevents deletion)
      vi.spyOn(supabase.from("decks"), "delete").mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      } as any);

      // Act
      const response = await deleteDeck({
        params: { id: deckId },
        locals: { supabase },
      } as any);

      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Deck not found");
    });

    it("should return 500 when database operation fails", async () => {
      // Arrange
      const supabase = createMockSupabaseClient(mockUser);
      const deckId = generateUUID();

      // Mock Supabase to throw error
      vi.spyOn(supabase.from("decks"), "delete").mockReturnValue({
        eq: vi.fn().mockRejectedValue(new Error("Database error")),
      } as any);

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
