/**
 * AIGeneratorView - Main component for AI flashcard generator
 * Orchestrates the entire generation flow
 */

import { useEffect, useState } from 'react';
import { useGenerator } from '@/hooks/useGenerator';
import { fetchDecks } from '@/services/generator.service';
import { TextInputSection } from './TextInputSection';
import { GenerateButton } from './GenerateButton';
import { LoadingOverlay } from './LoadingOverlay';
import { SuggestionsReview } from './SuggestionsReview';
import { toast } from 'sonner';
import type { AIGeneratorViewProps } from '@/types/generator.types';
import type { DeckDTO } from '@/types';

export default function AIGeneratorView({ userId }: AIGeneratorViewProps) {
  const generator = useGenerator();
  const [decks, setDecks] = useState<DeckDTO[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);

  // Load decks on mount
  useEffect(() => {
    const loadDecks = async () => {
      try {
        const response = await fetchDecks();
        setDecks(response.data);
      } catch (error) {
        toast.error('Nie udało się załadować talii');
        console.error('Failed to load decks:', error);
      } finally {
        setIsLoadingDecks(false);
      }
    };

    loadDecks();
  }, []);

  // Handle text change
  const handleTextChange = (text: string) => {
    generator.setText(text);
  };

  // Handle generate
  const handleGenerate = async () => {
    await generator.handleGenerate();
  };

  // Handle save with toast notifications
  const handleSave = async (deckId: string, newDeckName?: string) => {
    try {
      const savedDeckId = await generator.handleSave(deckId, newDeckName);
      toast.success('Fiszki zostały zapisane!', {
        description: 'Możesz je znaleźć w wybranej talii.',
      });

      // Optionally redirect to deck view
      if (savedDeckId) {
        setTimeout(() => {
          window.location.href = `/decks/${savedDeckId}`;
        }, 1000);
      }
    } catch (error) {
      toast.error('Nie udało się zapisać fiszek', {
        description: generator.error || 'Spróbuj ponownie.',
      });
    }
  };

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (
      confirm(
        'Czy na pewno chcesz anulować? Wszystkie wygenerowane fiszki zostaną utracone.'
      )
    ) {
      generator.handleCancel();
      toast.info('Anulowano generowanie fiszek');
    }
  };

  // Handle regenerate with confirmation
  const handleRegenerate = () => {
    if (
      confirm(
        'Czy na pewno chcesz wygenerować nowe fiszki? Obecne sugestie zostaną utracone.'
      )
    ) {
      generator.handleRegenerate();
    }
  };

  // Show error toast when error changes
  useEffect(() => {
    if (generator.error) {
      toast.error('Wystąpił błąd', {
        description: generator.error,
      });
    }
  }, [generator.error]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">
          Dashboard
        </a>
        <span className="mx-2">/</span>
        <span className="text-foreground">Generator AI</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Generator fiszek AI
        </h1>
        <p className="text-muted-foreground">
          Wklej swoje notatki, a AI automatycznie wygeneruje z nich fiszki edukacyjne
        </p>
      </div>

      {/* Main content based on view state */}
      {generator.viewState === 'input' && (
        <div className="space-y-6">
          <TextInputSection
            text={generator.text}
            onTextChange={handleTextChange}
            disabled={isLoadingDecks}
          />

          <div className="flex justify-end">
            <GenerateButton
              onClick={handleGenerate}
              disabled={generator.text.trim().length === 0 || isLoadingDecks}
              isLoading={false}
              rateLimitRemaining={generator.rateLimit.remaining}
              resetTime={generator.rateLimit.resetTime}
            />
          </div>
        </div>
      )}

      {generator.viewState === 'loading' && generator.loadingStartTime && (
        <LoadingOverlay startTime={generator.loadingStartTime} />
      )}

      {generator.viewState === 'review' && (
        <SuggestionsReview
          suggestions={generator.suggestions}
          truncated={generator.truncated}
          onSuggestionsUpdate={generator.setSuggestions}
          onSave={handleSave}
          onCancel={handleCancel}
          onRegenerate={handleRegenerate}
          decks={decks}
          selectedDeckId={generator.selectedDeckId}
          isCreatingNewDeck={generator.isCreatingNewDeck}
          newDeckName={generator.newDeckName}
          onDeckSelect={generator.setSelectedDeck}
          onToggleCreateNew={generator.toggleCreateNewDeck}
          onNewDeckNameChange={generator.setNewDeckName}
        />
      )}

      {generator.viewState === 'saving' && generator.loadingStartTime && (
        <LoadingOverlay startTime={generator.loadingStartTime} />
      )}
    </div>
  );
}
