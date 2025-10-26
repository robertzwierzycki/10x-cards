/**
 * Unit tests for AI Generator Validation Schemas
 *
 * Tests cover:
 * - textInputSchema - text input validation (1-1000 chars)
 * - flashcardContentSchema - flashcard content validation (1-5000 chars)
 * - deckNameSchema - deck name validation (1-255 chars)
 * - editableSuggestionSchema - suggestion object validation
 * - suggestionsArraySchema - array of suggestions validation
 */

import { describe, it, expect } from 'vitest';
import {
  textInputSchema,
  flashcardContentSchema,
  deckNameSchema,
  editableSuggestionSchema,
  suggestionsArraySchema,
} from './generator.schema';

describe('textInputSchema', () => {
  describe('Valid input', () => {
    it('should validate minimum length text', () => {
      const result = textInputSchema.safeParse('A');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('A');
      }
    });

    it('should validate typical text', () => {
      const text = 'This is a sample text for generating flashcards.';
      const result = textInputSchema.safeParse(text);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(text);
      }
    });

    it('should trim whitespace', () => {
      const result = textInputSchema.safeParse('  Text with spaces  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Text with spaces');
      }
    });

    it('should accept text with exactly 1000 characters', () => {
      const maxText = 'x'.repeat(1000);
      const result = textInputSchema.safeParse(maxText);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1000);
      }
    });
  });

  describe('Invalid input', () => {
    it('should reject empty string with Polish error', () => {
      const result = textInputSchema.safeParse('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Tekst nie może być pusty');
      }
    });

    it('should reject text exceeding 1000 characters with Polish error', () => {
      const tooLong = 'y'.repeat(1001);
      const result = textInputSchema.safeParse(tooLong);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Tekst nie może przekraczać 1000 znaków');
      }
    });

    it('should trim whitespace-only to empty and reject', () => {
      const result = textInputSchema.safeParse('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Tekst nie może być pusty');
      }
    });
  });
});

describe('flashcardContentSchema', () => {
  describe('Valid content', () => {
    it('should validate minimum length content', () => {
      const result = flashcardContentSchema.safeParse('Q');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Q');
      }
    });

    it('should validate typical flashcard content', () => {
      const content = 'What is the capital of France?';
      const result = flashcardContentSchema.safeParse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(content);
      }
    });

    it('should trim whitespace', () => {
      const result = flashcardContentSchema.safeParse('  Content  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Content');
      }
    });

    it('should accept content with exactly 5000 characters', () => {
      const maxContent = 'a'.repeat(5000);
      const result = flashcardContentSchema.safeParse(maxContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(5000);
      }
    });

    it('should handle multi-line content', () => {
      const multiLine = 'Line 1\nLine 2\nLine 3';
      const result = flashcardContentSchema.safeParse(multiLine);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(multiLine);
      }
    });
  });

  describe('Invalid content', () => {
    it('should reject empty string with Polish error', () => {
      const result = flashcardContentSchema.safeParse('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Pole nie może być puste');
      }
    });

    it('should reject content exceeding 5000 characters with Polish error', () => {
      const tooLong = 'b'.repeat(5001);
      const result = flashcardContentSchema.safeParse(tooLong);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Pole nie może przekraczać 5000 znaków');
      }
    });

    it('should trim whitespace-only to empty and reject', () => {
      const result = flashcardContentSchema.safeParse('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Pole nie może być puste');
      }
    });
  });
});

describe('deckNameSchema', () => {
  describe('Valid deck names', () => {
    it('should validate minimum length name', () => {
      const result = deckNameSchema.safeParse('A');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('A');
      }
    });

    it('should validate typical deck name', () => {
      const name = 'My Flashcards Deck';
      const result = deckNameSchema.safeParse(name);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(name);
      }
    });

    it('should trim whitespace', () => {
      const result = deckNameSchema.safeParse('  Deck Name  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Deck Name');
      }
    });

    it('should accept name with exactly 255 characters', () => {
      const maxName = 'x'.repeat(255);
      const result = deckNameSchema.safeParse(maxName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(255);
      }
    });

    it('should handle Polish characters', () => {
      const polishName = 'Talia z polskimi znakami: ąćęłńóśźż';
      const result = deckNameSchema.safeParse(polishName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(polishName);
      }
    });
  });

  describe('Invalid deck names', () => {
    it('should reject empty string with Polish error', () => {
      const result = deckNameSchema.safeParse('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Nazwa talii nie może być pusta');
      }
    });

    it('should reject name exceeding 255 characters with Polish error', () => {
      const tooLong = 'y'.repeat(256);
      const result = deckNameSchema.safeParse(tooLong);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Nazwa talii nie może przekraczać 255 znaków');
      }
    });

    it('should trim whitespace-only to empty and reject', () => {
      const result = deckNameSchema.safeParse('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Nazwa talii nie może być pusta');
      }
    });
  });
});

