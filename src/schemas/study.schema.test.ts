/**
 * Unit tests for Study Mode Validation Schemas
 *
 * Tests cover:
 * - studySessionParamsSchema - deck ID validation
 * - studySessionQuerySchema - limit parameter validation
 * - submitReviewSchema - review submission validation
 * - studyStatsParamsSchema - stats deck ID validation
 */

import { describe, it, expect } from 'vitest';
import {
  studySessionParamsSchema,
  studySessionQuerySchema,
  submitReviewSchema,
  studyStatsParamsSchema,
} from './study.schema';

describe('studySessionParamsSchema', () => {
  it('should validate valid UUID v4 deck ID', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = studySessionParamsSchema.safeParse({ deckId: validUUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deckId).toBe(validUUID);
    }
  });

  it('should reject invalid UUID format', () => {
    const result = studySessionParamsSchema.safeParse({ deckId: 'not-a-uuid' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid deck ID format');
    }
  });

  it('should reject empty string', () => {
    const result = studySessionParamsSchema.safeParse({ deckId: '' });

    expect(result.success).toBe(false);
  });

  it('should reject missing deckId field', () => {
    const result = studySessionParamsSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('should reject numeric ID', () => {
    const result = studySessionParamsSchema.safeParse({ deckId: 123 });

    expect(result.success).toBe(false);
  });
});

describe('studySessionQuerySchema', () => {
  it('should apply default limit when not provided', () => {
    const result = studySessionQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('should validate and coerce valid limit number', () => {
    const result = studySessionQuerySchema.safeParse({ limit: '10' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(typeof result.data.limit).toBe('number');
    }
  });

  it('should accept limit of 1 (minimum)', () => {
    const result = studySessionQuerySchema.safeParse({ limit: 1 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(1);
    }
  });

  it('should accept limit of 50 (maximum)', () => {
    const result = studySessionQuerySchema.safeParse({ limit: 50 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject limit less than 1', () => {
    const result = studySessionQuerySchema.safeParse({ limit: 0 });

    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const result = studySessionQuerySchema.safeParse({ limit: -5 });

    expect(result.success).toBe(false);
  });

  it('should reject limit greater than 50', () => {
    const result = studySessionQuerySchema.safeParse({ limit: 51 });

    expect(result.success).toBe(false);
  });

  it('should reject limit of 100', () => {
    const result = studySessionQuerySchema.safeParse({ limit: 100 });

    expect(result.success).toBe(false);
  });

  it('should coerce string "25" to number 25', () => {
    const result = studySessionQuerySchema.safeParse({ limit: '25' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it('should reject non-numeric string', () => {
    const result = studySessionQuerySchema.safeParse({ limit: 'abc' });

    expect(result.success).toBe(false);
  });
});

describe('submitReviewSchema', () => {
  const validStudyRecordId = '123e4567-e89b-12d3-a456-426614174000';
  const validFlashcardId = '987fcdeb-51a2-43d7-9876-543210fedcba';

  describe('Valid review submissions', () => {
    it('should validate review with "again" rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 'again',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe('again');
      }
    });

    it('should validate review with "good" rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 'good',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe('good');
      }
    });

    it('should validate review with "easy" rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 'easy',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe('easy');
      }
    });

    it('should validate complete valid review object', () => {
      const review = {
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 'good' as const,
      };
      const result = submitReviewSchema.safeParse(review);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(review);
      }
    });
  });

  describe('Invalid study_record_id', () => {
    it('should reject invalid study_record_id UUID', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: 'invalid-uuid',
        flashcard_id: validFlashcardId,
        rating: 'good',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid study record ID format');
      }
    });

    it('should reject empty study_record_id', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: '',
        flashcard_id: validFlashcardId,
        rating: 'good',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing study_record_id', () => {
      const result = submitReviewSchema.safeParse({
        flashcard_id: validFlashcardId,
        rating: 'good',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid flashcard_id', () => {
    it('should reject invalid flashcard_id UUID', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: 'not-a-uuid',
        rating: 'good',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid flashcard ID format');
      }
    });

    it('should reject empty flashcard_id', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: '',
        rating: 'good',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing flashcard_id', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        rating: 'good',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Invalid rating', () => {
    it('should reject invalid rating value', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 'hard',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Rating must be 'again', 'good', or 'easy'");
      }
    });

    it('should reject numeric rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
      });

      expect(result.success).toBe(false);
    });

    it('should reject uppercase rating', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: 'GOOD',
      });

      expect(result.success).toBe(false);
    });

    it('should reject rating with extra spaces', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: validStudyRecordId,
        flashcard_id: validFlashcardId,
        rating: ' good ',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Multiple invalid fields', () => {
    it('should report all validation errors', () => {
      const result = submitReviewSchema.safeParse({
        study_record_id: 'invalid',
        flashcard_id: 'invalid',
        rating: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(3);
      }
    });

    it('should reject completely empty object', () => {
      const result = submitReviewSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(3);
      }
    });
  });
});

describe('studyStatsParamsSchema', () => {
  it('should validate valid UUID v4 deck ID', () => {
    const validUUID = 'abcd1234-5678-90ef-ghij-klmnopqrstuv';
    // Actually this won't pass - let me use a real UUID
    const realUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = studyStatsParamsSchema.safeParse({ deckId: realUUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deckId).toBe(realUUID);
    }
  });

  it('should reject invalid UUID format', () => {
    const result = studyStatsParamsSchema.safeParse({ deckId: 'invalid-uuid-format' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid deck ID format');
    }
  });

  it('should reject empty deckId', () => {
    const result = studyStatsParamsSchema.safeParse({ deckId: '' });

    expect(result.success).toBe(false);
  });

  it('should reject missing deckId field', () => {
    const result = studyStatsParamsSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('should reject null deckId', () => {
    const result = studyStatsParamsSchema.safeParse({ deckId: null });

    expect(result.success).toBe(false);
  });

  it('should reject numeric deckId', () => {
    const result = studyStatsParamsSchema.safeParse({ deckId: 12345 });

    expect(result.success).toBe(false);
  });
});
