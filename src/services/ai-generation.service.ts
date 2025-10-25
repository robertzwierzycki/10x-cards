/**
 * AI Generation Service
 * Integrates with OpenRouter API to generate flashcards using GPT-4o-mini
 */

import type { FlashcardSuggestion } from "../types";

/**
 * Custom error for AI service unavailability
 */
export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Sanitize input text to prevent prompt injection and normalize formatting
 *
 * @param text - Raw user input
 * @returns Sanitized text safe for AI processing
 */
function sanitizeText(text: string): string {
  return (
    text
      // Remove angle brackets to prevent HTML/XML injection
      .replace(/[<>]/g, "")
      // Limit consecutive newlines to prevent prompt manipulation
      .replace(/\n{3,}/g, "\n\n")
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      .trim()
      // Enforce maximum length
      .slice(0, 1000)
  );
}

/**
 * AI Generation Service
 * Handles communication with OpenRouter API for flashcard generation
 */
export class AIGenerationService {
  private readonly apiKey: string;
  private readonly apiUrl: string = "https://openrouter.ai/api/v1/chat/completions";
  private readonly model: string = "openai/gpt-4o-mini";
  private readonly timeout: number = 5000; // 5 seconds

  constructor() {
    // Get API key from environment
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
  }

  /**
   * System prompt for flashcard generation
   * Emphasizes educational quality and JSON output format
   */
  private getSystemPrompt(): string {
    return `You are an expert educator creating concise educational flashcards.

Rules:
- Generate exactly 5 flashcards from the provided text
- Keep questions (front) clear and specific
- Keep answers (back) brief and factual (1-2 sentences max)
- Focus on key concepts, definitions, and important facts
- Ensure questions can be answered based on the provided text
- Return ONLY valid JSON format: [{"front": "question", "back": "answer"}]
- Do not include any explanatory text, only the JSON array`;
  }

  /**
   * Create user prompt from sanitized text
   */
  private getUserPrompt(text: string): string {
    return `Create 5 educational flashcards from this text:\n\n${text}`;
  }

  /**
   * Generate flashcards from text using OpenRouter API
   *
   * @param text - User-provided text to generate flashcards from
   * @returns Array of flashcard suggestions (up to 5)
   * @throws ServiceUnavailableError if API is unavailable
   * @throws Error for other failures
   */
  async generateFlashcards(text: string): Promise<FlashcardSuggestion[]> {
    // Sanitize input to prevent prompt injection
    const sanitizedText = sanitizeText(text);

    if (!sanitizedText) {
      throw new Error("Text is empty after sanitization");
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10xcards.app", // Required by OpenRouter
          "X-Title": "10xCards", // Optional but recommended
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(),
            },
            {
              role: "user",
              content: this.getUserPrompt(sanitizedText),
            },
          ],
          temperature: 0.7, // Balanced creativity
          max_tokens: 1000, // Enough for 5 flashcards
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting from OpenRouter
      if (response.status === 429) {
        throw new ServiceUnavailableError("AI service is currently busy. Please try again later.");
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      // Parse response
      const data = await response.json();

      // Parse flashcards from AI response
      const flashcards = this.parseAIResponse(data);

      if (flashcards.length === 0) {
        throw new Error("Failed to generate valid flashcards from AI response");
      }

      return flashcards;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableError("AI service request timed out");
      }

      // Re-throw known errors
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }

      // Log and wrap unknown errors
      console.error("AI Generation Error:", error);
      throw new Error("Failed to generate flashcards");
    }
  }

  /**
   * Parse and validate AI response into flashcard suggestions
   *
   * @param response - Raw OpenRouter API response
   * @returns Array of validated flashcard suggestions
   */
  private parseAIResponse(response: any): FlashcardSuggestion[] {
    try {
      // Extract content from OpenRouter response
      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        console.error("No content in AI response:", response);
        return [];
      }

      // Parse JSON content
      const parsed = JSON.parse(content);

      // Validate structure
      if (!Array.isArray(parsed)) {
        console.error("AI response is not an array:", parsed);
        return [];
      }

      // Validate and transform flashcards
      const flashcards = parsed
        .slice(0, 5) // Maximum 5 flashcards
        .map((item) => ({
          front: String(item.front || "").trim(),
          back: String(item.back || "").trim(),
        }))
        // Filter out invalid cards (empty front or back)
        .filter((card) => card.front && card.back && card.front.length > 0 && card.back.length > 0);

      return flashcards;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return [];
    }
  }

  /**
   * Retry a function with exponential backoff
   *
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Result of the function
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        // Don't retry on last attempt
        if (i === maxRetries - 1) {
          throw error;
        }

        // Don't retry on service unavailable (rate limit)
        if (error instanceof ServiceUnavailableError) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error("Max retries exceeded");
  }
}
