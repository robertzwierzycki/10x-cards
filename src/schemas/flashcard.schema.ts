/**
 * Flashcard validation schemas
 */

import { z } from "zod";

export const flashcardSchema = z.object({
  front: z.string().min(1, "Przód fiszki jest wymagany").max(5000, "Przód może mieć maksymalnie 5000 znaków").trim(),
  back: z.string().min(1, "Tył fiszki jest wymagany").max(5000, "Tył może mieć maksymalnie 5000 znaków").trim(),
});

export type FlashcardFormData = z.infer<typeof flashcardSchema>;
