# Plan implementacji widoku Sesji Nauki (Study Session View)

## 1. Przegląd
Widok Sesji Nauki to kluczowy moduł aplikacji 10xCards, który umożliwia użytkownikom efektywną naukę fiszek za pomocą algorytmu przestrzennych powtórek (spaced repetition). Widok prezentuje fiszki zaplanowane do powtórki, pozwala na dwuetapowe odkrywanie treści (przód/tył) oraz ocenę znajomości materiału. Interfejs jest zaprojektowany w sposób minimalistyczny, skupiający uwagę użytkownika na nauce.

## 2. Routing widoku
- **Ścieżka główna**: `/study/[deckId]`
- **Parametry**:
  - `deckId` (UUID) - identyfikator talii do nauki
  - Query param `limit` (opcjonalny) - liczba kart do pobrania (domyślnie 20, max 50)
- **Typ renderowania**: SSR z Astro, interaktywna wyspa React z dyrektywą `client:load`

## 3. Struktura komponentów

```
StudySessionPage.astro
└── StudySessionContainer.tsx (React Island)
    ├── StudySessionHeader
    │   ├── Breadcrumb
    │   ├── ProgressIndicator
    │   └── ExitButton
    ├── StudySessionLoading
    ├── StudySessionEmpty
    ├── StudySessionContent
    │   ├── StudyCard
    │   │   ├── CardStateBadge
    │   │   ├── CardFront
    │   │   └── CardBack
    │   ├── RevealButton
    │   └── RatingButtons
    ├── StudySessionSummary
    │   ├── SummaryStats
    │   └── SummaryActions
    └── ExitConfirmationDialog
```

## 4. Szczegóły komponentów

### StudySessionPage (Astro)
- **Opis komponentu**: Strona główna widoku nauki, odpowiedzialna za routing i inicjalizację
- **Główne elementy**:
  - Layout z nawigacją
  - Kontener dla React Island
  - Przekazanie `deckId` do komponentu React
- **Obsługiwane interakcje**: Brak (statyczny wrapper)
- **Obsługiwana walidacja**:
  - Walidacja formatu UUID dla `deckId`
  - Przekierowanie do 404 jeśli format nieprawidłowy
- **Typy**: Brak specyficznych
- **Propsy**: Brak (parametry z routingu)

### StudySessionContainer (React)
- **Opis komponentu**: Główny kontener zarządzający całą sesją nauki, stanem i przepływem danych
- **Główne elementy**:
  - Komponenty dla różnych stanów UI (loading, empty, studying, complete)
  - Logika przełączania między stanami
  - Zarządzanie sesją i postępem
- **Obsługiwane interakcje**:
  - Inicjalizacja sesji przy montowaniu
  - Zarządzanie przepływem nauki
  - Obsługa zakończenia sesji
- **Obsługiwana walidacja**:
  - Weryfikacja odpowiedzi z API
  - Sprawdzenie czy sesja zawiera karty
- **Typy**:
  - `StudySessionDTO`
  - `StudySessionState`
  - `SessionUIState`
- **Propsy**:
  ```typescript
  interface StudySessionContainerProps {
    deckId: string;
    limit?: number;
  }
  ```

### StudySessionHeader
- **Opis komponentu**: Nagłówek sesji z nawigacją i postępem
- **Główne elementy**:
  - Breadcrumb nawigacja
  - Wskaźnik postępu (X/Y kart)
  - Przycisk wyjścia
- **Obsługiwane interakcje**:
  - Kliknięcie na breadcrumb (nawigacja)
  - Kliknięcie przycisku wyjścia
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `ProgressData { current: number, total: number }`
- **Propsy**:
  ```typescript
  interface StudySessionHeaderProps {
    deckName: string;
    currentCard: number;
    totalCards: number;
    onExit: () => void;
  }
  ```

### StudyCard
- **Opis komponentu**: Komponent wyświetlający pojedynczą fiszkę z animacją przejścia między przodem a tyłem
- **Główne elementy**:
  - Duża karta centralna
  - Badge ze stanem karty (new/learning/review/relearning)
  - Treść przodu i tyłu
  - Animacja flip
- **Obsługiwane interakcje**:
  - Wyświetlanie przodu/tyłu
  - Animacja przejścia
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `StudyCardDTO`
  - `CardDisplayState`
- **Propsy**:
  ```typescript
  interface StudyCardProps {
    card: StudyCardDTO;
    isRevealed: boolean;
    isAnimating: boolean;
  }
  ```

