# Plan implementacji widoku Dashboard / Lista Talii

## 1. Przegląd

Widok Dashboard (Lista Talii) jest głównym ekranem aplikacji po zalogowaniu, dostępnym pod ścieżką `/`. Umożliwia użytkownikom przeglądanie wszystkich swoich talii fiszek, tworzenie nowych talii, edycję nazw istniejących talii oraz ich usuwanie. Widok wspiera wyszukiwanie po nazwie (client-side), sortowanie według różnych kryteriów oraz paginację danych.

Jest to kluczowy punkt nawigacyjny aplikacji - każda karta talii jest klikalnym linkiem prowadzącym do widoku szczegółów talii (`/decks/[id]`), gdzie użytkownik może zarządzać fiszkami i rozpocząć sesję nauki.

## 2. Routing widoku

**Ścieżka:** `/` (root, strona główna po zalogowaniu)

**Plik:** `src/pages/index.astro`

**Wymagania:**
- Chroniony middleware'em - wymaga aktywnej sesji użytkownika
- Przekierowanie do `/login` jeśli użytkownik niezalogowany
- Przekierowanie do `/generate` dla nowych użytkowników (FTUE - First Time User Experience) zgodnie z US-027

## 3. Struktura komponentów

Hierarchia komponentów dla widoku Dashboard:

```
DashboardPage (index.astro)
└── DashboardView (React, client:load)
    ├── DashboardHeader
    │   └── CreateDeckDialog
    ├── DeckFilters
    │   ├── SearchBar
    │   └── SortSelect
    ├── DeckGrid
    │   ├── DeckCard (wielokrotnie)
    │   │   ├── DropdownMenu (akcje)
    │   │   ├── EditDeckDialog
    │   │   └── DeleteDeckConfirmDialog
    │   ├── SkeletonCard (stan ładowania, wielokrotnie)
    │   └── EmptyState (warunkowo)
    └── PaginationControls
        └── LoadMoreButton
```

## 4. Szczegóły komponentów

### 4.1 DashboardPage (`src/pages/index.astro`)

**Opis:** Główny plik strony Astro. Odpowiada za server-side rendering, weryfikację autentykacji i osadzenie komponentu React.

**Główne elementy:**
- Import layoutu `ProtectedLayout`
- Sprawdzenie sesji użytkownika przez `Astro.locals.user`
- Osadzenie komponentu `<DashboardView client:load />`

**Obsługiwane zdarzenia:** Brak (komponent Astro)

**Walidacja:** Weryfikacja sesji po stronie serwera

**Typy:** Brak specyficznych (używa typów Astro)

**Propsy:** Brak

---

### 4.2 DashboardView (`src/components/views/DashboardView.tsx`)

**Opis:** Główny kontener React dla całego widoku Dashboard. Zarządza globalnym stanem widoku (lista talii, stan ładowania, błędy), koordinuje między komponentami potomnymi i obsługuje integrację z API.

**Główne elementy:**
```tsx
<div className="container mx-auto py-6 space-y-6">
  <DashboardHeader onCreateClick={handleOpenCreateDialog} />
  <DeckFilters
    onSearchChange={handleSearchChange}
    onSortChange={handleSortChange}
  />
  {isLoading && <SkeletonGrid />}
  {error && <ErrorState onRetry={handleRetry} />}
  {!isLoading && !error && (
    <>
      <DeckGrid decks={filteredDecks} />
      {hasMore && <LoadMoreButton onClick={handleLoadMore} />}
    </>
  )}
  <CreateDeckDialog
    isOpen={isCreateDialogOpen}
    onClose={handleCloseCreateDialog}
    onSuccess={handleDeckCreated}
  />
</div>
```

**Obsługiwane zdarzenia:**
- Inicjalizacja: Pobranie listy talii z API przy montowaniu komponentu
- Otwarcie/zamknięcie dialogu tworzenia talii
- Sukces utworzenia talii: Dodanie nowej talii do stanu
- Zmiana filtrów wyszukiwania i sortowania
- Załadowanie kolejnej strony danych (paginacja)
- Retry przy błędzie

**Walidacja:** Brak bezpośredniej walidacji (delegowana do komponentów potomnych)

**Typy:**
- `DeckDTO[]` - lista talii
- `PaginationDTO` - metadane paginacji
- `DashboardFilters` - stan filtrów
- `ErrorResponseDTO` - błędy API

**Propsy:** Brak (komponent główny)

---

### 4.3 DashboardHeader (`src/components/dashboard/DashboardHeader.tsx`)

**Opis:** Nagłówek widoku Dashboard zawierający tytuł strony i przycisk do tworzenia nowej talii.

**Główne elementy:**
```tsx
<header className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold">Moje talie</h1>
    <p className="text-muted-foreground">Zarządzaj swoimi zestawami fiszek</p>
  </div>
  <Button onClick={onCreateClick}>
    <PlusIcon className="mr-2 h-4 w-4" />
    Stwórz nową talię
  </Button>
</header>
```

**Obsługiwane zdarzenia:**
- `onClick` przycisku "Stwórz nową talię" → wywołuje `onCreateClick`

**Walidacja:** Brak

**Typy:** Brak specyficznych

**Propsy:**
```typescript
interface DashboardHeaderProps {
  onCreateClick: () => void;
}
```

---

### 4.4 DeckFilters (`src/components/dashboard/DeckFilters.tsx`)

**Opis:** Komponent zawierający pole wyszukiwania (z debounce 300ms) oraz dropdown do wyboru sortowania talii.

**Główne elementy:**
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <SearchBar
    value={searchQuery}
    onChange={handleSearchChange}
    placeholder="Szukaj talii..."
  />
  <Select value={sortValue} onValueChange={handleSortChange}>
    <SelectTrigger className="w-full sm:w-[200px]">
      <SelectValue placeholder="Sortuj według..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="updated_at:desc">Ostatnio zaktualizowane</SelectItem>
      <SelectItem value="name:asc">Nazwa A-Z</SelectItem>
      <SelectItem value="name:desc">Nazwa Z-A</SelectItem>
      <SelectItem value="created_at:asc">Najstarsze</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Obsługiwane zdarzenia:**
- Zmiana tekstu w polu wyszukiwania (debounced 300ms)
- Zmiana opcji sortowania
- Czyszczenie wyszukiwania (przycisk X)

**Walidacja:** Brak (tylko filtrowanie i sortowanie)

**Typy:**
- `DashboardFilters` - interfejs stanu filtrów

**Propsy:**
```typescript
interface DeckFiltersProps {
  onSearchChange: (query: string) => void;
  onSortChange: (sort: string, order: 'asc' | 'desc') => void;
}
```

---

### 4.5 SearchBar (`src/components/dashboard/SearchBar.tsx`)

**Opis:** Pole wyszukiwania z ikoną lupy, opcją czyszczenia i debounce.

**Główne elementy:**
```tsx
<div className="relative flex-1">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    type="text"
    value={value}
    onChange={handleChange}
    placeholder={placeholder}
    className="pl-10 pr-10"
  />
  {value && (
    <Button
      variant="ghost"
      size="sm"
      className="absolute right-1 top-1/2 -translate-y-1/2"
      onClick={handleClear}
    >
      <XIcon className="h-4 w-4" />
    </Button>
  )}
</div>
```

**Obsługiwane zdarzenia:**
- `onChange` input field → debounced callback do rodzica
- `onClick` przycisku Clear → czyszczenie wartości

**Walidacja:** Brak

**Typy:** `string` (wartość wyszukiwania)

**Propsy:**
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

---

### 4.6 DeckGrid (`src/components/dashboard/DeckGrid.tsx`)

**Opis:** Siatka wyświetlająca karty talii lub stan pusty gdy brak talii. Responsywna: 1 kolumna (mobile) → 2 kolumny (tablet) → 3 kolumny (desktop).

