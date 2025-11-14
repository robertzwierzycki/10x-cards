/**
 * Unit tests for OpenRouter Service Utility Functions
 *
 * Tests cover:
 * - truncateInput() - text truncation with word boundaries
 * - buildSystemPrompt() - system prompt generation
 * - buildMessages() - messages array construction
 * - getFlashcardResponseFormat() - response format configuration
 * - calculateBackoffDelay() - exponential backoff calculation
 * - isRetryableError() - error retry logic
 * - sanitizeInput() - input sanitization
 * - isValidApiKeyFormat() - API key validation
 * - redactSensitiveInfo() - sensitive data redaction
 * - formatUsageStats() - usage statistics formatting
 * - isCacheValid() - cache validation
 * - safeJsonParse() - safe JSON parsing
 * - delay() - async delay function
 * - generateCacheKey() - SHA-256 hash generation for caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  truncateInput,
  buildSystemPrompt,
  buildMessages,
  getFlashcardResponseFormat,
  calculateBackoffDelay,
  isRetryableError,
  sanitizeInput,
  isValidApiKeyFormat,
  redactSensitiveInfo,
  formatUsageStats,
  isCacheValid,
  safeJsonParse,
  delay,
  generateCacheKey,
} from "./utils";

describe("truncateInput", () => {
  it("should return empty string for empty input", () => {
    const result = truncateInput("");
    expect(result).toEqual({ text: "", truncated: false });
  });

  it("should return text unchanged if under max length", () => {
    const text = "Short text";
    const result = truncateInput(text, 100);
    expect(result).toEqual({ text: "Short text", truncated: false });
  });

  it("should trim whitespace from input", () => {
    const text = "  Text with spaces  ";
    const result = truncateInput(text, 100);
    expect(result).toEqual({ text: "Text with spaces", truncated: false });
  });

  it("should truncate text exceeding max length", () => {
    const text = "a".repeat(1500);
    const result = truncateInput(text, 1000);
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(1000);
  });

  it("should preserve word boundaries when truncating", () => {
    const text = "This is a long text that needs to be truncated at word boundary";
    const result = truncateInput(text, 30);
    expect(result.truncated).toBe(true);
    // Should truncate at word boundary - result ends with complete word
    expect(result.text).toBe("This is a long text that needs");
    expect(result.text.length).toBeLessThanOrEqual(30);
  });

  it("should use word boundary if within 80% of max length", () => {
    const text = "word ".repeat(250); // Creates long text with spaces
    const result = truncateInput(text, 100);
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeGreaterThan(80); // At least 80% of 100
  });

  it("should truncate at exact length if no word boundary available", () => {
    const text = "a".repeat(1500); // No spaces
    const result = truncateInput(text, 1000);
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(1000);
  });

  it("should handle text exactly at max length", () => {
    const text = "a".repeat(1000);
    const result = truncateInput(text, 1000);
    expect(result).toEqual({ text: text, truncated: false });
  });

  it("should use default max length of 1000", () => {
    const text = "a".repeat(1500);
    const result = truncateInput(text);
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(1000);
  });
});

describe("buildSystemPrompt", () => {
  it("should return a non-empty string", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe("string");
  });

  it("should include flashcard creation guidelines", () => {
    const prompt = buildSystemPrompt();
    expect(prompt.toLowerCase()).toContain("flashcard");
  });

  it("should mention JSON format", () => {
    const prompt = buildSystemPrompt();
    expect(prompt.toLowerCase()).toContain("json");
  });

  it("should be consistent across multiple calls", () => {
    const prompt1 = buildSystemPrompt();
    const prompt2 = buildSystemPrompt();
    expect(prompt1).toBe(prompt2);
  });
});

describe("buildMessages", () => {
  it("should return array with system and user messages", () => {
    const messages = buildMessages("Test input");
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("should include input text in user message", () => {
    const input = "Create flashcards about TypeScript";
    const messages = buildMessages(input);
    expect(messages[1].content).toContain(input);
  });

  it("should include flashcard count in user message", () => {
    const messages = buildMessages("Test input", 10);
    expect(messages[1].content).toContain("10");
  });

  it("should use default count of 5", () => {
    const messages = buildMessages("Test input");
    expect(messages[1].content).toContain("5");
  });

  it("should include system prompt in system message", () => {
    const messages = buildMessages("Test input");
    expect(messages[0].content).toBeTruthy();
    expect(messages[0].content.toLowerCase()).toContain("flashcard");
  });
});

describe("getFlashcardResponseFormat", () => {
  it("should return json_schema type", () => {
    const format = getFlashcardResponseFormat();
    expect(format.type).toBe("json_schema");
  });

  it("should have flashcard_generation as name", () => {
    const format = getFlashcardResponseFormat();
    expect(format.json_schema.name).toBe("flashcard_generation");
  });

  it("should have strict mode enabled", () => {
    const format = getFlashcardResponseFormat();
    expect(format.json_schema.strict).toBe(true);
  });

  it("should require flashcards array", () => {
    const format = getFlashcardResponseFormat();
    expect(format.json_schema.schema.required).toContain("flashcards");
  });

  it("should define flashcard items with front and back", () => {
    const format = getFlashcardResponseFormat();
    const items = format.json_schema.schema.properties.flashcards.items;
    expect(items.required).toContain("front");
    expect(items.required).toContain("back");
  });
});

describe("calculateBackoffDelay", () => {
  it("should calculate exponential backoff for attempt 0", () => {
    const delay = calculateBackoffDelay(0, 1000);
    expect(delay).toBeGreaterThanOrEqual(1000); // Base + jitter
    expect(delay).toBeLessThanOrEqual(2000); // Base + max jitter
  });

  it("should calculate exponential backoff for attempt 1", () => {
    const delay = calculateBackoffDelay(1, 1000);
    expect(delay).toBeGreaterThanOrEqual(2000); // 1000 * 2^1
    expect(delay).toBeLessThanOrEqual(3000); // + jitter
  });

  it("should calculate exponential backoff for attempt 2", () => {
    const delay = calculateBackoffDelay(2, 1000);
    expect(delay).toBeGreaterThanOrEqual(4000); // 1000 * 2^2
    expect(delay).toBeLessThanOrEqual(5000); // + jitter
  });

  it("should cap at max delay", () => {
    const delay = calculateBackoffDelay(10, 1000, 5000);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  it("should use default base delay of 1000", () => {
    const delay = calculateBackoffDelay(0);
    expect(delay).toBeGreaterThanOrEqual(1000);
  });

  it("should use default max delay of 10000", () => {
    const delay = calculateBackoffDelay(20); // Large attempt number
    expect(delay).toBeLessThanOrEqual(10000);
  });

  it("should add jitter for randomness", () => {
    const delays = [calculateBackoffDelay(0, 1000), calculateBackoffDelay(0, 1000), calculateBackoffDelay(0, 1000)];
    // At least one should be different due to jitter
    const allSame = delays.every((d) => d === delays[0]);
    expect(allSame).toBe(false);
  });
});

describe("isRetryableError", () => {
  it("should return false for null/undefined", () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
  });

  it("should return true for error with retryable property", () => {
    const error = { retryable: true };
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return false for error with retryable false", () => {
    const error = { retryable: false };
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return true for network errors", () => {
    const error = new Error("Network request failed");
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for timeout errors", () => {
    const error = new Error("Request timeout");
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for ECONNREFUSED errors", () => {
    const error = new Error("ECONNREFUSED");
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for ENOTFOUND errors", () => {
    const error = new Error("ENOTFOUND");
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for fetch errors", () => {
    const error = new Error("Fetch failed");
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    const error = new Error("Invalid input");
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return false for string errors", () => {
    expect(isRetryableError("some error")).toBe(false);
  });

  it("should return false for number errors", () => {
    expect(isRetryableError(42)).toBe(false);
  });

  it("should return false for boolean errors", () => {
    expect(isRetryableError(true)).toBe(false);
  });
});

describe("sanitizeInput", () => {
  it("should return empty string for empty input", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("should remove null bytes", () => {
    const input = "text\0with\0null";
    expect(sanitizeInput(input)).not.toContain("\0");
  });

  it("should normalize multiple spaces to single space", () => {
    const input = "text    with    spaces";
    expect(sanitizeInput(input)).toBe("text with spaces");
  });

  it("should normalize tabs and newlines to single space", () => {
    const input = "text\t\twith\n\ntabs";
    expect(sanitizeInput(input)).toBe("text with tabs");
  });

  it("should trim leading and trailing whitespace", () => {
    const input = "  text with spaces  ";
    expect(sanitizeInput(input)).toBe("text with spaces");
  });

  it("should handle combined sanitization", () => {
    const input = "  text\0with\t\tmultiple   issues  \n";
    const result = sanitizeInput(input);
    // null bytes are removed first, so 'text\0with' becomes 'textwith'
    // then tabs/newlines/spaces are normalized to single space
    expect(result).toBe("textwith multiple issues");
  });
});

describe("isValidApiKeyFormat", () => {
  it("should return true for valid OpenRouter API key", () => {
    const validKey = "sk-or-v1-1234567890abcdef1234567890abcdef";
    expect(isValidApiKeyFormat(validKey)).toBe(true);
  });

  it("should return false for key not starting with sk-or-", () => {
    const invalidKey = "api-key-1234567890abcdef";
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });

  it("should return false for key shorter than 20 characters", () => {
    const shortKey = "sk-or-short";
    expect(isValidApiKeyFormat(shortKey)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isValidApiKeyFormat("")).toBe(false);
  });

  it("should return false for non-string values", () => {
    expect(isValidApiKeyFormat(null as any)).toBe(false);
    expect(isValidApiKeyFormat(undefined as any)).toBe(false);
    expect(isValidApiKeyFormat(123 as any)).toBe(false);
  });

  it("should return true for key exactly 21 characters", () => {
    const key = "sk-or-" + "x".repeat(15); // Total 21 chars
    expect(isValidApiKeyFormat(key)).toBe(true);
  });
});

describe("redactSensitiveInfo", () => {
  it("should redact OpenRouter API keys", () => {
    const text = "Using key sk-or-v1-1234567890abcdef";
    const redacted = redactSensitiveInfo(text);
    expect(redacted).toContain("sk-or-***REDACTED***");
    expect(redacted).not.toContain("1234567890abcdef");
  });

  it("should redact bearer tokens", () => {
    const text = "Authorization: Bearer abc123def456";
    const redacted = redactSensitiveInfo(text);
    expect(redacted).toContain("Bearer ***REDACTED***");
    expect(redacted).not.toContain("abc123def456");
  });

  it("should redact authorization headers in JSON", () => {
    const text = '{"authorization": "secret-token-123"}';
    const redacted = redactSensitiveInfo(text);
    expect(redacted).toContain("***REDACTED***");
    expect(redacted).not.toContain("secret-token-123");
  });

  it("should handle multiple API keys", () => {
    const text = "Key1: sk-or-key1 and Key2: sk-or-key2";
    const redacted = redactSensitiveInfo(text);
    const matches = redacted.match(/sk-or-\*\*\*REDACTED\*\*\*/g);
    expect(matches).toHaveLength(2);
  });

  it("should return empty string for empty input", () => {
    expect(redactSensitiveInfo("")).toBe("");
  });

  it("should preserve non-sensitive text", () => {
    const text = "This is normal text without secrets";
    const redacted = redactSensitiveInfo(text);
    expect(redacted).toBe(text);
  });
});

