import { describe, it, expect } from 'vitest';

/**
 * Example Unit Test
 * Unit tests verify small, isolated pieces of code (functions, utilities, etc.)
 */

// Example utility function to test
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

describe('truncateText', () => {
  it('should return the original text if it is shorter than maxLength', () => {
    const result = truncateText('Hello', 10);
    expect(result).toBe('Hello');
  });

  it('should truncate text and add ellipsis if it exceeds maxLength', () => {
    const result = truncateText('This is a long text', 10);
    expect(result).toBe('This is a ...');
  });

  it('should handle exact length', () => {
    const result = truncateText('Exact', 5);
    expect(result).toBe('Exact');
  });

  it('should handle empty string', () => {
    const result = truncateText('', 10);
    expect(result).toBe('');
  });
});