**Główne elementy:**
```tsx
{decks.length === 0 ? (
  <EmptyState
    title="Brak talii"
    description={isSearchActive
      ? "Nie znaleziono talii pasujących do wyszukiwania"
      : "Stwórz swoją pierwszą talię lub wygeneruj ją z AI!"}
    actions={!isSearchActive && (
      <>
        <Button onClick={onCreateClick}>Stwórz pierwszą talię</Button>
        <Button variant="outline" onClick={onGenerateClick}>Wygeneruj z AI</Button>
      </>
    )}
  />
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {decks.map(deck => (
      <DeckCard
        key={deck.id}
        deck={deck}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ))}
  </div>
)}
```

**Obsługiwane zdarzenia:**
- Kliknięcie na kartę talii → nawigacja do `/decks/[id]`
- Kliknięcie Edit w menu → otwarcie EditDeckDialog
- Kliknięcie Delete w menu → otwarcie DeleteDeckConfirmDialog

**Walidacja:** Brak

**Typy:**
- `DeckCardViewModel[]` - lista talii z dodatkowymi polami do wyświetlenia

**Propsy:**
```typescript
interface DeckGridProps {
  decks: DeckCardViewModel[];
  isSearchActive?: boolean;
  onCreateClick?: () => void;
  onGenerateClick?: () => void;
}
```

---

### 4.7 DeckCard (`src/components/dashboard/DeckCard.tsx`)

**Opis:** Karta pojedynczej talii wyświetlająca nazwę, liczbę fiszek, czas ostatniej aktualizacji oraz menu akcji (edycja, usunięcie).

**Główne elementy:**
```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  <CardHeader className="flex flex-row items-start justify-between">
    <div className="flex-1" onClick={handleNavigate}>
      <CardTitle className="text-xl">{deck.name}</CardTitle>
      <CardDescription>{deck.flashcardCountText}</CardDescription>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edytuj nazwę
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Usuń talię
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </CardHeader>
  <CardFooter>
    <p className="text-sm text-muted-foreground">{deck.relativeTime}</p>
  </CardFooter>
</Card>
```

**Obsługiwane zdarzenia:**
- Kliknięcie na kartę (poza menu) → nawigacja do `/decks/[id]`
- Kliknięcie "Edytuj nazwę" → wywołuje `onEdit(deck.id)`
- Kliknięcie "Usuń talię" → wywołuje `onDelete(deck.id, deck.name, deck.flashcard_count)`

**Walidacja:** Brak

**Typy:**
- `DeckCardViewModel` - dane talii z dodatkowymi polami obliczeniowymi

**Propsy:**
```typescript
interface DeckCardProps {
  deck: DeckCardViewModel;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string, deckName: string, flashcardCount: number) => void;
}
```

---

### 4.8 SkeletonCard (`src/components/dashboard/SkeletonCard.tsx`)

**Opis:** Placeholder wyświetlany podczas ładowania danych, imitujący strukturę DeckCard.

**Główne elementy:**
```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2 mt-2" />
  </CardHeader>
  <CardFooter>
    <Skeleton className="h-4 w-1/3" />
  </CardFooter>
</Card>
```

**Obsługiwane zdarzenia:** Brak

**Walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

---

### 4.9 EmptyState (`src/components/common/EmptyState.tsx`)

**Opis:** Reużywalny komponent wyświetlający komunikat gdy brak danych. Wspiera ilustrację SVG, tytuł, opis i przyciski akcji.

**Główne elementy:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  {illustration && <div className="mb-4">{illustration}</div>}
  <h3 className="text-xl font-semibold mb-2">{title}</h3>
  <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
  {actions && <div className="flex gap-3">{actions}</div>}
</div>
```

**Obsługiwane zdarzenia:** Przekazywane przez propsy `actions`

**Walidacja:** Brak

**Typy:** `React.ReactNode` dla ilustracji i akcji

**Propsy:**
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  actions?: React.ReactNode;
}
```

---

### 4.10 CreateDeckDialog (`src/components/dashboard/CreateDeckDialog.tsx`)

**Opis:** Dialog modalny z formularzem do tworzenia nowej talii. Zawiera pole tekstowe na nazwę talii z walidacją.

**Główne elementy:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Stwórz nową talię</DialogTitle>
      <DialogDescription>
        Podaj nazwę dla swojej nowej talii fiszek
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nazwa talii</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="np. JavaScript Basics"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          Stwórz talię
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**Obsługiwane zdarzenia:**
- `onSubmit` formularza → walidacja → wywołanie API → callback `onSuccess`
- `onClose` / `onOpenChange` → zamknięcie dialogu

**Walidacja:**
- Nazwa wymagana (min 1 znak)
- Maksymalna długość: 255 znaków
- Automatyczne `trim()` białych znaków
- Walidacja przez Zod schema + React Hook Form

**Typy:**
- `CreateDeckCommand` - dane formularza

**Propsy:**
```typescript
interface CreateDeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deck: DeckDTO) => void;
}
```

---

### 4.11 EditDeckDialog (`src/components/dashboard/EditDeckDialog.tsx`)

**Opis:** Dialog modalny do edycji nazwy istniejącej talii. Prawie identyczny z CreateDeckDialog, ale z pre-wypełnionym polem.

**Główne elementy:**
Analogiczne do CreateDeckDialog, z tą różnicą że:
- `DialogTitle`: "Edytuj nazwę talii"
- Input pre-wypełniony aktualną nazwą: `defaultValues: { name: currentName }`
- Przycisk submit: "Zapisz zmiany"
- API call: `PUT /api/decks/:id`

**Obsługiwane zdarzenia:**
- `onSubmit` → walidacja → PUT API → `onSuccess`
- `onClose`

**Walidacja:**
Identyczna jak CreateDeckDialog:
- Nazwa wymagana (min 1 znak)
- Maksymalna długość: 255 znaków
- Trim białych znaków

**Typy:**
- `UpdateDeckCommand` - dane formularza
- `DeckDTO` - aktualizowana talia

**Propsy:**
```typescript
interface EditDeckDialogProps {
  isOpen: boolean;
  deckId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: (deck: DeckDTO) => void;
}
```

---

### 4.12 DeleteDeckConfirmDialog (`src/components/dashboard/DeleteDeckConfirmDialog.tsx`)

**Opis:** Dialog potwierdzenia usunięcia talii. Wyświetla ostrzeżenie, liczbę fiszek do usunięcia i wymaga potwierdzenia przez checkbox.

**Główne elementy:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="text-destructive">Usuń talię</DialogTitle>
      <DialogDescription>
        Czy na pewno chcesz usunąć talię "{deckName}"?
        Spowoduje to trwałe usunięcie {flashcardCount} fiszek.
        Tej akcji nie można cofnąć.
      </DialogDescription>
    </DialogHeader>
    <div className="flex items-start space-x-2 py-4">
      <Checkbox
        id="confirm-delete"
        checked={isConfirmed}
        onCheckedChange={setIsConfirmed}
      />
      <Label
        htmlFor="confirm-delete"
        className="text-sm font-normal cursor-pointer"
      >
        Rozumiem konsekwencje i chcę usunąć tę talię
      </Label>
    </div>
    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
    <DialogFooter>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isDeleting}
      >
        Anuluj
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={!isConfirmed || isDeleting}
      >
        {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        Usuń talię
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obsługiwane zdarzenia:**
- Zmiana checkboxa potwierdzenia
- Kliknięcie "Usuń talię" → wywołanie DELETE API → `onSuccess`
- Kliknięcie "Anuluj" → zamknięcie dialogu

**Walidacja:**
- Przycisk "Usuń talię" aktywny tylko gdy checkbox zaznaczony (`isConfirmed === true`)

**Typy:** Brak specyficznych (używa prymitywów)

**Propsy:**
```typescript
interface DeleteDeckConfirmDialogProps {
  isOpen: boolean;
  deckId: string;
  deckName: string;
  flashcardCount: number;
  onClose: () => void;
  onSuccess: () => void;
}
```

---

### 4.13 LoadMoreButton (`src/components/dashboard/LoadMoreButton.tsx`)

**Opis:** Przycisk do ładowania kolejnej strony talii (paginacja).

**Główne elementy:**
```tsx
<div className="flex justify-center py-6">
  <Button
    variant="outline"
    onClick={onClick}
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        Ładowanie...
      </>
    ) : (
      'Załaduj więcej'
    )}
  </Button>
</div>
```

**Obsługiwane zdarzenia:**
- `onClick` → wywołanie funkcji ładującej kolejną stronę z API

**Walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}
```

---

## 5. Typy

### 5.1 Typy istniejące (z `src/types.ts`)

Wykorzystywane bezpośrednio z pliku types.ts:

```typescript
// DTO z API
interface DeckDTO {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  flashcard_count: number;
}

