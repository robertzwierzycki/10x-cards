/**
 * GenerateButton component
 * Button for generating flashcards with rate limit countdown
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { GenerateButtonProps } from "@/types/generator.types";

export function GenerateButton({
  onClick,
  disabled,
  isLoading,
  rateLimitRemaining = 10,
  resetTime = null,
}: GenerateButtonProps) {
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (!resetTime) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((resetTime - now) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        // Reset time has passed
        setCountdown(0);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetTime]);

  const isRateLimited = countdown > 0;
  const isDisabled = disabled || isLoading || isRateLimited;

  const getButtonText = () => {
    if (isLoading) return "Generowanie...";
    if (isRateLimited) return `Poczekaj ${countdown}s`;
    return "Generuj fiszki";
  };

  const getButtonTitle = () => {
    if (isRateLimited) {
      return `Limit żądań osiągnięty. Spróbuj ponownie za ${countdown} sekund.`;
    }
    if (rateLimitRemaining <= 3) {
      return `Pozostało ${rateLimitRemaining} żądań w tej minucie`;
    }
    return undefined;
  };

  return (
    <Button onClick={onClick} disabled={isDisabled} size="lg" className="w-full sm:w-auto" title={getButtonTitle()}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {getButtonText()}
    </Button>
  );
}
