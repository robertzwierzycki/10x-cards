/**
 * Search bar component with debounce
 */

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  /**
   * Current search value
   */
  value: string;

  /**
   * Change handler (should be debounced by parent)
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;
}

/**
 * Search input with icon and clear button
 * Parent component should debounce the onChange handler
 */
export function SearchBar({ value, onChange, placeholder = "Szukaj..." }: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="text" value={value} onChange={handleChange} placeholder={placeholder} className="pl-10 pr-10" />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Wyczyść wyszukiwanie</span>
        </Button>
      )}
    </div>
  );
}