interface DeckListDTO {
  data: DeckDTO[];
  pagination: PaginationDTO;
}

interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Komendy API
interface CreateDeckCommand {
  name: string; // 1-255 characters, trimmed
}

interface UpdateDeckCommand {
  name: string; // 1-255 characters, trimmed
}

// Parametry query
interface DeckListQueryParams {
  page?: number;
  limit?: number;
  sort?: 'name' | 'created_at' | 'updated_at';
  order?: SortOrder;
}

type SortOrder = 'asc' | 'desc';

// Błędy
interface ErrorResponseDTO {
  error: string;
  details?: unknown[];
  retry_after?: number;
}
```

### 5.2 Nowe typy (do utworzenia)

#### DeckCardViewModel
Rozszerzenie DeckDTO o pola obliczeniowe do wyświetlenia w UI:

```typescript
/**
 * ViewModel dla karty talii w widoku Dashboard
 * Rozszerza DeckDTO o pola formatowane dla UI
 */
interface DeckCardViewModel extends DeckDTO {
  /**
   * Sformatowany względny czas ostatniej aktualizacji
   * Przykłady: "2 godziny temu", "wczoraj", "3 dni temu"
   * Generowany przez date-fns formatDistanceToNow()
   */
  relativeTime: string;

  /**
   * Sformatowany tekst liczby fiszek
   * Przykłady: "0 fiszek", "1 fiszka", "25 fiszek"
   * Uwzględnia polskie odmienne formy liczebników
   */
  flashcardCountText: string;
}
```

Funkcja pomocnicza do mapowania:
```typescript
function mapToDeckCardViewModel(deck: DeckDTO): DeckCardViewModel {
  return {
    ...deck,
    relativeTime: formatDistanceToNow(new Date(deck.updated_at), {
      addSuffix: true,
      locale: pl
    }),
    flashcardCountText: formatFlashcardCount(deck.flashcard_count)
  };
}

function formatFlashcardCount(count: number): string {
  if (count === 0) return '0 fiszek';
  if (count === 1) return '1 fiszka';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return `${count} fiszki`;
  }
  return `${count} fiszek`;
}
```

#### DashboardFilters
Stan filtrów i sortowania w widoku:

```typescript
/**
 * Stan filtrów wyszukiwania i sortowania w Dashboard
 */
interface DashboardFilters {
  /**
   * Fraza wyszukiwania (filtrowanie client-side po nazwie talii)
   */
  searchQuery: string;

  /**
   * Pole do sortowania
   */
  sortBy: 'name' | 'created_at' | 'updated_at';

  /**
   * Kierunek sortowania
   */
  sortOrder: SortOrder; // 'asc' | 'desc'
}
```

Domyślne wartości:
```typescript
const DEFAULT_FILTERS: DashboardFilters = {
  searchQuery: '',
  sortBy: 'updated_at',
  sortOrder: 'desc'
};
```

#### DashboardState (opcjonalnie dla Zustand store)
Stan globalny dla Dashboard, jeśli używamy Zustand:

```typescript
/**
 * Globalny stan Dashboard (Zustand store)
 */
interface DashboardState {
  /**
   * Lista talii załadowanych z API
   */
  decks: DeckDTO[];

  /**
   * Lista talii po filtrowaniu i sortowaniu
   */
  filteredDecks: DeckCardViewModel[];

  /**
   * Stan ładowania danych
   */
  isLoading: boolean;

  /**
   * Komunikat błędu (null jeśli brak błędu)
   */
  error: string | null;

  /**
   * Metadane paginacji
   */
  pagination: PaginationDTO | null;

  /**
   * Aktualne filtry
   */
  filters: DashboardFilters;

  /**
   * Akcje
   */
  fetchDecks: () => Promise<void>;
  loadMoreDecks: () => Promise<void>;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  addDeck: (deck: DeckDTO) => void;
  updateDeck: (id: string, updates: Partial<DeckDTO>) => void;
  removeDeck: (id: string) => void;
  clearError: () => void;
}
```

#### API Response Types
Typy specyficzne dla obsługi odpowiedzi API:

```typescript
/**
 * Typ dla błędu 409 Conflict (duplikat nazwy)
 */
interface DuplicateNameError extends ErrorResponseDTO {
  error: 'Deck with this name already exists';
}

/**
 * Type guard do sprawdzenia czy błąd to 409
 */
function isDuplicateNameError(error: ErrorResponseDTO): error is DuplicateNameError {
  return error.error === 'Deck with this name already exists';
}
```

### 5.3 Zod Schemas

Schematy walidacji dla formularzy:

```typescript
import { z } from 'zod';

/**
 * Schema walidacji dla tworzenia/edycji nazwy talii
 */
export const deckNameSchema = z.object({
  name: z.string()
    .min(1, 'Nazwa talii jest wymagana')
    .max(255, 'Nazwa talii nie może przekraczać 255 znaków')
    .transform(val => val.trim())
});

export type DeckNameFormData = z.infer<typeof deckNameSchema>;
```

## 6. Zarządzanie stanem

### 6.1 Strategia zarządzania stanem

Widok Dashboard wykorzystuje **hybrydową strategię zarządzania stanem**:

1. **Zustand Store** (`useDecksStore`) - dla globalnego stanu list talii:
   - Lista talii (cache)
   - Stan ładowania
   - Błędy
   - Akcje CRUD (dodawanie, aktualizacja, usuwanie talii)

2. **Local Component State** - dla stanu specyficznego dla widoku:
   - Stan filtrów (searchQuery, sortBy, sortOrder)
   - Stan dialogów (isCreateDialogOpen, editingDeckId, deletingDeckId)
   - Stan paginacji (currentPage, hasMore)

### 6.2 Zustand Store Implementation

```typescript
// src/stores/decks.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DecksStore {
  // State
  decks: DeckDTO[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationDTO | null;

  // Actions
  setDecks: (decks: DeckDTO[], pagination: PaginationDTO) => void;
  appendDecks: (decks: DeckDTO[], pagination: PaginationDTO) => void;
  addDeck: (deck: DeckDTO) => void;
  updateDeck: (id: string, updates: Partial<DeckDTO>) => void;
  removeDeck: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearDecks: () => void;
}