### RevealButton
- **Opis komponentu**: Przycisk do odkrywania tyłu karty
- **Główne elementy**:
  - Duży przycisk primary
  - Tekst "Pokaż odpowiedź"
  - Obsługa klawisza Space
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku
  - Naciśnięcie spacji
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specyficznych
- **Propsy**:
  ```typescript
  interface RevealButtonProps {
    onReveal: () => void;
    disabled?: boolean;
  }
  ```

### RatingButtons
- **Opis komponentu**: Zestaw trzech przycisków do oceny znajomości karty
- **Główne elementy**:
  - Przycisk "Nie wiem" (czerwony/destructive)
  - Przycisk "Wiem" (niebieski/default)
  - Przycisk "Opanowane" (zielony/success)
  - Wskaźnik ładowania podczas wysyłania
- **Obsługiwane interakcje**:
  - Kliknięcie na przycisk oceny
  - Skróty klawiszowe (1, 2, 3)
- **Obsługiwana walidacja**:
  - Przyciski disabled podczas wysyłania
  - Walidacja wartości rating przed wysłaniem
- **Typy**:
  - `ReviewRating`
- **Propsy**:
  ```typescript
  interface RatingButtonsProps {
    onRate: (rating: ReviewRating) => void;
    isSubmitting: boolean;
    disabled?: boolean;
  }
  ```

### StudySessionSummary
- **Opis komponentu**: Ekran podsumowania po zakończeniu sesji nauki
- **Główne elementy**:
  - Ikona/animacja sukcesu
  - Statystyki sesji (liczba powtórzonych, breakdown ocen)
  - Przyciski akcji (powrót do talii, kontynuuj naukę)
- **Obsługiwane interakcje**:
  - Nawigacja do talii
  - Opcjonalne kontynuowanie nauki
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `SessionStats`
  - `StudyStatsDTO` (opcjonalnie)
- **Propsy**:
  ```typescript
  interface StudySessionSummaryProps {
    stats: SessionStats;
    deckId: string;
    deckName: string;
    canContinue: boolean;
  }
  ```

### StudySessionEmpty
- **Opis komponentu**: Stan pusty gdy brak kart do powtórki
- **Główne elementy**:
  - Ilustracja SVG
  - Komunikat "Brak fiszek do powtórki dzisiaj"
  - Przycisk powrotu do talii
- **Obsługiwane interakcje**:
  - Nawigacja do talii
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specyficznych
- **Propsy**:
  ```typescript
  interface StudySessionEmptyProps {
    deckId: string;
    deckName: string;
  }
  ```

### ExitConfirmationDialog
- **Opis komponentu**: Modal potwierdzający wyjście z sesji
- **Główne elementy**:
  - Dialog modalny
  - Komunikat z informacją o postępie
  - Przyciski: Zakończ / Anuluj
- **Obsługiwane interakcje**:
  - Potwierdzenie wyjścia
  - Anulowanie
  - Klawisz Esc
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `SessionProgress`
- **Propsy**:
  ```typescript
  interface ExitConfirmationDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    reviewedCount: number;
  }
  ```

## 5. Typy

```typescript
// Stan sesji nauki
interface StudySessionState {
  session: StudySessionDTO | null;
  currentCardIndex: number;
  isCardRevealed: boolean;
  isSubmitting: boolean;
  sessionStats: SessionStats;
  uiState: SessionUIState;
  error: string | null;
}

// Statystyki sesji
interface SessionStats {
  totalReviewed: number;
  againCount: number;
  goodCount: number;
  easyCount: number;
  startTime: Date;
  endTime?: Date;
}

// Stan interfejsu
type SessionUIState = 'loading' | 'empty' | 'studying' | 'complete' | 'error';

// Stan wyświetlania karty
interface CardDisplayState {
  isFlipped: boolean;
  isAnimating: boolean;
  animationDuration: number;
}

// Postęp sesji
interface SessionProgress {
  current: number;
  total: number;
  reviewed: number;
  remaining: number;
}

// Dane karty z dodatkowymi metadanymi UI
interface StudyCardUI extends StudyCardDTO {
  isReviewed: boolean;
  rating?: ReviewRating;
  reviewedAt?: Date;
}

// Konfiguracja skrótów klawiszowych
interface KeyboardShortcuts {
  reveal: string; // 'Space'
  again: string; // '1'
  good: string; // '2'
  easy: string; // '3'
  exit: string; // 'Escape'
}

// Stan badge'a karty
interface CardStateBadgeConfig {
  state: StudyState;
  label: string;
  color: 'blue' | 'yellow' | 'green' | 'red';
}
```

