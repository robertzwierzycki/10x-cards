# Plan implementacji widoku Generator AI

## 1. Przegląd
Widok Generator AI to kluczowa funkcjonalność aplikacji 10xCards umożliwiająca automatyczne generowanie fiszek edukacyjnych z tekstu użytkownika przy użyciu modelu GPT-4o-mini. Widok obsługuje pełny przepływ od wprowadzenia tekstu, przez generowanie sugestii AI, edycję i przegląd, aż po zapis fiszek do wybranej talii.

## 2. Routing widoku
- **Ścieżka główna:** `/generate`
- **Typ strony:** Chroniona (wymaga zalogowania)
- **Plik:** `src/pages/generate.astro`
- **Middleware:** Weryfikacja sesji użytkownika przed dostępem

## 3. Struktura komponentów
```
AIGeneratorPage (Astro)
└── AIGeneratorView (React)
    ├── Breadcrumb
    ├── TextInputSection
    │   ├── Textarea
    │   └── CharacterCounter
    ├── GenerateButton / CountdownButton
    ├── LoadingOverlay (warunkowy)
    ├── TruncationAlert (warunkowy)
    ├── SuggestionsReview (warunkowy)
    │   ├── SuggestionsHeader
    │   ├── SuggestionsList
    │   │   └── SuggestionCard[]
    │   │       ├── EditableTextarea (front)
    │   │       ├── EditableTextarea (back)
    │   │       └── DeleteButton
    │   ├── DeckSelector
    │   │   └── NewDeckInput (warunkowy)
    │   └── ActionButtons
    └── Toaster (globalny)
```

## 4. Szczegóły komponentów

### AIGeneratorPage (Astro)
- **Opis:** Strona główna zawierająca layout i ładująca komponent React
- **Główne elementy:**
  - ProtectedLayout wrapper
  - Import React component z `client:load`
  - Przekazanie początkowych danych (user, decks)
- **Obsługiwane interakcje:** Brak (tylko render)
- **Walidacja:** Middleware sprawdza autoryzację
- **Typy:** Brak
- **Propsy:** Brak

### AIGeneratorView (React)
- **Opis:** Główny komponent React zarządzający całym przepływem generowania
- **Główne elementy:**
  - Container z max-width i padding
  - Zarządzanie stanami widoku (input/loading/review/saving)
  - Koordynacja komunikacji między komponentami dzieci
- **Obsługiwane interakcje:**
  - Orchestracja całego flow generowania
  - Zarządzanie przejściami między stanami
- **Walidacja:** Brak bezpośredniej
- **Typy:** `GeneratorState`, `ViewState`
- **Propsy:** `{ userId: string, initialDecks?: DeckDTO[] }`

### TextInputSection
- **Opis:** Sekcja wprowadzania tekstu z licznikiem znaków
- **Główne elementy:**
  - Textarea z placeholder "Wklej tutaj swoje notatki..."
  - CharacterCounter pod textarea
  - Label z instrukcją
- **Obsługiwane interakcje:**
  - onChange: Aktualizacja tekstu i licznika
  - onPaste: Obsługa wklejania długich tekstów
- **Walidacja:**
  - Minimum 1 znak (trim)
  - Maximum 1000 znaków (auto-obcięcie)
- **Typy:** `{ text: string, onTextChange: (text: string) => void, disabled: boolean }`
- **Propsy:** `text`, `onTextChange`, `disabled`

### CharacterCounter
- **Opis:** Wizualny licznik znaków z kolorowym kodowaniem
- **Główne elementy:**
  - Span z tekstem "X/1000"
  - Dynamiczne kolory (zielony/żółty/czerwony)
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Walidacja:** Brak
- **Typy:** `{ current: number, max: number }`
- **Propsy:** `current`, `max`

### GenerateButton / CountdownButton
- **Opis:** Przycisk generowania z obsługą rate limiting
- **Główne elementy:**
  - Button z tekstem "Generuj" lub countdown
  - Opcjonalny spinner podczas ładowania
  - Tooltip z informacją o limicie
- **Obsługiwane interakcje:**
  - onClick: Wywołanie generowania
- **Walidacja:**
  - Sprawdzenie czy tekst nie jest pusty
  - Sprawdzenie limitu żądań
- **Typy:** `{ onClick: () => void, disabled: boolean, isLoading: boolean, rateLimitRemaining?: number, resetTime?: number }`
- **Propsy:** `onClick`, `disabled`, `isLoading`, `rateLimitRemaining`, `resetTime`