export const useDecksStore = create<DecksStore>()(
  devtools(
    (set) => ({
      // Initial state
      decks: [],
      isLoading: false,
      error: null,
      pagination: null,

      // Actions
      setDecks: (decks, pagination) =>
        set({ decks, pagination, error: null }),

      appendDecks: (newDecks, pagination) =>
        set((state) => ({
          decks: [...state.decks, ...newDecks],
          pagination
        })),

      addDeck: (deck) =>
        set((state) => ({
          decks: [deck, ...state.decks],
          pagination: state.pagination ? {
            ...state.pagination,
            total: state.pagination.total + 1
          } : null
        })),

      updateDeck: (id, updates) =>
        set((state) => ({
          decks: state.decks.map(deck =>
            deck.id === id ? { ...deck, ...updates } : deck
          )
        })),

      removeDeck: (id) =>
        set((state) => ({
          decks: state.decks.filter(deck => deck.id !== id),
          pagination: state.pagination ? {
            ...state.pagination,
            total: state.pagination.total - 1
          } : null
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearDecks: () => set({ decks: [], pagination: null, error: null })
    }),
    { name: 'decks-store' }
  )
);
```

### 6.3 Custom Hooks

#### useDeckList
Hook zarządzający pobieraniem i filtrowaniem listy talii:

```typescript
// src/hooks/useDeckList.ts
import { useState, useEffect, useMemo } from 'react';
import { useDecksStore } from '@/stores/decks.store';
import type { DashboardFilters, DeckCardViewModel } from '@/types';

export function useDeckList() {
  const { decks, isLoading, error, pagination, setDecks, appendDecks, setLoading, setError } = useDecksStore();

  const [filters, setFilters] = useState<DashboardFilters>({
    searchQuery: '',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  // Fetch initial decks
  useEffect(() => {
    fetchDecks(1);
  }, []);

  // Fetch decks from API
  async function fetchDecks(page: number = 1) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: filters.sortBy,
        order: filters.sortOrder
      });

      const response = await fetch(`/api/decks?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch decks');
      }

      const data: DeckListDTO = await response.json();

      if (page === 1) {
        setDecks(data.data, data.pagination);
      } else {
        appendDecks(data.data, data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Load more decks (pagination)
  async function loadMore() {
    if (!pagination || pagination.page >= pagination.total_pages) return;
    await fetchDecks(pagination.page + 1);
  }

  // Filter and sort decks client-side
  const filteredDecks = useMemo<DeckCardViewModel[]>(() => {
    let result = [...decks];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(deck =>
        deck.name.toLowerCase().includes(query)
      );
    }

    // Apply client-side sorting (for already loaded decks)
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pl');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    // Map to ViewModel
    return result.map(mapToDeckCardViewModel);
  }, [decks, filters]);

  const hasMore = pagination ? pagination.page < pagination.total_pages : false;

  return {
    decks: filteredDecks,
    isLoading,
    error,
    filters,
    hasMore,
    setFilters,
    loadMore,
    refetch: () => fetchDecks(1)
  };
}
```

#### useDeckActions
Hook z akcjami CRUD dla talii:

```typescript
// src/hooks/useDeckActions.ts
import { useState } from 'react';
import { useDecksStore } from '@/stores/decks.store';
import { toast } from 'sonner';
import type { CreateDeckCommand, UpdateDeckCommand, DeckDTO, ErrorResponseDTO } from '@/types';

export function useDeckActions() {
  const { addDeck, updateDeck: updateDeckInStore, removeDeck } = useDecksStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createDeck(command: CreateDeckCommand): Promise<DeckDTO | null> {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();

        if (response.status === 409) {
          throw new Error('Talia o tej nazwie już istnieje');
        }

        throw new Error(error.error || 'Nie udało się utworzyć talii');
      }

      const deck: DeckDTO = await response.json();
      addDeck(deck);
      toast.success('Talia została utworzona');

      return deck;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd';
      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateDeck(deckId: string, command: UpdateDeckCommand): Promise<DeckDTO | null> {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();

        if (response.status === 409) {
          throw new Error('Talia o tej nazwie już istnieje');
        }

        throw new Error(error.error || 'Nie udało się zaktualizować talii');
      }

      const deck: DeckDTO = await response.json();
      updateDeckInStore(deckId, deck);
      toast.success('Nazwa talii została zmieniona');

      return deck;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd';
      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteDeck(deckId: string): Promise<boolean> {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();
        throw new Error(error.error || 'Nie udało się usunąć talii');
      }

      removeDeck(deckId);
      toast.success('Talia została usunięta');

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd';
      toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    createDeck,
    updateDeck,
    deleteDeck,
    isSubmitting
  };
}
```

#### useDebounce
Hook do debounce'owania wartości (dla search):

```typescript
// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## 7. Integracja API

### 7.1 Endpoint: GET /api/decks

**Cel:** Pobranie listy talii użytkownika z paginacją i sortowaniem.

**Request:**
- Metoda: `GET`
- URL: `/api/decks`
- Query Parameters:
  ```typescript
  interface QueryParams {
    page?: number;    // default: 1
    limit?: number;   // default: 20, max: 100
    sort?: 'name' | 'created_at' | 'updated_at'; // default: 'updated_at'
    order?: 'asc' | 'desc'; // default: 'desc'
  }
  ```
- Headers:
  - `Authorization: Bearer <token>` (automatycznie przez Supabase)

**Response Success (200):**
```typescript
interface SuccessResponse {
  data: DeckDTO[];
  pagination: PaginationDTO;
}
```

Przykład:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "JavaScript Basics",
      "flashcard_count": 25,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Response Errors:**
- `401 Unauthorized`: Użytkownik niezalogowany → redirect do `/login`
- `500 Internal Server Error`: Błąd serwera → wyświetl komunikat błędu z przyciskiem retry

**Wywołanie w kodzie:**
```typescript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  sort: 'updated_at',
  order: 'desc'
});

const response = await fetch(`/api/decks?${params}`);
const data: DeckListDTO = await response.json();
```

### 7.2 Endpoint: POST /api/decks

**Cel:** Utworzenie nowej talii.

**Request:**
- Metoda: `POST`
- URL: `/api/decks`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:
  ```typescript
  interface RequestBody extends CreateDeckCommand {
    name: string; // 1-255 chars, będzie trimmed
  }
  ```

Przykład:
```json
{
  "name": "JavaScript Advanced"
}
```

**Response Success (201 Created):**
```typescript
type SuccessResponse = DeckDTO;
```

Przykład:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "JavaScript Advanced",
  "flashcard_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

Headers:
- `Location: /api/decks/550e8400-e29b-41d4-a716-446655440000`

**Response Errors:**
- `400 Bad Request`: Walidacja nie powiodła się
  ```json
  {
    "error": "Validation failed",
    "details": [
      { "field": "name", "message": "Deck name is required" }
    ]
  }
  ```

- `409 Conflict`: Talia o tej nazwie już istnieje
  ```json
  {
    "error": "Deck with this name already exists"
  }
  ```

- `401 Unauthorized`: Brak autentykacji
- `500 Internal Server Error`: Błąd serwera

**Wywołanie w kodzie:**
```typescript
const response = await fetch('/api/decks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'JavaScript Advanced' })
});

if (response.status === 409) {
  // Handle duplicate name
}

const deck: DeckDTO = await response.json();
```

### 7.3 Endpoint: PUT /api/decks/:id

**Cel:** Aktualizacja nazwy talii.

**Request:**
- Metoda: `PUT`
- URL: `/api/decks/:id` (gdzie `:id` to UUID talii)
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:
  ```typescript
  interface RequestBody extends UpdateDeckCommand {
    name: string; // 1-255 chars
  }
  ```

**Response Success (200 OK):**
```typescript
type SuccessResponse = DeckDTO;
```

**Response Errors:**
- `400 Bad Request`: Nieprawidłowy UUID lub walidacja
- `401 Unauthorized`: Brak autentykacji
- `403 Forbidden`: Brak uprawnień do tej talii
- `404 Not Found`: Talia nie istnieje
- `409 Conflict`: Nazwa już zajęta
- `500 Internal Server Error`: Błąd serwera

### 7.4 Endpoint: DELETE /api/decks/:id

**Cel:** Usunięcie talii wraz z fiszkami.

**Request:**
- Metoda: `DELETE`
- URL: `/api/decks/:id`
- Headers:
  - `Authorization: Bearer <token>`

**Response Success (204 No Content):**
- Brak body
- Status 204 oznacza sukces

**Response Errors:**
- `400 Bad Request`: Nieprawidłowy UUID
- `401 Unauthorized`: Brak autentykacji
- `403 Forbidden`: Brak uprawnień
- `404 Not Found`: Talia nie istnieje
- `500 Internal Server Error`: Błąd serwera

## 8. Interakcje użytkownika

### 8.1 Wejście na stronę Dashboard

**Akcja użytkownika:** Użytkownik loguje się i jest przekierowany na `/` lub nawiguje do Dashboard z menu.

**Przepływ:**
1. Middleware sprawdza autentykację
2. Jeśli niezalogowany → redirect do `/login`
3. Jeśli nowy użytkownik (brak talii, FTUE) → redirect do `/generate`
4. Komponent DashboardView montuje się z dyrektywą `client:load`
5. Hook `useDeckList` wywołuje `fetchDecks(1)` w useEffect
6. Wyświetlane są skeleton loadery
7. Po otrzymaniu danych:
   - Jeśli brak talii → EmptyState z CTA
   - Jeśli są talie → DeckGrid z kartami

**Stan UI:**
- Loading: `isLoading = true` → Skeleton grid
- Success: Lista DeckCard w siatce responsywnej
- Error: Komunikat błędu + przycisk "Spróbuj ponownie"
- Empty: EmptyState z ilustracją i przyciskami

### 8.2 Wyszukiwanie talii

**Akcja użytkownika:** Użytkownik wpisuje tekst w pole wyszukiwania.

**Przepływ:**
1. Użytkownik wpisuje znak
2. SearchBar aktualizuje lokalny stan `value`
3. Hook `useDebounce` opóźnia wywołanie callback o 300ms
4. Po 300ms ciszy: wywołanie `onSearchChange(debouncedValue)`
5. `useDeckList` aktualizuje `filters.searchQuery`
6. `useMemo` w `useDeckList` przefiltruje `decks` client-side
7. DeckGrid renderuje przefiltrowaną listę
8. Jeśli brak wyników → komunikat "Nie znaleziono talii pasujących do '[query]'"

**Stan UI:**
- Instant visual feedback (bez loadera, bo client-side)
- Przycisk X do czyszczenia pojawia się gdy `searchQuery` nie jest pusty
- Empty search results: Specjalny komunikat (inny niż ogólny empty state)

### 8.3 Sortowanie talii

**Akcja użytkownika:** Użytkownik wybiera opcję z dropdown sortowania.

**Przepływ:**
1. Użytkownik klika Select
2. Dropdown rozwija się z opcjami:
   - "Ostatnio zaktualizowane" (updated_at:desc)
   - "Nazwa A-Z" (name:asc)
   - "Nazwa Z-A" (name:desc)
   - "Najstarsze" (created_at:asc)
3. Użytkownik wybiera opcję
4. SortSelect parsuje wartość i wywołuje `onSortChange(sortBy, order)`
5. `useDeckList` aktualizuje `filters.sortBy` i `filters.sortOrder`
6. `useMemo` re-sortuje `filteredDecks` client-side
7. DeckGrid renderuje posortowaną listę

**Stan UI:**
- Instant (brak loadera)
- Aktywna opcja podświetlona w dropdownie

### 8.4 Tworzenie nowej talii

**Akcja użytkownika:** Użytkownik klika przycisk "Stwórz nową talię".

**Przepływ:**
1. Kliknięcie przycisku w DashboardHeader
2. `setIsCreateDialogOpen(true)` → otwiera CreateDeckDialog
3. Dialog pojawia się z pustym inputem w fokusie
4. Użytkownik wpisuje nazwę talii (np. "React Hooks")
5. Real-time walidacja przez Zod (min 1, max 255 chars)
6. Jeśli błędy walidacji → wyświetlenie pod inputem
7. Użytkownik klika "Stwórz talię"
8. `handleSubmit` wywołuje `useDeckActions.createDeck()`
9. Stan `isSubmitting = true` → przycisk disabled + spinner
10. API call: `POST /api/decks` z `{ name: "React Hooks" }`
11. Scenariusze odpowiedzi:
    - **201 Success:**
      - Nowa talia dodana do Zustand store (`addDeck`)
      - Dialog zamyka się
      - Toast: "Talia została utworzona"
      - Nowa karta pojawia się na początku listy
    - **409 Conflict:**
      - Inline error pod inputem: "Talia o tej nazwie już istnieje"
      - Dialog pozostaje otwarty
      - Focus wraca na input
    - **400 Validation Error:**
      - Wyświetlenie błędów walidacji pod inputem
    - **500 Server Error:**
      - Toast error: "Wystąpił błąd serwera"
      - Dialog zamyka się

**Stan UI:**
- Dialog open/closed
- Input validation errors (real-time)
- Submit button disabled podczas submittingu
- Loading spinner podczas submittingu

### 8.5 Edycja nazwy talii

**Akcja użytkownika:** Użytkownik klika ikonę edycji w menu akcji karty talii.

**Przepływ:**
1. Kliknięcie "Edytuj nazwę" w DropdownMenu
2. `setEditingDeckId(deckId)` → otwiera EditDeckDialog
3. Dialog pojawia się z inputem pre-wypełnionym aktualną nazwą
4. Użytkownik modyfikuje nazwę
5. Real-time walidacja (identyczna jak create)
6. Użytkownik klika "Zapisz zmiany"
7. `useDeckActions.updateDeck(deckId, { name })`
8. Stan `isSubmitting = true`
9. API call: `PUT /api/decks/:id` z `{ name: "..." }`
10. Scenariusze odpowiedzi:
    - **200 Success:**
      - Zustand store aktualizowany (`updateDeck`)
      - Dialog zamyka się
      - Toast: "Nazwa talii została zmieniona"
      - Karta wyświetla nową nazwę
    - **409 Conflict:**
      - Inline error: "Talia o tej nazwie już istnieje"
    - **403/404 Error:**
      - Toast error + refresh listy

**Stan UI:**
Identyczny jak CreateDeckDialog (poza pre-wypełnionym inputem)

### 8.6 Usuwanie talii

**Akcja użytkownika:** Użytkownik klika "Usuń talię" w menu akcji.

**Przepływ:**
1. Kliknięcie "Usuń talię" w DropdownMenu (czerwony kolor)
2. `setDeletingDeck({ id, name, flashcard_count })` → otwiera DeleteDeckConfirmDialog
3. Dialog wyświetla:
   - Ostrzeżenie: "Czy na pewno chcesz usunąć talię '[Nazwa]'?"
   - Informacja: "Spowoduje to trwałe usunięcie [X] fiszek. Tej akcji nie można cofnąć."
   - Checkbox: "Rozumiem konsekwencje i chcę usunąć tę talię" (unchecked)
   - Przycisk "Usuń talię" (disabled)
4. Użytkownik musi zaznaczyć checkbox
5. Po zaznaczeniu → przycisk "Usuń talię" staje się aktywny
6. Użytkownik klika "Usuń talię"
7. `useDeckActions.deleteDeck(deckId)`
8. Stan `isDeleting = true` → przycisk disabled + spinner
9. API call: `DELETE /api/decks/:id`
10. Scenariusze odpowiedzi:
    - **204 Success:**
      - Zustand store aktualizowany (`removeDeck`)
      - Dialog zamyka się
      - Toast: "Talia została usunięta"
      - Karta znika z listy z animacją fade-out
    - **403/404 Error:**
      - Toast error: "Nie udało się usunąć talii"
      - Dialog zamyka się
      - Refresh listy talii

**Stan UI:**
- Checkbox state (checked/unchecked)
- Button disabled until checkbox checked
- Loading spinner podczas usuwania
- Error alert w dialogu (jeśli API zwróci błąd)

### 8.7 Nawigacja do szczegółów talii

**Akcja użytkownika:** Użytkownik klika na kartę talii (poza menu akcji).

**Przepływ:**
1. Kliknięcie na DeckCard
2. Event handler `handleNavigate` wywołuje router
3. Nawigacja do `/decks/[id]` (gdzie `id` to UUID talii)
4. Astro routing ładuje nową stronę (Deck Detail View)

**Stan UI:**
- Hover effect na karcie (podniesiony cień)
- Cursor: pointer

### 8.8 Ładowanie kolejnej strony (paginacja)

**Akcja użytkownika:** Użytkownik klika przycisk "Załaduj więcej" (lub scrolluje do końca dla infinite scroll).

**Przepływ:**
1. Użytkownik klika LoadMoreButton
2. `handleLoadMore` wywołuje `useDeckList.loadMore()`
3. Check: czy `hasMore === true` (pagination.page < total_pages)
4. Jeśli tak:
   - Stan `isLoading = true` → spinner w przycisku
   - API call: `GET /api/decks?page=2&...`
   - Po sukcesie: `appendDecks` dodaje nowe talie do listy
   - Pagination metadata aktualizowane
   - Nowe karty pojawiają się na dole listy
5. Jeśli `hasMore === false` → przycisk ukryty

**Stan UI:**
- Przycisk disabled podczas ładowania
- Spinner w przycisku
- Płynne dodawanie kart na dół (brak flash)

### 8.9 Obsługa błędu i retry

**Akcja użytkownika:** Wystąpił błąd podczas ładowania talii, użytkownik klika "Spróbuj ponownie".

**Przepływ:**
1. API zwraca błąd (500 lub network error)
2. `useDeckList` ustawia `error = "Failed to load decks"`
3. DeckGrid wyświetla ErrorState z:
   - Ikoną błędu
   - Komunikatem: "Nie udało się załadować talii"
   - Przyciskiem "Spróbuj ponownie"
4. Użytkownik klika "Spróbuj ponownie"
5. `handleRetry` wywołuje `useDeckList.refetch()`
6. Ponowne wywołanie `fetchDecks(1)`
7. Jeśli sukces → wyświetlenie listy
8. Jeśli ponowny błąd → error state ponownie

**Stan UI:**
- Error state (ikona + komunikat + retry button)
- Loading state podczas retry

## 9. Warunki i walidacja

### 9.1 Walidacja formularza tworzenia/edycji talii

**Komponenty:** CreateDeckDialog, EditDeckDialog

**Warunki zgodne z API:**

1. **Nazwa talii wymagana (min 1 znak po trim)**
   - Walidacja: Zod schema `.min(1, 'Nazwa talii jest wymagana')`
   - UI: Komunikat błędu pod inputem jeśli pole puste
   - Blokada submitu: Przycisk "Stwórz talię" aktywny tylko gdy walidacja OK

2. **Maksymalna długość: 255 znaków**
   - Walidacja: Zod schema `.max(255, 'Nazwa talii nie może przekraczać 255 znaków')`
   - UI: Komunikat błędu pod inputem
   - Opcjonalnie: Character counter (np. "25/255")

3. **Automatyczne trimowanie białych znaków**
   - Walidacja: Zod schema `.transform(val => val.trim())`
   - UI: Transparent dla użytkownika, wykonywane przed wysłaniem

4. **Unikalność nazwy per user**
   - Walidacja: API-side (409 Conflict)
   - UI: Po otrzymaniu 409:
     ```tsx
     {errors.api && (
       <Alert variant="destructive">
         <AlertDescription>
           Talia o tej nazwie już istnieje. Wybierz inną nazwę.
         </AlertDescription>
       </Alert>
     )}
     ```

**Implementacja walidacji:**
```tsx
// CreateDeckDialog.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deckNameSchema } from '@/schemas/deck.schema';

const { register, handleSubmit, formState: { errors, isValid } } = useForm({
  resolver: zodResolver(deckNameSchema),
  mode: 'onChange' // Real-time validation
});

async function onSubmit(data: DeckNameFormData) {
  const result = await createDeck(data);
  if (result) {
    onSuccess(result);
    onClose();
  }
  // Error handling w useDeckActions (toast notifications)
}
```

### 9.2 Walidacja parametrów API

**Komponent:** useDeckList (wywołania API)

**Warunki:**

1. **page >= 1**
   - Walidacja: Przed wysłaniem requestu
   - Default: 1

2. **limit <= 100**
   - Walidacja: Hard-coded limit = 20 dla MVP
   - API zwaliduje po stronie serwera

3. **sort field musi być: name | created_at | updated_at**
   - Walidacja: TypeScript type checking
   - UI: Tylko te opcje dostępne w Select

4. **order musi być: asc | desc**
   - Walidacja: TypeScript type checking
   - UI: Parsing z wartości Select (np. "name:asc" → split)

### 9.3 Walidacja stanu UI

**Komponent:** DeleteDeckConfirmDialog

**Warunek:** Checkbox musi być zaznaczony przed usunięciem

```tsx
const [isConfirmed, setIsConfirmed] = useState(false);

<Button
  variant="destructive"
  onClick={handleDelete}
  disabled={!isConfirmed || isDeleting}
>
  Usuń talię
</Button>
```

**Komponent:** LoadMoreButton

**Warunek:** Przycisk widoczny tylko gdy `hasMore === true`

```tsx
{hasMore && <LoadMoreButton onClick={loadMore} isLoading={isLoading} />}
```

**Komponent:** EmptyState

**Warunek:** Wyświetlany tylko gdy `!isLoading && decks.length === 0`

```tsx
{!isLoading && decks.length === 0 && (
  <EmptyState
    title={isSearchActive ? "Brak wyników" : "Brak talii"}
    // ...
  />
)}
```

### 9.4 Walidacja autentykacji

**Komponent:** DashboardPage (Astro)

**Warunek:** Użytkownik musi być zalogowany

```astro
---
// src/pages/index.astro
const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/login');
}

// Check for FTUE (First Time User Experience)
// Jeśli użytkownik ma 0 talii → redirect do /generate (US-027)
// Ta logika może być w middleware lub w komponencie React
---
```

### 9.5 Walidacja UUID

**Komponenty:** EditDeckDialog, DeleteDeckConfirmDialog (przekazywane deckId)

**Warunek:** deckId musi być prawidłowym UUID

```typescript
// Walidacja w PropTypes lub runtime check
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// W komponencie:
if (!isValidUUID(deckId)) {
  console.error('Invalid deck ID');
  return null;
}
```

## 10. Obsługa błędów

### 10.1 Błędy sieciowe / API unavailable

**Scenariusz:** Serwer nie odpowiada lub timeout.

**Obsługa:**
```typescript
// W useDeckList.fetchDecks()
try {
  const response = await fetch('/api/decks');

  if (!response.ok) {
    throw new Error('Failed to fetch decks');
  }

  // ...
} catch (err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    setError('Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe.');
  } else {
    setError('Nie udało się załadować talii. Spróbuj ponownie później.');
  }
}
```

**UI:**
```tsx
{error && (
  <div className="flex flex-col items-center justify-center py-12">
    <AlertCircleIcon className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
    <p className="text-muted-foreground mb-4">{error}</p>
    <Button onClick={refetch}>Spróbuj ponownie</Button>
  </div>
)}
```

### 10.2 Błąd 401 Unauthorized

**Scenariusz:** Token wygasł lub użytkownik niezalogowany.

**Obsługa:**
```typescript
if (response.status === 401) {
  // Redirect do login
  window.location.href = '/login';
  return;
}
```

**Middleware Astro:** Powinno być już obsłużone przed dotarciem do komponentu.

### 10.3 Błąd 500 Server Error

**Scenariusz:** Wewnętrzny błąd serwera.

**Obsługa:**
```typescript
if (response.status === 500) {
  setError('Wystąpił błąd serwera. Nasz zespół został powiadomiony. Spróbuj ponownie za chwilę.');
  // Opcjonalnie: Log to monitoring service (Sentry)
}
```

**UI:** Error state z komunikatem i przyciskiem retry.

### 10.4 Błąd 409 Conflict (duplikat nazwy)

**Scenariusz:** Użytkownik próbuje utworzyć/edytować talię z nazwą która już istnieje.

**Obsługa:**
```typescript
// W useDeckActions.createDeck()
if (response.status === 409) {
  throw new Error('Talia o tej nazwie już istnieje');
}
```

**UI:** Inline error w dialogu pod inputem
```tsx
{errors.api && (
  <p className="text-sm text-destructive mt-1">
    {errors.api.message}
  </p>
)}
```

### 10.5 Błąd 400 Bad Request (walidacja)

**Scenariusz:** Dane wysłane do API nie przeszły walidacji (np. nazwa > 255 znaków).

**Obsługa:**
```typescript
if (response.status === 400) {
  const error: ErrorResponseDTO = await response.json();

  if (error.details) {
    // Map API validation errors to form fields
    error.details.forEach((detail: any) => {
      setError(detail.field, {
        type: 'server',
        message: detail.message
      });
    });
  }
}
```

**UI:** Field-level errors pod inputami.

### 10.6 Empty state (brak danych)

**Scenariusz:** Użytkownik nie ma jeszcze talii.

**Obsługa:**
```tsx
{!isLoading && decks.length === 0 && !filters.searchQuery && (
  <EmptyState
    illustration={<EmptyIllustration />}
    title="Brak talii"
    description="Stwórz swoją pierwszą talię lub wygeneruj ją z AI!"
    actions={
      <>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Stwórz pierwszą talię
        </Button>
        <Button variant="outline" asChild>
          <a href="/generate">Wygeneruj z AI</a>
        </Button>
      </>
    }
  />
)}
```

### 10.7 Empty search results

**Scenariusz:** Wyszukiwanie nie zwróciło wyników.

**Obsługa:**
```tsx
{!isLoading && filteredDecks.length === 0 && filters.searchQuery && (
  <EmptyState
    title="Brak wyników"
    description={`Nie znaleziono talii pasujących do "${filters.searchQuery}"`}
    actions={
      <Button variant="outline" onClick={() => setFilters({ ...filters, searchQuery: '' })}>
        Wyczyść wyszukiwanie
      </Button>
    }
  />
)}
```

### 10.8 Błąd 403/404 przy edycji/usuwaniu

**Scenariusz:** Użytkownik próbuje edytować/usunąć talię która nie istnieje lub nie należy do niego.

**Obsługa:**
```typescript
// W useDeckActions
if (response.status === 403) {
  toast.error('Nie masz uprawnień do tej talii');
  // Refresh deck list
  refetch();
  return null;
}