## 6. Zarządzanie stanem

### Custom Hook: useStudySession
```typescript
const useStudySession = (deckId: string, limit?: number) => {
  // Stan główny
  const [state, setState] = useState<StudySessionState>(initialState);

  // Funkcje API
  const initializeSession = async () => { /* GET /api/study/session/:deckId */ };
  const submitRating = async (rating: ReviewRating) => { /* POST /api/study/review */ };
  const getSessionStats = async () => { /* GET /api/study/stats/:deckId */ };

  // Logika nawigacji między kartami
  const getCurrentCard = () => state.session?.cards_due[state.currentCardIndex];
  const revealCard = () => setState(prev => ({ ...prev, isCardRevealed: true }));
  const nextCard = () => { /* Advance to next card or complete */ };

  // Obsługa skrótów klawiszowych
  useKeyboardShortcuts({
    onReveal: revealCard,
    onRate: submitRating,
    onExit: handleExit
  });

  return {
    state,
    actions: {
      initializeSession,
      revealCard,
      submitRating,
      exitSession
    },
    computed: {
      currentCard: getCurrentCard(),
      progress: getProgress(),
      canContinue: checkCanContinue()
    }
  };
};
```

### Store Zustand (opcjonalnie)
```typescript
interface StudyStore {
  // Cache ostatnich sesji
  recentSessions: Map<string, StudySessionDTO>;
  // Statystyki globalne
  globalStats: { totalReviewed: number; streak: number };
  // Akcje
  cacheSession: (deckId: string, session: StudySessionDTO) => void;
  updateGlobalStats: (stats: SessionStats) => void;
}
```

## 7. Integracja API

### Inicjalizacja sesji
```typescript
// GET /api/study/session/:deckId
// Request: StudySessionQueryParams { limit?: number }
// Response: StudySessionDTO

const initializeSession = async (deckId: string, limit = 20): Promise<StudySessionDTO> => {
  const response = await fetch(`/api/study/session/${deckId}?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
};
```

### Wysłanie oceny
```typescript
// POST /api/study/review
// Request: SubmitReviewCommand
// Response: ReviewResponseDTO