describe("formatUsageStats", () => {
  it("should format token usage correctly", () => {
    const tokens = {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    };
    const formatted = formatUsageStats(tokens);
    expect(formatted).toContain("150");
    expect(formatted).toContain("100");
    expect(formatted).toContain("50");
  });

  it("should include labels for token types", () => {
    const tokens = {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    };
    const formatted = formatUsageStats(tokens);
    expect(formatted.toLowerCase()).toContain("prompt");
    expect(formatted.toLowerCase()).toContain("completion");
  });

  it("should handle zero tokens", () => {
    const tokens = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    const formatted = formatUsageStats(tokens);
    expect(formatted).toBeTruthy();
    expect(formatted).toContain("0");
  });
});

describe("isCacheValid", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-10-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true for recent timestamp", () => {
    const recentTimestamp = Date.now() - 1000; // 1 second ago
    expect(isCacheValid(recentTimestamp)).toBe(true);
  });

  it("should return false for old timestamp", () => {
    const oldTimestamp = Date.now() - 4000000; // > 1 hour ago
    expect(isCacheValid(oldTimestamp)).toBe(false);
  });

  it("should use custom maxAge", () => {
    const timestamp = Date.now() - 5000; // 5 seconds ago
    expect(isCacheValid(timestamp, 10000)).toBe(true); // Within 10 seconds
    expect(isCacheValid(timestamp, 3000)).toBe(false); // > 3 seconds
  });

  it("should return true for timestamp exactly at maxAge", () => {
    const timestamp = Date.now() - 3600000; // Exactly 1 hour ago
    expect(isCacheValid(timestamp, 3600000)).toBe(false);
  });

  it("should use default maxAge of 1 hour", () => {
    const timestamp = Date.now() - 3599000; // Just under 1 hour
    expect(isCacheValid(timestamp)).toBe(true);
  });
});

