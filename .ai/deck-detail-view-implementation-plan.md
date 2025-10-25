# Plan implementacji widoku Szczegółów Talii

## 1. Przegląd

Widok Szczegółów Talii to kluczowy ekran aplikacji umożliwiający zarządzanie konkretną talią fiszek. Użytkownik może przeglądać wszystkie fiszki w talii, edytować nazwę talii, dodawać/edytować/usuwać fiszki oraz rozpocząć sesję nauki. Widok obsługuje paginację dla dużej liczby fiszek i jest w pełni responsywny.

## 2. Routing widoku

- **Ścieżka główna**: `/decks/[id]`
- **Parametr dynamiczny**: `id` (UUID talii)
- **Plik**: `src/pages/decks/[id].astro`
- **Tryb renderowania**: SSR (export const prerender = false)

## 3. Struktura komponentów

```
DeckDetailPage (Astro)
├── DeckDetailContent (React, client:load)
    ├── DeckDetailSkeleton
    ├── DeckDetailError
    └── DeckDetail
        ├── DeckHeader
        │   ├── Breadcrumb
        │   ├── EditableText
        │   └── DeckStats
        ├── DeckActions
        ├── FlashcardSection
        │   ├── FlashcardTable (desktop)
        │   ├── FlashcardGrid (mobile)
        │   └── LoadMoreButton
        ├── FlashcardEditorDialog
        └── DeleteConfirmDialog
```

## 4. Szczegóły komponentów

### DeckDetailPage (Astro)
- **Opis**: Główny komponent strony, odpowiedzialny za layout i inicjalizację
- **Główne elementy**: Layout wrapper, meta tags, hydration React component
- **Obsługiwane interakcje**: Brak (SSR)
- **Obsługiwana walidacja**: Walidacja UUID w parametrze URL
- **Typy**: Brak
- **Propsy**: Brak

### DeckDetailContent (React)
- **Opis**: Główny kontener React zarządzający stanem i logiką widoku
- **Główne elementy**: Conditional rendering (loading/error/content), dialogi
- **Obsługiwane interakcje**: Zarządzanie stanem dialogów
- **Obsługiwana walidacja**: Brak
- **Typy**: `DeckDetailViewModel`, `ErrorState`
- **Propsy**: `{ deckId: string }`

### DeckHeader
- **Opis**: Nagłówek z breadcrumb, nazwą talii i statystykami
- **Główne elementy**: Breadcrumb, EditableText, Badge (statystyki)
- **Obsługiwane interakcje**: Kliknięcie na nazwę (edycja), nawigacja breadcrumb
- **Obsługiwana walidacja**: Brak
- **Typy**: `DeckDTO`, `StudyStatsDTO`
- **Propsy**:
```typescript
interface DeckHeaderProps {
  deck: DeckDTO;
  stats: StudyStatsDTO | null;
  onNameUpdate: (name: string) => Promise<void>;
}
```

### EditableText
- **Opis**: Komponent inline edycji nazwy talii
- **Główne elementy**: Text/Input toggle, ikony edit/save/cancel
- **Obsługiwane interakcje**: Click to edit, Enter to save, Esc to cancel
- **Obsługiwana walidacja**:
  - Min 1 znak, max 255 znaków
  - Trim whitespace przed zapisem
  - Obsługa 409 (duplikat nazwy)
- **Typy**: `DeckNameFormData`
- **Propsy**:
```typescript
interface EditableTextProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}
```

### DeckActions
- **Opis**: Grupa przycisków akcji dla talii
- **Główne elementy**: Button components (Rozpocznij naukę, Dodaj fiszkę, Wygeneruj z AI, Usuń talię)
- **Obsługiwane interakcje**: Click events na każdym przycisku
- **Obsługiwana walidacja**: Disabled state dla "Rozpocznij naukę" gdy brak fiszek lub cards_due_today = 0
- **Typy**: `StudyStatsDTO`
- **Propsy**:
```typescript
interface DeckActionsProps {
  deckId: string;
  cardsDueToday: number;
  hasFlashcards: boolean;
  onAddFlashcard: () => void;
  onDeleteDeck: () => void;
}
```

