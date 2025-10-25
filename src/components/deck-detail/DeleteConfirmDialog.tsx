/**
 * DeleteConfirmDialog - Confirmation dialog for deleting deck or flashcard
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemCount?: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  itemCount,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await onConfirm();
      handleClose();
    } catch (error) {
      console.error("Error during deletion:", error);
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setIsConfirmed(false);
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ta operacja jest nieodwracalna.
              {itemCount !== undefined && itemCount > 0 && (
                <>
                  {" "}
                  Zostanie {itemCount === 1 ? "usunięta" : "usuniętych"} {itemCount}{" "}
                  {itemCount === 1 ? "fiszka" : itemCount < 5 ? "fiszki" : "fiszek"}.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Confirmation checkbox */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="confirm-delete"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              disabled={isDeleting}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="confirm-delete" className="text-sm cursor-pointer select-none">
              Rozumiem konsekwencje i chcę kontynuować
            </label>
          </div>
        </div>

        {/* Footer with buttons */}
        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
