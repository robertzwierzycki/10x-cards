/**
 * Deck card component
 * Displays deck information with actions menu
 */

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DeckCardViewModel } from "@/types";

interface DeckCardProps {
  /**
   * Deck data with formatted fields
   */
  deck: DeckCardViewModel;

  /**
   * Edit handler
   */
  onEdit: (deckId: string) => void;

  /**
   * Delete handler
   */
  onDelete: (deckId: string, deckName: string, flashcardCount: number) => void;
}

/**
 * Card displaying deck information
 * Clickable to navigate to deck details
 * Includes dropdown menu for edit/delete actions
 */
export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const handleNavigate = () => {
    window.location.href = `/decks/${deck.id}`;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(deck.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(deck.id, deck.name, deck.flashcard_count);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 min-w-0" onClick={handleNavigate}>
          <CardTitle className="text-xl truncate">{deck.name}</CardTitle>
          <CardDescription className="mt-1">{deck.flashcardCountText}</CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleDropdownClick}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Otwórz menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj nazwę
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń talię
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardFooter onClick={handleNavigate}>
        <p className="text-sm text-muted-foreground">Zaktualizowano {deck.relativeTime}</p>
      </CardFooter>
    </Card>
  );
}