describe('editableSuggestionSchema', () => {
  describe('Valid suggestions', () => {
    it('should validate complete suggestion object', () => {
      const suggestion = {
        id: 'suggestion-1',
        front: 'Question text',
        back: 'Answer text',
        isDeleted: false,
      };
      const result = editableSuggestionSchema.safeParse(suggestion);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(suggestion);
      }
    });

    it('should validate suggestion with isDeleted true', () => {
      const suggestion = {
        id: 'suggestion-2',
        front: 'Question',
        back: 'Answer',
        isDeleted: true,
      };
      const result = editableSuggestionSchema.safeParse(suggestion);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDeleted).toBe(true);
      }
    });

    it('should trim whitespace from front and back', () => {
      const suggestion = {
        id: 'suggestion-3',
        front: '  Question with spaces  ',
        back: '  Answer with spaces  ',
        isDeleted: false,
      };
      const result = editableSuggestionSchema.safeParse(suggestion);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe('Question with spaces');
        expect(result.data.back).toBe('Answer with spaces');
      }
    });

    it('should validate with UUID as id', () => {
      const suggestion = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: 'Q',
        back: 'A',
        isDeleted: false,
      };
      const result = editableSuggestionSchema.safeParse(suggestion);

      expect(result.success).toBe(true);
    });
  });

  describe('Invalid suggestions', () => {
    it('should reject missing id field', () => {
      const result = editableSuggestionSchema.safeParse({
        front: 'Question',
        back: 'Answer',
        isDeleted: false,
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty front', () => {
      const result = editableSuggestionSchema.safeParse({
        id: 'suggestion-1',
        front: '',
        back: 'Answer',
        isDeleted: false,
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty back', () => {
      const result = editableSuggestionSchema.safeParse({
        id: 'suggestion-1',
        front: 'Question',
        back: '',
        isDeleted: false,
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing isDeleted field', () => {
      const result = editableSuggestionSchema.safeParse({
        id: 'suggestion-1',
        front: 'Question',
        back: 'Answer',
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-boolean isDeleted', () => {
      const result = editableSuggestionSchema.safeParse({
        id: 'suggestion-1',
        front: 'Question',
        back: 'Answer',
        isDeleted: 'false',
      });

      expect(result.success).toBe(false);
    });

    it('should reject front exceeding 5000 characters', () => {
      const result = editableSuggestionSchema.safeParse({
        id: 'suggestion-1',
        front: 'x'.repeat(5001),
        back: 'Answer',
        isDeleted: false,
      });

      expect(result.success).toBe(false);
    });

    it('should reject back exceeding 5000 characters', () => {
      const result = editableSuggestionSchema.safeParse({
        id: 'suggestion-1',
        front: 'Question',
        back: 'y'.repeat(5001),
        isDeleted: false,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('suggestionsArraySchema', () => {
  describe('Valid arrays', () => {
    it('should validate array with single suggestion', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          front: 'Question 1',
          back: 'Answer 1',
          isDeleted: false,
        },
      ];
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should validate array with multiple suggestions', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          front: 'Question 1',
          back: 'Answer 1',
          isDeleted: false,
        },
        {
          id: 'suggestion-2',
          front: 'Question 2',
          back: 'Answer 2',
          isDeleted: false,
        },
        {
          id: 'suggestion-3',
          front: 'Question 3',
          back: 'Answer 3',
          isDeleted: true,
        },
      ];
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
      }
    });

    it('should validate array with mix of deleted and non-deleted', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          front: 'Q1',
          back: 'A1',
          isDeleted: true,
        },
        {
          id: 'suggestion-2',
          front: 'Q2',
          back: 'A2',
          isDeleted: false,
        },
      ];
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(true);
    });
  });

  describe('Invalid arrays', () => {
    it('should reject empty array with Polish error', () => {
      const result = suggestionsArraySchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Musisz mieć przynajmniej jedną fiszkę');
      }
    });

    it('should reject array with invalid suggestion', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          front: '', // Invalid empty front
          back: 'Answer',
          isDeleted: false,
        },
      ];
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(false);
    });

    it('should reject array with partial suggestion objects', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          front: 'Question',
          // Missing back and isDeleted
        },
      ];
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(false);
    });

    it('should reject non-array value', () => {
      const result = suggestionsArraySchema.safeParse({
        id: 'suggestion-1',
        front: 'Question',
        back: 'Answer',
        isDeleted: false,
      });

      expect(result.success).toBe(false);
    });

    it('should reject null', () => {
      const result = suggestionsArraySchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it('should reject undefined', () => {
      const result = suggestionsArraySchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should validate array with 10 suggestions', () => {
      const suggestions = Array.from({ length: 10 }, (_, i) => ({
        id: `suggestion-${i}`,
        front: `Question ${i}`,
        back: `Answer ${i}`,
        isDeleted: false,
      }));
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(10);
      }
    });

    it('should validate array with all deleted suggestions', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          front: 'Q1',
          back: 'A1',
          isDeleted: true,
        },
        {
          id: 'suggestion-2',
          front: 'Q2',
          back: 'A2',
          isDeleted: true,
        },
      ];
      const result = suggestionsArraySchema.safeParse(suggestions);

      expect(result.success).toBe(true);
    });
  });
});
