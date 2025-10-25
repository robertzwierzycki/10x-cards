/**
 * Generator View Type Definitions
 * Types specific to the AI Generator view component
 */

import type { DeckDTO } from "@/types";

// ============================================
// View State Types
// ============================================

/**
 * Possible view states for the generator flow
 */
export type ViewState = "input" | "loading" | "review" | "saving";

/**
 * Main generator state interface
 */
export interface GeneratorState {
  // View state
  viewState: ViewState;

  // Input data
  text: string;

  // Generated suggestions
  suggestions: EditableSuggestion[];
  truncated: boolean;

  // Deck selection
  selectedDeckId: string | null;
  isCreatingNewDeck: boolean;
  newDeckName: string;

  // Rate limiting
  rateLimitRemaining: number;
  rateLimitResetTime: number | null;

  // Loading and errors
  loadingStartTime: number | null;
  error: string | null;
}

// ============================================
// Suggestion Types
// ============================================

/**
 * Editable suggestion with temporary ID and soft-delete flag
 */
export interface EditableSuggestion {
  id: string; // Temporary ID for React key
  front: string;
  back: string;
  isDeleted: boolean; // Soft-delete flag
}

/**
 * Handlers for suggestion card interactions
 */
export interface SuggestionCardHandlers {
  onEdit: (id: string, field: "front" | "back", value: string) => void;
  onDelete: (id: string) => void;
}

// ============================================
// Component Props Types
// ============================================

/**
 * Props for AIGeneratorView main component
 */
export interface AIGeneratorViewProps {
  userId: string;
  initialDecks?: DeckDTO[];
}

/**
 * Props for TextInputSection component
 */
export interface TextInputSectionProps {
  text: string;
  onTextChange: (text: string) => void;
  disabled: boolean;
}

/**
 * Props for CharacterCounter component
 */
export interface CharacterCounterProps {
  current: number;
  max: number;
}

/**
 * Props for GenerateButton component
 */
export interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  rateLimitRemaining?: number;
  resetTime?: number | null;
}

/**
 * Props for LoadingOverlay component
 */
export interface LoadingOverlayProps {
  startTime: number;
}

/**
 * Props for SuggestionsReview component
 */
export interface SuggestionsReviewProps {
  suggestions: EditableSuggestion[];
  truncated: boolean;
  onSuggestionsUpdate: (suggestions: EditableSuggestion[]) => void;
  onSave: (deckId: string, newDeckName?: string) => Promise<void>;
  onCancel: () => void;
  onRegenerate: () => void;
  decks: DeckDTO[];
  selectedDeckId: string | null;
  isCreatingNewDeck: boolean;
  newDeckName: string;
  onDeckSelect: (deckId: string) => void;
  onToggleCreateNew: () => void;
  onNewDeckNameChange: (name: string) => void;
}

/**
 * Props for SuggestionCard component
 */
export interface SuggestionCardProps extends SuggestionCardHandlers {
  suggestion: EditableSuggestion;
  index: number;
}

/**
 * Props for DeckSelector component
 */
export interface DeckSelectorProps {
  decks: DeckDTO[];
  selectedDeckId: string | null;
  onSelect: (deckId: string) => void;
  isCreatingNew: boolean;
  onToggleCreateNew: () => void;
  newDeckName: string;
  onNewDeckNameChange: (name: string) => void;
}

/**
 * Props for ActionButtons component
 */
export interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  onRegenerate: () => void;
  canSave: boolean;
  isSaving: boolean;
}

// ============================================
// Store Types
// ============================================

/**
 * Zustand store interface for generator state management
 */
export interface GeneratorStore extends GeneratorState {
  // Actions
  setText: (text: string) => void;
  setSuggestions: (suggestions: EditableSuggestion[]) => void;
  updateSuggestion: (id: string, field: "front" | "back", value: string) => void;
  deleteSuggestion: (id: string) => void;
  setSelectedDeck: (deckId: string) => void;
  setNewDeckName: (name: string) => void;
  toggleCreateNewDeck: () => void;
  setViewState: (state: ViewState) => void;
  setRateLimit: (remaining: number, resetTime: number) => void;
  setError: (error: string | null) => void;
  setLoadingStartTime: (time: number | null) => void;
  setTruncated: (truncated: boolean) => void;
  reset: () => void;
}