### FlashcardSection
- **Opis**: Sekcja wyświetlająca listę fiszek z paginacją
- **Główne elementy**: Table/Grid (responsywne), EmptyState, LoadMoreButton
- **Obsługiwane interakcje**: Scroll/click dla paginacji, click na fiszkę
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardDTO[]`, `PaginationDTO`
- **Propsy**:
```typescript
interface FlashcardSectionProps {
  flashcards: FlashcardDTO[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}
```

### FlashcardEditorDialog
- **Opis**: Dialog do tworzenia/edycji fiszki
- **Główne elementy**: Dialog, Form z Textarea (front/back), przyciski Save/Cancel
- **Obsługiwane interakcje**: Submit form, cancel, walidacja w czasie rzeczywistym
- **Obsługiwana walidacja**:
  - Front: 1-5000 znaków, non-empty po trim
  - Back: 1-5000 znaków, non-empty po trim
  - Wyświetlanie licznika znaków
- **Typy**: `FlashcardFormData`, `CreateFlashcardCommand`, `UpdateFlashcardCommand`
- **Propsy**:
```typescript
interface FlashcardEditorDialogProps {
  isOpen: boolean;
  flashcard?: FlashcardDTO; // undefined = create mode
  onClose: () => void;
  onSave: (data: FlashcardFormData) => Promise<void>;
}
```

### DeleteConfirmDialog
- **Opis**: Dialog potwierdzenia usunięcia talii lub fiszki
- **Główne elementy**: Dialog, Alert (warning), Checkbox (potwierdzenie), przyciski
- **Obsługiwane interakcje**: Checkbox toggle, confirm/cancel
- **Obsługiwana walidacja**: Przycisk "Usuń" disabled bez zaznaczenia checkbox
- **Typy**: Brak
- **Propsy**:
```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemCount?: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

## 5. Typy

### ViewModels i interfejsy:

```typescript
// ViewModel główny
interface DeckDetailViewModel {
  deck: DeckWithFlashcardsDTO | null;
  stats: StudyStatsDTO | null;
  flashcards: FlashcardDTO[];
  totalFlashcards: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isUpdating: boolean;
  error: ErrorState | null;
  currentPage: number;
  hasMore: boolean;
}

// Stan błędu
interface ErrorState {
  code: 403 | 404 | 500;
  message: string;
  retry?: () => void;
}

// Dane formularzy
interface FlashcardFormData {
  front: string;
  back: string;
}

interface DeckNameFormData {
  name: string;
}

// Opcje dialogów
interface DialogState {
  flashcardEditor: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    flashcard?: FlashcardDTO;
  };
  deleteConfirm: {
    isOpen: boolean;
    target: 'deck' | 'flashcard';
    item?: FlashcardDTO;
  };
}
```

### Schematy walidacji Zod:

```typescript
const deckNameSchema = z.object({
  name: z.string()
    .min(1, "Nazwa talii jest wymagana")
    .max(255, "Nazwa może mieć maksymalnie 255 znaków")
    .trim()
});

const flashcardSchema = z.object({
  front: z.string()
    .min(1, "Przód fiszki jest wymagany")
    .max(5000, "Przód może mieć maksymalnie 5000 znaków")
    .trim(),
  back: z.string()
    .min(1, "Tył fiszki jest wymagany")
    .max(5000, "Tył może mieć maksymalnie 5000 znaków")
    .trim()
});
```

## 6. Zarządzanie stanem

### Custom Hook - useDeckDetail:

```typescript
function useDeckDetail(deckId: string) {
  // Zustand store
  const { deck, setDeck, flashcards, addFlashcard, updateFlashcard, removeFlashcard } = useDeckStore();

  // Local state
  const [stats, setStats] = useState<StudyStatsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Metody
  const fetchDeck = async () => { /* ... */ };
  const fetchStats = async () => { /* ... */ };
  const loadMoreFlashcards = async () => { /* ... */ };
  const updateDeckName = async (name: string) => { /* ... */ };
  const deleteDeck = async () => { /* ... */ };
  const createFlashcard = async (data: FlashcardFormData) => { /* ... */ };
  const updateFlashcardContent = async (id: string, data: FlashcardFormData) => { /* ... */ };
  const deleteFlashcard = async (id: string) => { /* ... */ };

  return {
    deck,
    stats,
    flashcards,
    isLoading,
    error,
    // ... pozostałe wartości i metody
  };
}
```

### Zustand Store:

```typescript
interface DeckStore {
  decks: Map<string, DeckWithFlashcardsDTO>;
  flashcards: Map<string, FlashcardDTO[]>;

  setDeck: (deck: DeckWithFlashcardsDTO) => void;
  updateDeck: (id: string, updates: Partial<DeckDTO>) => void;
  removeDeck: (id: string) => void;

  setFlashcards: (deckId: string, flashcards: FlashcardDTO[]) => void;
  addFlashcard: (deckId: string, flashcard: FlashcardDTO) => void;
  updateFlashcard: (flashcard: FlashcardDTO) => void;
  removeFlashcard: (deckId: string, flashcardId: string) => void;
}
```

## 7. Integracja API

### Endpointy i typy:

```typescript
// Pobranie talii z fiszkami
GET /api/decks/:id
Response: DeckWithFlashcardsDTO

// Pobranie dodatkowych fiszek (paginacja)
GET /api/decks/:deckId/flashcards?page=2&limit=50
Response: FlashcardListDTO

// Pobranie statystyk
GET /api/study/stats/:deckId
Response: StudyStatsDTO

// Aktualizacja nazwy talii
PUT /api/decks/:id
Request: UpdateDeckCommand { name: string }
Response: DeckDTO

// Usunięcie talii
DELETE /api/decks/:id
Response: 204 No Content

// Dodanie fiszki
POST /api/decks/:deckId/flashcards
Request: CreateFlashcardCommand { front: string, back: string }
Response: FlashcardDTO

// Edycja fiszki
PUT /api/flashcards/:id
Request: UpdateFlashcardCommand { front: string, back: string }
Response: FlashcardDTO

// Usunięcie fiszki
DELETE /api/flashcards/:id
Response: 204 No Content
```

## 8. Interakcje użytkownika

### Scenariusze interakcji:

1. **Edycja nazwy talii**:
   - Kliknięcie na nazwę → pojawia się pole input
   - Wpisanie nowej nazwy → walidacja w czasie rzeczywistym
   - Enter/blur → zapisanie (PUT /api/decks/:id)
   - Esc → anulowanie edycji
   - Błąd 409 → wyświetlenie toast "Talia o tej nazwie już istnieje"

2. **Dodawanie fiszki**:
   - Kliknięcie "Dodaj fiszkę" → otwarcie dialogu
   - Wypełnienie pól → walidacja (licznik znaków)
   - Zapisanie → POST /api/decks/:deckId/flashcards
   - Optimistic update → natychmiastowe dodanie do listy

3. **Edycja fiszki**:
   - Kliknięcie ikony edycji → otwarcie dialogu z danymi
   - Modyfikacja → walidacja
   - Zapisanie → PUT /api/flashcards/:id

4. **Usuwanie**:
   - Kliknięcie "Usuń" → dialog potwierdzenia
   - Checkbox "Rozumiem" → aktywacja przycisku
   - Potwierdzenie → DELETE request
   - Sukces → redirect (talia) lub usunięcie z listy (fiszka)

5. **Rozpoczęcie nauki**:
   - Sprawdzenie cards_due_today > 0
   - Kliknięcie → redirect do /study/[deckId]
   - Disabled z tooltip gdy brak fiszek

6. **Paginacja**:
   - Scroll do końca listy lub kliknięcie "Załaduj więcej"
   - GET /api/decks/:deckId/flashcards?page=X
   - Dodanie do istniejącej listy

## 9. Warunki i walidacja

### Walidacja po stronie klienta:

1. **Nazwa talii (EditableText)**:
   - Sprawdzenie długości: 1-255 znaków
   - Trim whitespace przed wysłaniem
   - Blokada przycisku Save gdy pusta
   - Real-time feedback (czerwona ramka przy błędzie)

2. **Fiszka (FlashcardEditorDialog)**:
   - Front: 1-5000 znaków (licznik: "150/5000")
   - Back: 1-5000 znaków (licznik: "230/5000")
   - Oba pola wymagane
   - Przycisk Save disabled gdy walidacja nie przechodzi

3. **Przycisk "Rozpocznij naukę" (DeckActions)**:
   - Disabled gdy `flashcards.length === 0`
   - Disabled gdy `stats.cards_due_today === 0`
   - Tooltip z wyjaśnieniem: "Brak fiszek do powtórki dzisiaj"

4. **Dialog usuwania (DeleteConfirmDialog)**:
   - Checkbox "Rozumiem" musi być zaznaczony
   - Przycisk "Usuń" disabled bez checkboxa
   - Wyświetlanie liczby fiszek do usunięcia

### Walidacja po stronie serwera (obsługa odpowiedzi):

1. **409 Conflict** (duplikat nazwy):
   - Toast error: "Talia o tej nazwie już istnieje"
   - Przywrócenie poprzedniej wartości

2. **403 Forbidden** (brak dostępu):
   - Przekierowanie do dashboardu
   - Toast: "Nie masz dostępu do tej talii"

3. **404 Not Found**:
   - Wyświetlenie ErrorState
   - Link "Wróć do listy talii"

## 10. Obsługa błędów

### Strategia obsługi błędów:

1. **Błędy ładowania początkowego**:
   - 404: "Talia nie została znaleziona" + link powrotu
   - 403: "Nie masz dostępu do tej talii" + redirect
   - 500/Network: "Wystąpił błąd" + przycisk retry

2. **Błędy operacji CRUD**:
   - Toast notifications z opisem błędu
   - Rollback optimistic updates
   - Retry mechanism dla błędów sieciowych

3. **Błędy walidacji**:
   - Inline error messages pod polami
   - Zablokowanie submit do poprawy
   - Zachowanie wprowadzonych danych

4. **Rate limiting**:
   - 429: "Zbyt wiele żądań. Spróbuj za chwilę"
   - Exponential backoff dla retry

### Error Boundary:

```typescript
class DeckDetailErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    // Log to Sentry/monitoring
    console.error('DeckDetail error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - `src/pages/decks/[id].astro` - strona główna
   - `src/components/deck-detail/` - folder na komponenty
   - `src/stores/deck.store.ts` - Zustand store
   - `src/hooks/useDeckDetail.ts` - custom hook

2. **Implementacja Zustand store**:
   - Definicja interfejsu DeckStore
   - Metody CRUD dla talii i fiszek
   - Integracja z devtools

3. **Stworzenie custom hook useDeckDetail**:
   - Logika pobierania danych
   - Obsługa paginacji
   - Metody operacji CRUD
   - Error handling

4. **Implementacja komponentów podstawowych**:
   - DeckDetailSkeleton (loading state)
   - DeckDetailError (error states)
   - EmptyState (brak fiszek)

5. **Implementacja DeckHeader**:
   - Breadcrumb navigation
   - EditableText dla nazwy
   - DeckStats component

6. **Implementacja DeckActions**:
   - Przyciski z odpowiednimi stanami
   - Integracja z router (navigation)
   - Tooltips dla disabled states

7. **Implementacja FlashcardSection**:
   - FlashcardTable (desktop)
   - FlashcardGrid (mobile)
   - Responsywność z Tailwind
   - LoadMoreButton z infinite scroll

8. **Implementacja dialogów**:
   - FlashcardEditorDialog z React Hook Form
   - DeleteConfirmDialog z checkbox
   - Integracja z shadcn/ui Dialog

9. **Walidacja z Zod**:
   - Schematy dla wszystkich formularzy
   - Integracja z React Hook Form
   - Custom error messages

10. **Integracja z API**:
    - Funkcje pomocnicze dla każdego endpointu
    - Typy żądań i odpowiedzi
    - Error handling i retry logic

11. **Optymalizacja**:
    - Optimistic updates dla lepszego UX
    - Debouncing dla inline edit
    - Lazy loading dla dużych list

12. **Testy**:
    - Unit testy dla logiki biznesowej
    - Integration testy dla API calls
    - E2E testy głównych przepływów

13. **Dokumentacja**:
    - JSDoc dla komponentów
    - README z przykładami użycia
    - Storybook stories (opcjonalnie)