const submitRating = async (command: SubmitReviewCommand): Promise<ReviewResponseDTO> => {
  const response = await fetch('/api/study/review', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
};
```

### Pobieranie statystyk (opcjonalne)
```typescript
// GET /api/study/stats/:deckId
// Response: StudyStatsDTO

const getSessionStats = async (deckId: string): Promise<StudyStatsDTO> => {
  const response = await fetch(`/api/study/stats/${deckId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
};
```

## 8. Interakcje użytkownika

### Przepływ główny
1. **Wejście na stronę** → Wyświetlenie loadera → Inicjalizacja sesji
2. **Wyświetlenie karty** → Widok przodu karty z przyciskiem "Pokaż odpowiedź"
3. **Odkrycie karty** → Kliknięcie przycisku lub spacja → Animacja flip → Pokazanie tyłu
4. **Ocena znajomości** → Kliknięcie jednego z 3 przycisków lub klawisz 1/2/3
5. **Wysłanie oceny** → Blokada UI → Wywołanie API → Przejście do następnej karty
6. **Koniec sesji** → Wyświetlenie podsumowania ze statystykami

### Przepływy alternatywne
- **Wyjście z sesji** → Klawisz Esc lub przycisk → Dialog potwierdzenia → Nawigacja
- **Brak kart** → Wyświetlenie EmptyState → Przycisk powrotu
- **Błąd ładowania** → Komunikat błędu → Przycisk ponownej próby
- **Kontynuacja nauki** → Na ekranie podsumowania → Ponowna inicjalizacja

### Skróty klawiszowe
- **Spacja**: Pokaż odpowiedź (gdy przód widoczny)
- **1**: Ocena "Nie wiem" (gdy tył widoczny)
- **2**: Ocena "Wiem" (gdy tył widoczny)
- **3**: Ocena "Opanowane" (gdy tył widoczny)
- **Escape**: Wyjście z sesji (z potwierdzeniem)

## 9. Warunki i walidacja

### Walidacja wejściowa
- **deckId**: Musi być prawidłowym UUID (walidacja w komponencie Astro)
- **limit**: Liczba całkowita między 1 a 50 (domyślnie 20)

### Warunki biznesowe
- **Rozpoczęcie nauki**: Talia musi zawierać karty z `due_date <= NOW()`
- **Wyświetlenie przycisku oceny**: Tylko gdy tył karty jest widoczny
- **Blokada interakcji**: Podczas wysyłania oceny wszystkie przyciski są nieaktywne
- **Kontynuacja nauki**: Dostępna tylko gdy `cards_due_today > reviewed_count`

### Walidacja API
- **Autoryzacja**: Użytkownik musi być właścicielem talii (weryfikacja po stronie API)
- **study_record_id**: Musi należeć do zalogowanego użytkownika
- **flashcard_id**: Musi pasować do study_record
- **rating**: Musi być jedną z wartości: "again", "good", "easy"

### Warunki UI
- **Przycisk "Rozpocznij naukę"**: Disabled gdy `cards_due_today === 0`
- **Przyciski oceny**: Widoczne tylko po odkryciu tyłu karty
- **Progress bar**: Aktualizowany po każdej ocenionej karcie
- **Badge stanu karty**: Kolor zależny od wartości `state` z API

## 10. Obsługa błędów

### Błędy inicjalizacji
- **404 Deck not found**: Przekierowanie do listy talii z komunikatem
- **403 Access denied**: Przekierowanie do listy talii z komunikatem o braku dostępu
- **400 Invalid UUID**: Przekierowanie do 404
- **500 Server error**: Wyświetlenie komunikatu z przyciskiem retry

### Błędy podczas nauki
- **Błąd wysyłania oceny**:
  - Pierwsza próba: Automatyczny retry po 1 sekundzie
  - Druga próba: Wyświetlenie toastu z błędem i przyciskiem retry
  - Opcja pominięcia karty i kontynuacji

### Błędy sieciowe
- **Timeout**: Komunikat "Przekroczono czas oczekiwania" + retry
- **Offline**: Komunikat "Brak połączenia z internetem" + automatyczny retry po powrocie online

### Logowanie błędów
```typescript
const handleError = (error: Error, context: string) => {
  console.error(`[StudySession] ${context}:`, error);

  // Wysłanie do systemu monitoringu (np. Sentry)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { component: 'StudySession', context },
    });
  }

  // Wyświetlenie użytkownikowi
  showErrorToast(getErrorMessage(error));
};
```

## 11. Kroki implementacji

### Faza 1: Przygotowanie
1. Utworzyć plik strony `/src/pages/study/[deckId].astro`
2. Skonfigurować routing i walidację parametrów
3. Przygotować layout z breadcrumb navigation

### Faza 2: Komponenty podstawowe
4. Zaimplementować `StudySessionContainer` z podstawowym zarządzaniem stanem
5. Utworzyć custom hook `useStudySession` z logiką biznesową
6. Zaimplementować `StudySessionLoading` z skeleton loaderami
7. Utworzyć `StudySessionEmpty` dla stanu pustego

### Faza 3: Komponenty nauki
8. Zaimplementować `StudyCard` z animacją flip
9. Utworzyć `CardStateBadge` z kolorami dla stanów
10. Zaimplementować `RevealButton` z obsługą spacji
11. Utworzyć `RatingButtons` z trzema wariantami

### Faza 4: Integracja API
12. Zaimplementować funkcję `initializeSession` z obsługą błędów
13. Utworzyć funkcję `submitRating` z retry logic
14. Dodać opcjonalne `getSessionStats` dla podsumowania
15. Przetestować przepływ z prawdziwym API

### Faza 5: Funkcje dodatkowe
16. Zaimplementować `StudySessionHeader` z progress barem
17. Utworzyć `ExitConfirmationDialog` z informacją o postępie
18. Zaimplementować `StudySessionSummary` ze statystykami
19. Dodać obsługę skrótów klawiszowych

### Faza 6: Optymalizacja
20. Dodać animacje przejść między kartami (fade in/out)
21. Zaimplementować optimistic updates dla płynności
22. Dodać caching sesji w Zustand (opcjonalnie)
23. Zoptymalizować bundle size (lazy loading gdzie możliwe)

### Faza 7: Testowanie
24. Napisać testy jednostkowe dla hooka `useStudySession`
25. Przetestować skróty klawiszowe
26. Sprawdzić responsywność na różnych urządzeniach
27. Przetestować obsługę błędów i edge cases

### Faza 8: Dostępność
28. Dodać ARIA labels i live regions
29. Sprawdzić nawigację klawiaturą
30. Zweryfikować kontrast kolorów
31. Przetestować z screen readerem