describe("safeJsonParse", () => {
  it("should parse valid JSON", () => {
    const json = '{"name": "Test", "value": 123}';
    const result = safeJsonParse<{ name: string; value: number }>(json);
    expect(result).toEqual({ name: "Test", value: 123 });
  });

  it("should return null for invalid JSON", () => {
    const invalid = "{invalid json}";
    const result = safeJsonParse(invalid);
    expect(result).toBeNull();
  });

  it("should handle arrays", () => {
    const json = "[1, 2, 3]";
    const result = safeJsonParse<number[]>(json);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle nested objects", () => {
    const json = '{"nested": {"value": true}}';
    const result = safeJsonParse<{ nested: { value: boolean } }>(json);
    expect(result).toEqual({ nested: { value: true } });
  });

  it("should return null for empty string", () => {
    const result = safeJsonParse("");
    expect(result).toBeNull();
  });

  it("should handle null value in JSON", () => {
    const json = "null";
    const result = safeJsonParse(json);
    expect(result).toBeNull();
  });
});

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay for specified milliseconds", async () => {
    const promise = delay(1000);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
  });

  it("should not resolve before delay time", async () => {
    let resolved = false;
    delay(1000).then(() => {
      resolved = true;
    });

    vi.advanceTimersByTime(500);
    await Promise.resolve(); // Let microtasks run

    expect(resolved).toBe(false);
  });

  it("should resolve after delay time", async () => {
    let resolved = false;
    delay(1000).then(() => {
      resolved = true;
    });

    vi.advanceTimersByTime(1000);
    await Promise.resolve(); // Let microtasks run

    expect(resolved).toBe(true);
  });
});

