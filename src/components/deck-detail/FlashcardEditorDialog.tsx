/**
 * FlashcardEditorDialog - Dialog for creating/editing flashcards
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { flashcardSchema, type FlashcardFormData } from "@/schemas/flashcard.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { FlashcardDTO } from "@/types";

interface FlashcardEditorDialogProps {
  isOpen: boolean;
  flashcard?: FlashcardDTO; // undefined = create mode
  onClose: () => void;
  onSave: (data: FlashcardFormData) => Promise<void>;
}

export function FlashcardEditorDialog({ isOpen, flashcard, onClose, onSave }: FlashcardEditorDialogProps) {
  const isEditMode = !!flashcard;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: flashcard?.front || "",
      back: flashcard?.back || "",
    },
  });

  // Watch field values for character count
  const frontValue = watch("front");
  const backValue = watch("back");

  // Reset form when dialog opens/closes or flashcard changes
  useEffect(() => {
    if (isOpen) {
      reset({
        front: flashcard?.front || "",
        back: flashcard?.back || "",
      });
    }
  }, [isOpen, flashcard, reset]);

  const handleFormSubmit = async (data: FlashcardFormData) => {
    try {
      await onSave(data);
      onClose();
      reset();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error saving flashcard:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edytuj fiszkę" : "Dodaj nową fiszkę"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Zaktualizuj treść fiszki poniżej." : "Uzupełnij treść przodu i tyłu fiszki."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Front field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="front">Przód fiszki</Label>
              <span className="text-xs text-muted-foreground">{frontValue?.length || 0}/5000</span>
            </div>
            <textarea
              id="front"
              {...register("front")}
              rows={4}
              className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Wpisz treść przodu fiszki..."
              disabled={isSubmitting}
            />
            {errors.front && <p className="text-sm text-destructive">{errors.front.message}</p>}
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="back">Tył fiszki</Label>
              <span className="text-xs text-muted-foreground">{backValue?.length || 0}/5000</span>
            </div>
            <textarea
              id="back"
              {...register("back")}
              rows={4}
              className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Wpisz treść tyłu fiszki..."
              disabled={isSubmitting}
            />
            {errors.back && <p className="text-sm text-destructive">{errors.back.message}</p>}
          </div>

          {/* Footer with buttons */}
          <DialogFooter>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Dodaj fiszkę"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
