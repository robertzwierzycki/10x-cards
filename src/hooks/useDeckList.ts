/**
 * Hook for managing deck list state
 * Handles fetching, filtering, sorting, and pagination
 */

import { useState, useEffect, useMemo } from "react";
import { useDecksStore } from "@/stores/decks.store";
import { mapToDeckCardViewModel } from "@/lib/deck-utils";
import type { DashboardFilters, DeckCardViewModel, DeckListDTO, DEFAULT_DASHBOARD_FILTERS } from "@/types";

/**
 * Hook for deck list management
 * @returns Deck list state and control functions
 */
export function useDeckList() {
  const { decks, isLoading, error, pagination, setDecks, appendDecks, setLoading, setError } = useDecksStore();

  const [filters, setFilters] = useState<DashboardFilters>({
    searchQuery: "",
    sortBy: "updated_at",
    sortOrder: "desc",
  });

  // Fetch initial decks on mount
  useEffect(() => {
    fetchDecks(1);
  }, []);

  /**
   * Fetch decks from API
   * @param page - Page number to fetch (1-indexed)
   */
  async function fetchDecks(page = 1) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort: filters.sortBy,
        order: filters.sortOrder,
      });

      const response = await fetch(`/api/decks?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch decks");
      }

      const data: DeckListDTO = await response.json();

      if (page === 1) {
        setDecks(data.data, data.pagination);
      } else {
        appendDecks(data.data, data.pagination);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się załadować talii";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Load more decks (pagination)
   */
  async function loadMore() {
    if (!pagination || pagination.page >= pagination.total_pages) return;
    await fetchDecks(pagination.page + 1);
  }

  /**
   * Filter and sort decks client-side
   * Returns mapped DeckCardViewModel with formatted fields
   */
  const filteredDecks = useMemo<DeckCardViewModel[]>(() => {
    let result = [...decks];

    // Apply search filter (client-side)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((deck) => deck.name.toLowerCase().includes(query));
    }

    // Apply client-side sorting (for already loaded decks)
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name, "pl");
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "updated_at":
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    // Map to ViewModel with formatted fields
    return result.map(mapToDeckCardViewModel);
  }, [decks, filters]);

  const hasMore = pagination ? pagination.page < pagination.total_pages : false;

  return {
    decks: filteredDecks,
    isLoading,
    error,
    filters,
    hasMore,
    setFilters,
    loadMore,
    refetch: () => fetchDecks(1),
  };
}