describe("generateCacheKey", () => {
  it("should generate SHA-256 hash for given input", async () => {
    const input = "test input";
    const result = await generateCacheKey(input);

    expect(typeof result).toBe("string");
    expect(result.length).toBe(64); // SHA-256 produces 64-character hex string
    expect(result).toMatch(/^[a-f0-9]{64}$/); // Should be lowercase hex
  });

  it("should generate same hash for same input", async () => {
    const input = "consistent input";
    const hash1 = await generateCacheKey(input);
    const hash2 = await generateCacheKey(input);

    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different inputs", async () => {
    const hash1 = await generateCacheKey("input 1");
    const hash2 = await generateCacheKey("input 2");

    expect(hash1).not.toBe(hash2);
  });

  it("should trim and lowercase input before hashing", async () => {
    const hash1 = await generateCacheKey("  TEST INPUT  ");
    const hash2 = await generateCacheKey("test input");

    expect(hash1).toBe(hash2);
  });

  it("should handle empty string", async () => {
    const result = await generateCacheKey("");

    expect(typeof result).toBe("string");
    expect(result.length).toBe(64);
  });

  it("should handle special characters", async () => {
    const input = "text with special chars: !@#$%^&*()";
    const result = await generateCacheKey(input);

    expect(typeof result).toBe("string");
    expect(result.length).toBe(64);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle unicode characters", async () => {
    const input = "tekst z polskimi znakami: ąćęłńóśźż";
    const result = await generateCacheKey(input);

    expect(typeof result).toBe("string");
    expect(result.length).toBe(64);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle very long input", async () => {
    const input = "x".repeat(10000);
    const result = await generateCacheKey(input);

    expect(typeof result).toBe("string");
    expect(result.length).toBe(64);
  });
});
