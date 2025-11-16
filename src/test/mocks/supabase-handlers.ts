import { http, HttpResponse } from "msw";

/**
 * Supabase-specific MSW handlers for comprehensive REST API mocking
 */

const SUPABASE_URL = "https://mock.supabase.co";

// In-memory store for test data
export const testDataStore = {
  decks: new Map<string, any>(),
  flashcards: new Map<string, any>(),
  studyRecords: new Map<string, any>(),
  counters: {
    deck: 1,
    flashcard: 1,
    studyRecord: 1,
  },

  // Reset all data between tests
  reset() {
    this.decks.clear();
    this.flashcards.clear();
    this.studyRecords.clear();
    this.counters.deck = 1;
    this.counters.flashcard = 1;
    this.counters.studyRecord = 1;
  },
};

// Helper to parse Supabase query parameters
function parseSupabaseQuery(url: URL) {
  const params: Record<string, any> = {};

  url.searchParams.forEach((value, key) => {
    if (value.startsWith("eq.")) {
      params[key] = { op: "eq", value: value.replace("eq.", "") };
    } else if (value.startsWith("neq.")) {
      params[key] = { op: "neq", value: value.replace("neq.", "") };
    } else if (value.startsWith("gt.")) {
      params[key] = { op: "gt", value: value.replace("gt.", "") };
    } else if (value.startsWith("gte.")) {
      params[key] = { op: "gte", value: value.replace("gte.", "") };
    } else if (value.startsWith("lt.")) {
      params[key] = { op: "lt", value: value.replace("lt.", "") };
    } else if (value.startsWith("lte.")) {
      params[key] = { op: "lte", value: value.replace("lte.", "") };
    } else {
      params[key] = value;
    }
  });

  return params;
}

// Helper to filter data based on query parameters
function filterData(data: any[], params: Record<string, any>) {
  return data.filter((item) => {
    for (const [key, condition] of Object.entries(params)) {
      if (typeof condition === "object" && condition.op) {
        const itemValue = item[key];
        const targetValue = condition.value;

        switch (condition.op) {
          case "eq":
            if (itemValue !== targetValue) return false;
            break;
          case "neq":
            if (itemValue === targetValue) return false;
            break;
          case "gt":
            if (itemValue <= targetValue) return false;
            break;
          case "gte":
            if (itemValue < targetValue) return false;
            break;
          case "lt":
            if (itemValue >= targetValue) return false;
            break;
          case "lte":
            if (itemValue > targetValue) return false;
            break;
        }
      }
    }
    return true;
  });
}

