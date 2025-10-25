/**
 * Confirmation dialog for deleting a deck
 */

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDeckActions } from "@/hooks/useDeckActions";

interface DeleteDeckConfirmDialogProps {
  /**
   * Dialog open state
   */
  isOpen: boolean;

  /**
   * UUID of the deck to delete
   */
  deckId: string;

  /**
   * Name of the deck (for display)
   */
  deckName: string;

  /**
   * Number of flashcards in the deck
   */
  flashcardCount: number;

  /**
   * Close handler
   */
  onClose: () => void;

  /**
   * Success callback (no arguments)
   */
  onSuccess: () => void;
}

/**
 * Confirmation dialog for deck deletion
 * Requires checkbox confirmation before allowing deletion
 */
export function DeleteDeckConfirmDialog({
  isOpen,
  deckId,
  deckName,
  flashcardCount,
  onClose,
  onSuccess,
}: DeleteDeckConfirmDialogProps) {
  const { deleteDeck, isSubmitting } = useDeckActions();
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset confirmation when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsConfirmed(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!isConfirmed) return;

    const success = await deleteDeck(deckId);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsConfirmed(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Usuń talię
          </DialogTitle>
          <DialogDescription className="pt-2">
            Czy na pewno chcesz usunąć talię <strong>"{deckName}"</strong>?
            {flashcardCount > 0 && (
              <>
                {" "}
                Spowoduje to trwałe usunięcie <strong>{flashcardCount} fiszek</strong>.
              </>
            )}
            <br />
            <strong>Tej akcji nie można cofnąć.</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertDescription>
            Usunięcie talii jest operacją nieodwracalną. Wszystkie fiszki zostaną trwale usunięte.
          </AlertDescription>
        </Alert>

        <div className="flex items-start space-x-2 py-4">
          <Checkbox
            id="confirm-delete"
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked === true)}
            disabled={isSubmitting}
          />
          <Label htmlFor="confirm-delete" className="text-sm font-normal cursor-pointer leading-tight">
            Rozumiem konsekwencje i chcę usunąć tę talię
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!isConfirmed || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń talię
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
