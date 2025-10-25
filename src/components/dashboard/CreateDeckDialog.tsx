/**
 * Dialog for creating a new deck
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeckActions } from "@/hooks/useDeckActions";
import { deckNameFormSchema, type DeckNameFormData } from "@/schemas/deck.schema";
import type { DeckDTO } from "@/types";

interface CreateDeckDialogProps {
  /**
   * Dialog open state
   */
  isOpen: boolean;

  /**
   * Close handler
   */
  onClose: () => void;

  /**
   * Success callback with created deck
   */
  onSuccess: (deck: DeckDTO) => void;
}

/**
 * Modal dialog for creating a new deck
 * Includes form validation and error handling
 */
export function CreateDeckDialog({ isOpen, onClose, onSuccess }: CreateDeckDialogProps) {
  const { createDeck, isSubmitting } = useDeckActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DeckNameFormData>({
    resolver: zodResolver(deckNameFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: DeckNameFormData) => {
    const result = await createDeck(data);
    if (result) {
      onSuccess(result);
      reset();
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stwórz nową talię</DialogTitle>
          <DialogDescription>Podaj nazwę dla swojej nowej talii fiszek</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nazwa talii</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="np. JavaScript Basics"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Stwórz talię
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