if (response.status === 404) {
  toast.error('Talia nie została znaleziona');
  // Refresh deck list to remove stale data
  refetch();
  return null;
}
```

### 10.9 Rate limiting (przyszłość)

**Scenariusz:** Użytkownik wykonał zbyt wiele requestów.

**Obsługa:**
```typescript
if (response.status === 429) {
  const error: ErrorResponseDTO = await response.json();
  const retryAfter = error.retry_after || 60;

  toast.error(`Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter} sekund.`);

  // Opcjonalnie: Disable buttons na retry_after sekund
}
```

### 10.10 Optimistic update rollback

**Scenariusz:** Użytkownik usuwa talię, karta znika od razu (optimistic), ale API zwraca błąd.

**Obsługa:**
```typescript
// Optimistic delete
const previousDecks = decks;
removeDeck(deckId);

try {
  const response = await fetch(`/api/decks/${deckId}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error('Delete failed');
  }
} catch (err) {
  // Rollback
  setDecks(previousDecks);
  toast.error('Nie udało się usunąć talii');
}
```

**Decyzja dla MVP:** Nie używamy optimistic updates (zbyt złożone). Delete dopiero po potwierdzeniu API.

## 11. Kroki implementacji

### Krok 1: Przygotowanie infrastruktury

**1.1. Utworzenie struktury katalogów**
```bash
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DeckFilters.tsx
│   │   ├── SearchBar.tsx
│   │   ├── DeckGrid.tsx
│   │   ├── DeckCard.tsx
│   │   ├── SkeletonCard.tsx
│   │   ├── CreateDeckDialog.tsx
│   │   ├── EditDeckDialog.tsx
│   │   └── DeleteDeckConfirmDialog.tsx
│   ├── common/
│   │   ├── EmptyState.tsx
│   │   └── LoadMoreButton.tsx
│   └── ui/ (shadcn components)
├── hooks/
│   ├── useDeckList.ts
│   ├── useDeckActions.ts
│   └── useDebounce.ts
├── stores/
│   └── decks.store.ts
├── schemas/
│   └── deck.schema.ts
├── lib/
│   └── utils.ts (istniejący - cn helper)
└── pages/
    └── index.astro
```

**1.2. Instalacja zależności**
```bash
npm install zustand date-fns
npm install -D @types/node
```

**1.3. Konfiguracja shadcn/ui komponentów**
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add alert
```

### Krok 2: Implementacja typów i schematów

**2.1. Rozszerzenie `src/types.ts`**
- Dodać interfejs `DeckCardViewModel`
- Dodać interfejs `DashboardFilters`
- Dodać funkcje pomocnicze: `mapToDeckCardViewModel`, `formatFlashcardCount`

**2.2. Utworzenie `src/schemas/deck.schema.ts`**
```typescript
import { z } from 'zod';

export const deckNameSchema = z.object({
  name: z.string()
    .min(1, 'Nazwa talii jest wymagana')
    .max(255, 'Nazwa talii nie może przekraczać 255 znaków')
    .transform(val => val.trim())
});

export type DeckNameFormData = z.infer<typeof deckNameSchema>;
```

### Krok 3: Implementacja Zustand store

**3.1. Utworzenie `src/stores/decks.store.ts`**
- Zdefiniować interfejs `DecksStore`
- Zaimplementować store z devtools middleware
- Dodać wszystkie akcje: setDecks, appendDecks, addDeck, updateDeck, removeDeck

**3.2. Testowanie store w izolacji**
- Utworzyć prosty komponent testowy do weryfikacji store
- Sprawdzić czy devtools działają w przeglądarce

### Krok 4: Implementacja custom hooks

**4.1. Hook `useDebounce` (`src/hooks/useDebounce.ts`)**
- Najprostszy, zaczynamy od niego
- Testowanie z console.log w komponencie testowym

**4.2. Hook `useDeckActions` (`src/hooks/useDeckActions.ts`)**
- Implementacja createDeck, updateDeck, deleteDeck
- Integracja z Zustand store
- Obsługa błędów i toast notifications
- Testowanie każdej akcji osobno z mock API

**4.3. Hook `useDeckList` (`src/hooks/useDeckList.ts`)**
- Implementacja fetchDecks, loadMore
- Integracja z Zustand store
- Client-side filtering i sorting
- Mapping do DeckCardViewModel
- Testowanie z prawdziwym API

### Krok 5: Implementacja komponentów atomowych

**5.1. EmptyState (`src/components/common/EmptyState.tsx`)**
- Reużywalny komponent
- Props: title, description, illustration, actions
- Styling z Tailwind

**5.2. SkeletonCard (`src/components/dashboard/SkeletonCard.tsx`)**
- Używa shadcn Skeleton
- Imituje strukturę DeckCard

**5.3. LoadMoreButton (`src/components/common/LoadMoreButton.tsx`)**
- Prosty button z loading state
- Props: onClick, isLoading

**5.4. SearchBar (`src/components/dashboard/SearchBar.tsx`)**
- Input z ikoną lupy i przyciskiem X
- Integracja z useDebounce
- Props: value, onChange, placeholder

### Krok 6: Implementacja komponentów dialogów

**6.1. CreateDeckDialog (`src/components/dashboard/CreateDeckDialog.tsx`)**
- Shadcn Dialog wrapper
- React Hook Form + Zod validation
- Integracja z useDeckActions.createDeck
- Loading state, error handling
- Props: isOpen, onClose, onSuccess

**6.2. EditDeckDialog (`src/components/dashboard/EditDeckDialog.tsx`)**
- Podobny do CreateDeckDialog
- Pre-wypełniony input (defaultValues)
- Integracja z useDeckActions.updateDeck
- Props: isOpen, deckId, currentName, onClose, onSuccess

**6.3. DeleteDeckConfirmDialog (`src/components/dashboard/DeleteDeckConfirmDialog.tsx`)**
- Warning styling (destructive variant)
- Checkbox potwierdzenia
- Wyświetlanie nazwy talii i liczby fiszek
- Integracja z useDeckActions.deleteDeck
- Props: isOpen, deckId, deckName, flashcardCount, onClose, onSuccess

### Krok 7: Implementacja komponentów Dashboard

**7.1. DeckCard (`src/components/dashboard/DeckCard.tsx`)**
- Shadcn Card z responsive layout
- Wyświetlanie nazwy, liczby fiszek, czasu aktualizacji
- DropdownMenu z akcjami (Edit, Delete)
- Hover effect
- Click handler do nawigacji
- Props: deck (DeckCardViewModel), onEdit, onDelete

**7.2. DeckGrid (`src/components/dashboard/DeckGrid.tsx`)**
- Responsive grid (1/2/3 kolumny)
- Mapowanie DeckCard
- Warunkowe renderowanie EmptyState
- Props: decks, isSearchActive, onCreateClick, onGenerateClick

**7.3. DeckFilters (`src/components/dashboard/DeckFilters.tsx`)**
- Flex container z SearchBar i Select
- Parsing wartości sortowania (np. "name:asc" → {sortBy: 'name', order: 'asc'})
- Props: onSearchChange, onSortChange

**7.4. DashboardHeader (`src/components/dashboard/DashboardHeader.tsx`)**
- Tytuł + opis + przycisk "Stwórz nową talię"
- Props: onCreateClick

**7.5. DashboardView (`src/components/dashboard/DashboardView.tsx`)**
- Główny kontener React
- Integracja wszystkich hooks (useDeckList, useDeckActions)
- Stan dialogów (create, edit, delete)
- Kompozycja wszystkich komponentów
- Conditional rendering (loading, error, success, empty)
- Brak propsów (komponent główny)

### Krok 8: Integracja z Astro

**8.1. Utworzenie `src/pages/index.astro`**
```astro
---
import ProtectedLayout from '@/layouts/ProtectedLayout.astro';
import DashboardView from '@/components/dashboard/DashboardView';

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/login');
}

// Opcjonalnie: Check for FTUE
// const hasDecks = await checkIfUserHasDecks(user.id);
// if (!hasDecks) {
//   return Astro.redirect('/generate');
// }
---

<ProtectedLayout title="Dashboard - 10xCards">
  <DashboardView client:load />
</ProtectedLayout>
```

**8.2. Weryfikacja middleware**
- Sprawdzić czy `Astro.locals.user` jest poprawnie ustawiony
- Testować redirect do /login gdy niezalogowany

### Krok 9: Testowanie end-to-end

**9.1. Scenariusze testowe (manualne)**

**Test 1: Pierwsze załadowanie (Empty State)**
1. Zaloguj się jako nowy użytkownik (brak talii)
2. Zweryfikuj redirect do /generate (FTUE) LUB wyświetlenie EmptyState
3. Kliknij "Stwórz pierwszą talię"
4. Wypełnij formularz i zapisz
5. Sprawdź czy karta talii pojawia się

**Test 2: Tworzenie talii**
1. Kliknij "Stwórz nową talię"
2. Pozostaw pole puste → sprawdź błąd walidacji
3. Wpisz > 255 znaków → sprawdź błąd walidacji
4. Wpisz poprawną nazwę → zapisz
5. Sprawdź toast notification
6. Sprawdź czy nowa karta pojawia się na liście

**Test 3: Duplikat nazwy**
1. Utwórz talię "Test"
2. Spróbuj utworzyć kolejną talię "Test"
3. Sprawdź błąd 409: "Talia o tej nazwie już istnieje"

**Test 4: Wyszukiwanie**
1. Utwórz kilka talii z różnymi nazwami
2. Wpisz frazę w search bar
3. Sprawdź debounce (300ms)
4. Sprawdź czy lista jest filtrowana
5. Wyczyść search → sprawdź czy wszystkie talie wracają

**Test 5: Sortowanie**
1. Utwórz talie z różnymi nazwami i czasami
2. Wybierz "Nazwa A-Z" → sprawdź sortowanie
3. Wybierz "Nazwa Z-A" → sprawdź sortowanie
4. Wybierz "Najstarsze" → sprawdź sortowanie

**Test 6: Edycja nazwy**
1. Kliknij menu akcji na karcie
2. Wybierz "Edytuj nazwę"
3. Zmień nazwę → zapisz
4. Sprawdź toast notification
5. Sprawdź czy nowa nazwa wyświetla się na karcie

**Test 7: Usuwanie talii**
1. Kliknij "Usuń talię" w menu
2. Sprawdź czy przycisk "Usuń" jest disabled
3. Zaznacz checkbox "Rozumiem"
4. Kliknij "Usuń talię"
5. Sprawdź toast notification
6. Sprawdź czy karta znika z listy

**Test 8: Paginacja**
1. Utwórz > 20 talii (lub zmień limit w API)
2. Sprawdź czy przycisk "Załaduj więcej" jest widoczny
3. Kliknij "Załaduj więcej"
4. Sprawdź czy nowe talie się ładują
5. Sprawdź czy przycisk znika gdy wszystkie załadowane

**Test 9: Nawigacja**
1. Kliknij na kartę talii
2. Sprawdź czy następuje redirect do /decks/[id]

**Test 10: Obsługa błędów**
1. Wyłącz serwer API
2. Spróbuj załadować dashboard
3. Sprawdź error state z przyciskiem retry
4. Włącz serwer
5. Kliknij retry → sprawdź czy dane się ładują

**9.2. Testy responsywności**
1. Mobile (375px): 1 kolumna grid, hamburger menu
2. Tablet (768px): 2 kolumny grid
3. Desktop (1024px+): 3 kolumny grid

**9.3. Testy dostępności**
1. Nawigacja klawiaturą (Tab, Enter, Esc)
2. Screen reader (NVDA/JAWS)
3. Focus indicators widoczne
4. ARIA labels obecne

### Krok 10: Optymalizacje i refaktoryzacja

**10.1. Performance**
- Sprawdzić czy nie ma niepotrzebnych re-renderów (React DevTools Profiler)
- Dodać React.memo gdzie potrzeba (np. DeckCard)
- Zweryfikować bundle size

**10.2. Code quality**
- ESLint check
- Prettier formatting
- TypeScript strict mode errors

**10.3. Dokumentacja**
- Dodać JSDoc comments do komponentów i hooków
- Zaktualizować README jeśli potrzeba

### Krok 11: Deployment i monitorowanie

**11.1. Build production**
```bash
npm run build
npm run preview
```

**11.2. Testowanie w production-like environment**
- Sprawdzić czy wszystkie funkcje działają
- Sprawdzić performance (Lighthouse)

**11.3. Deploy na staging/production**
- Zgodnie z procedurami projektu (Vercel/Netlify/DigitalOcean)

**11.4. Monitoring**
- Skonfigurować error tracking (Sentry - jeśli używamy)
- Monitorować logi błędów w pierwszych godzinach

---

## Podsumowanie

Plan implementacji widoku Dashboard / Lista Talii został szczegółowo opracowany z uwzględnieniem wszystkich wymagań z PRD, user stories oraz specyfikacji API. Implementacja powinna być wykonywana stopniowo, zgodnie z krokami opisanymi powyżej, zaczynając od fundamentów (typy, store, hooks) i kończąc na komponentach UI oraz testowaniu.

Kluczowe aspekty do zapamiętania:
- Używamy Zustand do globalnego stanu listy talii
- Client-side filtering i sorting dla lepszego UX
- Debounce 300ms dla search
- Pełna walidacja formularzy przez Zod
- Obsługa wszystkich błędów API z user-friendly komunikatami
- Responsive design (mobile-first)
- Accessibility (keyboard navigation, screen readers)
- Toast notifications dla feedback użytkownika
- Zgodność z istniejącym tech stackiem (Astro + React + Shadcn)

Całkowity szacowany czas implementacji: **5-7 dni roboczych** dla doświadczonego frontend developera.