### LoadingOverlay
- **Opis:** Nakładka podczas generowania z licznikiem czasu
- **Główne elementy:**
  - Spinner/progress ring
  - Komunikat "Generuję fiszki z AI..."
  - Licznik elapsed time
  - Warning po 4s ("Trochę to trwa...")
- **Obsługiwane interakcje:** Brak
- **Walidacja:** Brak
- **Typy:** `{ startTime: number }`
- **Propsy:** `startTime`

### SuggestionsReview
- **Opis:** Kontener do przeglądu i edycji wygenerowanych sugestii
- **Główne elementy:**
  - Header z licznikiem sugestii
  - Lista edytowalnych kart
  - Selektor talii
  - Przyciski akcji
- **Obsługiwane interakcje:**
  - Edycja sugestii
  - Usuwanie sugestii
  - Wybór talii docelowej
- **Walidacja:**
  - Każda fiszka 1-5000 znaków
  - Wymagany wybór talii przed zapisem
- **Typy:** `SuggestionsReviewProps` (zobacz sekcja 5)
- **Propsy:** `suggestions`, `onSuggestionsUpdate`, `onSave`, `onCancel`, `onRegenerate`

### SuggestionCard
- **Opis:** Pojedyncza edytowalna karta z sugestią fiszki
- **Główne elementy:**
  - Card wrapper
  - Dwa EditableTextarea (front i back)
  - Przycisk usuwania (X)
  - Separatory między polami
- **Obsługiwane interakcje:**
  - Edycja pola front
  - Edycja pola back
  - Usunięcie karty
- **Walidacja:**
  - Front: 1-5000 znaków
  - Back: 1-5000 znaków
- **Typy:** `EditableSuggestion & SuggestionCardHandlers`
- **Propsy:** `suggestion`, `onEdit`, `onDelete`, `index`

### DeckSelector
- **Opis:** Dropdown do wyboru talii docelowej z opcją tworzenia nowej
- **Główne elementy:**
  - Select/Combobox z listą talii
  - Opcja "➕ Stwórz nową talię"
  - Warunkowe pole input dla nazwy
- **Obsługiwane interakcje:**
  - onChange: Wybór istniejącej talii
  - onCreateNew: Przełączenie na tworzenie nowej
  - onNewDeckNameChange: Aktualizacja nazwy
- **Walidacja:**
  - Nazwa nowej talii: 1-255 znaków
  - Unikalna nazwa w kontekście użytkownika
- **Typy:** `DeckSelectorProps`
- **Propsy:** `decks`, `selectedDeckId`, `onSelect`, `isCreatingNew`, `newDeckName`, `onNewDeckNameChange`

### ActionButtons
- **Opis:** Grupa przycisków akcji na dole widoku przeglądu
- **Główne elementy:**
  - Przycisk "Zapisz do talii" (primary)
  - Przycisk "Anuluj" (secondary)
  - Przycisk "Generuj ponownie" (ghost)
- **Obsługiwane interakcje:**
  - onSave: Zapis fiszek
  - onCancel: Powrót do input (z potwierdzeniem)
  - onRegenerate: Ponowne generowanie (z potwierdzeniem)
- **Walidacja:**
  - Save disabled gdy brak talii lub pustą listę
- **Typy:** `ActionButtonsProps`
- **Propsy:** `onSave`, `onCancel`, `onRegenerate`, `canSave`

## 5. Typy

### Podstawowe typy stanu
```typescript
type ViewState = 'input' | 'loading' | 'review' | 'saving';

interface GeneratorState {
  // Stan widoku
  viewState: ViewState;

  // Dane wejściowe
  text: string;

  // Wygenerowane sugestie
  suggestions: EditableSuggestion[];
  truncated: boolean;

  // Wybór talii
  selectedDeckId: string | null;
  isCreatingNewDeck: boolean;
  newDeckName: string;

  // Rate limiting
  rateLimitRemaining: number;
  rateLimitResetTime: number | null;

  // Loading i błędy
  loadingStartTime: number | null;
  error: string | null;
}
```

### Rozszerzone typy dla sugestii
```typescript
interface EditableSuggestion {
  id: string; // Tymczasowe ID dla React key
  front: string;
  back: string;
  isDeleted: boolean; // Flaga soft-delete
}

interface SuggestionCardHandlers {
  onEdit: (id: string, field: 'front' | 'back', value: string) => void;
  onDelete: (id: string) => void;
}
```

