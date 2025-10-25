/**
 * CharacterCounter component
 * Displays character count with color-coded feedback
 */

import { cn } from "@/lib/utils";
import type { CharacterCounterProps } from "@/types/generator.types";

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const percentage = (current / max) * 100;

  // Color coding based on percentage
  const getColorClass = () => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-amber-600 dark:text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <span
      className={cn("text-sm font-medium transition-colors", getColorClass())}
      aria-live="polite"
      aria-atomic="true"
    >
      {current}/{max}
    </span>
  );
}
