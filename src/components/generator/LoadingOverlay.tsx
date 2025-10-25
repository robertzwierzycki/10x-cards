/**
 * LoadingOverlay component
 * Displays loading state with elapsed time and warning after 4 seconds
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { LoadingOverlayProps } from "@/types/generator.types";

export function LoadingOverlay({ startTime }: LoadingOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Update immediately
    updateElapsed();

    // Update every 500ms for smooth updates
    const interval = setInterval(updateElapsed, 500);

    return () => clearInterval(interval);
  }, [startTime]);

  const showWarning = elapsedSeconds >= 4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-lg border">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-lg font-semibold">Generuję fiszki z AI...</h3>

          <p className="text-sm text-muted-foreground">Czas oczekiwania: {elapsedSeconds}s</p>

          {showWarning && (
            <p className="text-sm text-amber-600 dark:text-amber-500 animate-in fade-in duration-300">
              Trochę to trwa... Jeszcze moment!
            </p>
          )}
        </div>

        <div className="w-full max-w-xs">
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${Math.min((elapsedSeconds / 10) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