### Typy props dla komponentów
```typescript
interface SuggestionsReviewProps {
  suggestions: EditableSuggestion[];
  truncated: boolean;
  onSuggestionsUpdate: (suggestions: EditableSuggestion[]) => void;
  onSave: (deckId: string, newDeckName?: string) => Promise<void>;
  onCancel: () => void;
  onRegenerate: () => void;
}

interface DeckSelectorProps {
  decks: DeckDTO[];
  selectedDeckId: string | null;
  onSelect: (deckId: string) => void;
  isCreatingNew: boolean;
  onToggleCreateNew: () => void;
  newDeckName: string;
  onNewDeckNameChange: (name: string) => void;
}

interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  onRegenerate: () => void;
  canSave: boolean;
  isSaving: boolean;
}
```

## 6. Zarządzanie stanem

### Store Zustand dla generatora
```typescript
// src/stores/generator.store.ts
interface GeneratorStore extends GeneratorState {
  // Actions
  setText: (text: string) => void;
  setSuggestions: (suggestions: EditableSuggestion[]) => void;
  updateSuggestion: (id: string, field: 'front' | 'back', value: string) => void;
  deleteSuggestion: (id: string) => void;
  setSelectedDeck: (deckId: string) => void;
  setNewDeckName: (name: string) => void;
  toggleCreateNewDeck: () => void;
  setViewState: (state: ViewState) => void;
  setRateLimit: (remaining: number, resetTime: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

### Custom Hooks

#### useGenerator
```typescript
// Główny hook łączący store z logiką biznesową
function useGenerator() {
  const store = useGeneratorStore();
  const { generateFlashcards, saveFlashcards } = useGeneratorAPI();

  const handleGenerate = async () => {
    // Logika generowania z obsługą błędów
  };

  const handleSave = async () => {
    // Logika zapisu z utworzeniem talii jeśli potrzeba
  };

  return {
    ...store,
    handleGenerate,
    handleSave,
  };
}
```

#### useRateLimit
```typescript
// Hook do śledzenia rate limit z localStorage
function useRateLimit(userId: string) {
  const [remaining, setRemaining] = useState(10);
  const [resetTime, setResetTime] = useState<number | null>(null);

  // Logika odczytu/zapisu do localStorage
  // Countdown timer logic

  return { remaining, resetTime, isLimited };
}
```

## 7. Integracja API

### Generowanie fiszek
```typescript
// POST /api/ai/generate
async function generateFlashcards(text: string): Promise<GenerateFlashcardsResponseDTO> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text } as GenerateFlashcardsCommand),
  });

  if (!response.ok) {
    throw new APIError(response.status, await response.json());
  }

  return await response.json() as GenerateFlashcardsResponseDTO;
}
```

### Pobieranie listy talii
```typescript
// GET /api/decks
async function fetchDecks(): Promise<DeckListDTO> {
  const response = await fetch('/api/decks?limit=100', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json() as DeckListDTO;
}
```

### Tworzenie nowej talii
```typescript
// POST /api/decks
async function createDeck(name: string): Promise<DeckDTO> {
  const response = await fetch('/api/decks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name } as CreateDeckCommand),
  });

  return await response.json() as DeckDTO;
}
```

### Zapisywanie fiszek
```typescript
// POST /api/flashcards/bulk
async function saveFlashcards(
  deckId: string,
  suggestions: EditableSuggestion[]
): Promise<BulkCreateFlashcardsResponseDTO> {
  const flashcards = suggestions
    .filter(s => !s.isDeleted)
    .map(s => ({
      front: s.front,
      back: s.back,
      is_ai_generated: true,
    }));

  const response = await fetch('/api/flashcards/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      deck_id: deckId,
      flashcards,
    } as BulkCreateFlashcardsCommand),
  });

  return await response.json() as BulkCreateFlashcardsResponseDTO;
}
```

## 8. Interakcje użytkownika

### Flow generowania
1. **Wprowadzenie tekstu**
   - Użytkownik wpisuje/wkleja tekst
   - Licznik aktualizuje się w czasie rzeczywistym
   - Kolor licznika zmienia się (zielony → żółty → czerwony)

2. **Kliknięcie "Generuj"**
   - Walidacja tekstu (nie pusty, max 1000 znaków)
   - Sprawdzenie rate limit
   - Przejście do stanu loading
   - Wywołanie API z timeout 5s

3. **Otrzymanie sugestii**
   - Przejście do stanu review
   - Wyświetlenie listy edytowalnych kart
   - Alert jeśli tekst był obcięty

### Flow edycji
4. **Edycja sugestii**
   - Kliknięcie w pole tekstowe
   - Natychmiastowa aktualizacja w state
   - Walidacja długości (max 5000 znaków)

5. **Usuwanie sugestii**
   - Kliknięcie X na karcie
   - Soft delete (oznaczenie jako usunięta)
   - Możliwość cofnięcia (opcjonalnie)

### Flow zapisu
6. **Wybór talii**
   - Rozwinięcie selektora
   - Wybór istniejącej lub "Stwórz nową"
   - Wprowadzenie nazwy dla nowej

7. **Zapisywanie**
   - Kliknięcie "Zapisz do talii"
   - Utworzenie nowej talii jeśli potrzeba
   - Zapis fiszek przez bulk API
   - Toast sukcesu i redirect

### Akcje alternatywne
8. **Anulowanie**
   - Dialog potwierdzenia
   - Reset do stanu input

9. **Ponowne generowanie**
   - Dialog potwierdzenia
   - Zachowanie tekstu, nowe wywołanie API

## 9. Warunki i walidacja

### Walidacja wprowadzanego tekstu
- **Warunek:** Tekst musi mieć 1-1000 znaków po trim()
- **Komponenty:** TextInputSection, GenerateButton
- **Wpływ:** Przycisk disabled gdy pusty, auto-obcięcie gdy > 1000

### Walidacja rate limit
- **Warunek:** Max 10 żądań na minutę
- **Komponenty:** GenerateButton → CountdownButton
- **Wpływ:** Przycisk pokazuje countdown, disabled na czas oczekiwania

### Walidacja sugestii
- **Warunek:** Każde pole 1-5000 znaków
- **Komponenty:** SuggestionCard
- **Wpływ:** Czerwona ramka przy przekroczeniu, zablokowany zapis

### Walidacja wyboru talii
- **Warunek:** Musi być wybrana talia lub podana nazwa nowej
- **Komponenty:** DeckSelector, ActionButtons
- **Wpływ:** Przycisk "Zapisz" disabled bez wyboru

### Walidacja nazwy nowej talii
- **Warunek:** 1-255 znaków, unikalna dla użytkownika
- **Komponenty:** DeckSelector
- **Wpływ:** Error message przy duplikacie (409 conflict)

## 10. Obsługa błędów

### Rate Limit Exceeded (429)
- **Obsługa:** Parsowanie retry_after z response
- **UI:** CountdownButton z timerem
- **Storage:** Zapis w localStorage dla persistence

### Service Unavailable (503)
- **Obsługa:** Toast error z komunikatem
- **UI:** Przycisk "Spróbuj ponownie"
- **Retry:** Exponential backoff (1s, 2s, 4s)

### Validation Error (400)
- **Obsługa:** Parsowanie details z response
- **UI:** Inline errors przy polach
- **Focus:** Automatyczny focus na pierwszym błędnym polu

### Timeout (> 5s)
- **Obsługa:** AbortController z timeout
- **UI:** Warning po 4s, error po 5s
- **Recovery:** Opcja retry lub cancel

### Empty Response
- **Obsługa:** Sprawdzenie suggestions.length
- **UI:** Alert informacyjny
- **Action:** Powrót do input z sugestią przeformułowania

### Network Error
- **Obsługa:** Try/catch na fetch
- **UI:** Toast z komunikatem o połączeniu
- **Recovery:** Automatyczne retry po 3s (opcjonalnie)

## 11. Kroki implementacji

### Faza 1: Przygotowanie
1. Utworzenie pliku `src/pages/generate.astro`
2. Konfiguracja protected route w middleware
3. Utworzenie struktury katalogów dla komponentów

### Faza 2: Store i typy
4. Implementacja `src/stores/generator.store.ts`
5. Definicja typów w `src/types/generator.types.ts`
6. Utworzenie schematów Zod dla walidacji

### Faza 3: Komponenty UI podstawowe
7. Implementacja TextInputSection z CharacterCounter
8. Utworzenie GenerateButton z obsługą rate limit
9. Implementacja LoadingOverlay z elapsed time

### Faza 4: Komponenty przeglądu
10. Utworzenie SuggestionCard z inline editing
11. Implementacja DeckSelector z opcją nowej talii
12. Dodanie ActionButtons z potwierdzeniami

### Faza 5: Główny komponent i integracja
13. Implementacja AIGeneratorView z orchestracją
14. Integracja z API (services/generator.service.ts)
15. Dodanie custom hooks (useGenerator, useRateLimit)

### Faza 6: Obsługa błędów i optymalizacja
16. Implementacja error handling dla wszystkich scenariuszy
17. Dodanie toast notifications (Sonner)
18. Optymalizacja performance (debouncing, memoization)

### Faza 7: Testing i refinement
19. Testy jednostkowe komponentów
20. Testy integracyjne flow generowania
21. Testy E2E całego przepływu
22. Dostosowanie UX na podstawie testów