export const supabaseHandlers = [
  // ===========================
  // DECKS endpoints
  // ===========================

  // GET /rest/v1/decks - with complex query support
  http.get(`${SUPABASE_URL}/rest/v1/decks`, ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);
    const select = url.searchParams.get("select");

    let decks = Array.from(testDataStore.decks.values());

    // Apply filters
    decks = filterData(decks, params);

    // Handle select with joins (e.g., flashcards)
    if (select && select.includes("flashcards")) {
      decks = decks.map((deck) => ({
        ...deck,
        flashcards: Array.from(testDataStore.flashcards.values()).filter((fc) => fc.deck_id === deck.id),
      }));
    }

    // Handle range for pagination
    const range = url.searchParams.get("range");
    if (range) {
      const [start, end] = range.split("-").map(Number);
      const paginatedDecks = decks.slice(start, end + 1);

      return new HttpResponse(JSON.stringify(paginatedDecks), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Range": `${start}-${Math.min(end, decks.length - 1)}/${decks.length}`,
        },
      });
    }

    return HttpResponse.json(decks, { status: 200 });
  }),

  // POST /rest/v1/decks - create deck
  http.post(`${SUPABASE_URL}/rest/v1/decks`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newDeck = {
      id: `deck-${testDataStore.counters.deck++}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    testDataStore.decks.set(newDeck.id, newDeck);

    const preferHeader = request.headers.get("Prefer");
    if (preferHeader === "return=representation") {
      return HttpResponse.json([newDeck], { status: 201 });
    }

    return new HttpResponse(null, { status: 201 });
  }),

  // PATCH /rest/v1/decks - update deck
  http.patch(`${SUPABASE_URL}/rest/v1/decks`, async ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);
    const body = (await request.json()) as any;

    const decksToUpdate = filterData(Array.from(testDataStore.decks.values()), params);

    const updatedDecks = decksToUpdate.map((deck) => {
      const updated = {
        ...deck,
        ...body,
        updated_at: new Date().toISOString(),
      };
      testDataStore.decks.set(deck.id, updated);
      return updated;
    });

    const preferHeader = request.headers.get("Prefer");
    if (preferHeader === "return=representation") {
      return HttpResponse.json(updatedDecks, { status: 200 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /rest/v1/decks - delete deck
  http.delete(`${SUPABASE_URL}/rest/v1/decks`, ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);

    const decksToDelete = filterData(Array.from(testDataStore.decks.values()), params);

    decksToDelete.forEach((deck) => {
      testDataStore.decks.delete(deck.id);
      // Cascade delete flashcards
      Array.from(testDataStore.flashcards.entries()).forEach(([id, flashcard]) => {
        if (flashcard.deck_id === deck.id) {
          testDataStore.flashcards.delete(id);
        }
      });
    });

    return new HttpResponse(null, { status: 204 });
  }),

  // ===========================
  // FLASHCARDS endpoints
  // ===========================

  // GET /rest/v1/flashcards - with query support
  http.get(`${SUPABASE_URL}/rest/v1/flashcards`, ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);

    let flashcards = Array.from(testDataStore.flashcards.values());
    flashcards = filterData(flashcards, params);

    // Handle range for pagination
    const range = url.searchParams.get("range");
    if (range) {
      const [start, end] = range.split("-").map(Number);
      const paginatedFlashcards = flashcards.slice(start, end + 1);

      return new HttpResponse(JSON.stringify(paginatedFlashcards), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Range": `${start}-${Math.min(end, flashcards.length - 1)}/${flashcards.length}`,
        },
      });
    }

    return HttpResponse.json(flashcards, { status: 200 });
  }),

  // POST /rest/v1/flashcards - create flashcard
  http.post(`${SUPABASE_URL}/rest/v1/flashcards`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newFlashcard = {
      id: `flashcard-${testDataStore.counters.flashcard++}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    testDataStore.flashcards.set(newFlashcard.id, newFlashcard);

    const preferHeader = request.headers.get("Prefer");
    if (preferHeader === "return=representation") {
      return HttpResponse.json([newFlashcard], { status: 201 });
    }

    return new HttpResponse(null, { status: 201 });
  }),

  // PATCH /rest/v1/flashcards - update flashcard
  http.patch(`${SUPABASE_URL}/rest/v1/flashcards`, async ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);
    const body = (await request.json()) as any;

    const flashcardsToUpdate = filterData(Array.from(testDataStore.flashcards.values()), params);

    const updatedFlashcards = flashcardsToUpdate.map((flashcard) => {
      const updated = {
        ...flashcard,
        ...body,
        updated_at: new Date().toISOString(),
      };
      testDataStore.flashcards.set(flashcard.id, updated);
      return updated;
    });

    const preferHeader = request.headers.get("Prefer");
    if (preferHeader === "return=representation") {
      return HttpResponse.json(updatedFlashcards, { status: 200 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /rest/v1/flashcards - delete flashcard
  http.delete(`${SUPABASE_URL}/rest/v1/flashcards`, ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);

    const flashcardsToDelete = filterData(Array.from(testDataStore.flashcards.values()), params);

    flashcardsToDelete.forEach((flashcard) => {
      testDataStore.flashcards.delete(flashcard.id);
      // Cascade delete study records
      Array.from(testDataStore.studyRecords.entries()).forEach(([id, record]) => {
        if (record.flashcard_id === flashcard.id) {
          testDataStore.studyRecords.delete(id);
        }
      });
    });

    return new HttpResponse(null, { status: 204 });
  }),

  // ===========================
  // STUDY RECORDS endpoints
  // ===========================

  // GET /rest/v1/study_records
  http.get(`${SUPABASE_URL}/rest/v1/study_records`, ({ request }) => {
    const url = new URL(request.url);
    const params = parseSupabaseQuery(url);

    let records = Array.from(testDataStore.studyRecords.values());
    records = filterData(records, params);

    return HttpResponse.json(records, { status: 200 });
  }),

  // POST /rest/v1/study_records - create study record
  http.post(`${SUPABASE_URL}/rest/v1/study_records`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newRecord = {
      id: `record-${testDataStore.counters.studyRecord++}`,
      ...body,
      created_at: new Date().toISOString(),
    };

    testDataStore.studyRecords.set(newRecord.id, newRecord);

    const preferHeader = request.headers.get("Prefer");
    if (preferHeader === "return=representation") {
      return HttpResponse.json([newRecord], { status: 201 });
    }

    return new HttpResponse(null, { status: 201 });
  }),
];
