/**
 * Load more button for pagination
 */

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Loading state
   */
  isLoading: boolean;
}

/**
 * Button to load next page of items
 * Shows loading spinner when active
 */
export function LoadMoreButton({ onClick, isLoading }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center py-6">
      <Button variant="outline" onClick={onClick} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ładowanie...
          </>
        ) : (
          "Załaduj więcej"
        )}
      </Button>
    </div>
  );
}
