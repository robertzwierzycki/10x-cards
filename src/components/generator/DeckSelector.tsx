/**
 * DeckSelector component
 * Dropdown for selecting target deck with option to create new deck
 */

import { useCallback } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DeckSelectorProps } from '@/types/generator.types';
import { useState } from 'react';

export function DeckSelector({
  decks,
  selectedDeckId,
  onSelect,
  isCreatingNew,
  onToggleCreateNew,
  newDeckName,
  onNewDeckNameChange,
}: DeckSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

  const handleSelectDeck = useCallback(
    (deckId: string) => {
      onSelect(deckId);
      setOpen(false);
    },
    [onSelect]
  );

  const handleCreateNew = useCallback(() => {
    onToggleCreateNew();
    setOpen(false);
  }, [onToggleCreateNew]);

  const handleNewDeckNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Limit to 255 characters
      if (value.length <= 255) {
        onNewDeckNameChange(value);
      }
    },
    [onNewDeckNameChange]
  );

  return (
    <div className="space-y-3">
      <Label>Wybierz talię docelową</Label>

      {!isCreatingNew ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedDeck ? selectedDeck.name : 'Wybierz talię...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Szukaj talii..." />
              <CommandList>
                <CommandEmpty>Nie znaleziono talii.</CommandEmpty>
                <CommandGroup>
                  {decks.map((deck) => (
                    <CommandItem
                      key={deck.id}
                      value={deck.name}
                      onSelect={() => handleSelectDeck(deck.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedDeckId === deck.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{deck.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {deck.flashcard_count} {deck.flashcard_count === 1 ? 'fiszka' : 'fiszek'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup>
                  <CommandItem onSelect={handleCreateNew} className="text-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Stwórz nową talię
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Nazwa nowej talii..."
            value={newDeckName}
            onChange={handleNewDeckNameChange}
            maxLength={255}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newDeckName.length}/255 znaków
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCreateNew}
              type="button"
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
