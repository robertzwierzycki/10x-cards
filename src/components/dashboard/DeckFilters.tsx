/**
 * Filters for deck list
 * Includes search bar and sort dropdown
 */

import { SearchBar } from "./SearchBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SortOrder } from "@/types";

interface DeckFiltersProps {
  /**
   * Current search query
   */
  searchQuery: string;

  /**
   * Current sort field and order (format: "field:order")
   */
  sortValue: string;

  /**
   * Search change handler
   */
  onSearchChange: (query: string) => void;

  /**
   * Sort change handler
   */
  onSortChange: (sortBy: string, order: SortOrder) => void;
}

/**
 * Filter controls for deck list
 * Includes search and sort functionality
 */
export function DeckFilters({ searchQuery, sortValue, onSearchChange, onSortChange }: DeckFiltersProps) {
  const handleSortChange = (value: string) => {
    const [sortBy, order] = value.split(":") as [string, SortOrder];
    onSortChange(sortBy, order);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="Szukaj talii..." />

      <Select value={sortValue} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="Sortuj według..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated_at:desc">Ostatnio zaktualizowane</SelectItem>
          <SelectItem value="name:asc">Nazwa A-Z</SelectItem>
          <SelectItem value="name:desc">Nazwa Z-A</SelectItem>
          <SelectItem value="created_at:desc">Najnowsze</SelectItem>
          <SelectItem value="created_at:asc">Najstarsze</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
