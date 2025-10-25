/**
 * useRateLimit hook
 * Tracks rate limiting state with localStorage persistence
 */

import { useEffect, useState } from 'react';
import { getRateLimitInfo, saveRateLimitInfo, clearRateLimitInfo } from '@/services/generator.service';

export function useRateLimit() {
  const [remaining, setRemaining] = useState<number>(10);
  const [resetTime, setResetTime] = useState<number | null>(null);

  // Load initial rate limit info from localStorage
  useEffect(() => {
    const info = getRateLimitInfo();
    if (info) {
      setRemaining(info.remaining);
      setResetTime(info.resetTime);
    }
  }, []);

  // Update rate limit info
  const updateRateLimit = (newRemaining: number, retryAfter: number) => {
    setRemaining(newRemaining);
    const newResetTime = Date.now() + retryAfter * 1000;
    setResetTime(newResetTime);
    saveRateLimitInfo(newRemaining, retryAfter);
  };

  // Clear rate limit info
  const clearRateLimit = () => {
    setRemaining(10);
    setResetTime(null);
    clearRateLimitInfo();
  };

  // Check if currently rate limited
  const isLimited = resetTime !== null && Date.now() < resetTime;

  return {
    remaining,
    resetTime,
    isLimited,
    updateRateLimit,
    clearRateLimit,
  };
}
