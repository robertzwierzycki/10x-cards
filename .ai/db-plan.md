# Plan schematu bazy danych PostgreSQL dla 10xCards

Na podstawie dokumentu wymagań produktu (PRD), notatek z sesji planowania i analizy stosu technologicznego, poniżej przedstawiono kompleksowy schemat bazy danych PostgreSQL.

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### Funkcja pomocnicza do aktualizacji `updated_at`

Najpierw definiujemy funkcję i trigger, które będą automatycznie aktualizować pole `updated_at` przy każdej modyfikacji wiersza.

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Tabela: `profiles`

Przechowuje publiczne dane użytkowników, rozszerzając tabelę `auth.users` z Supabase.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger do automatycznej aktualizacji 'updated_at'
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
```

### Tabela: `decks`

Przechowuje talie fiszek stworzone przez użytkowników.

```sql
CREATE TABLE public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Użytkownik nie może mieć dwóch talii o tej samej nazwie
  CONSTRAINT unique_deck_name_per_user UNIQUE (user_id, name)
);

-- Trigger do automatycznej aktualizacji 'updated_at'
CREATE TRIGGER on_decks_updated
  BEFORE UPDATE ON public.decks
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
```

### Tabela: `flashcards`

Przechowuje poszczególne fiszki w ramach talii.

```sql
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  front VARCHAR(5000) NOT NULL,
  back VARCHAR(5000) NOT NULL,
  is_ai_generated BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Walidacja długości tekstów
  CONSTRAINT check_front_length CHECK (char_length(front) >= 1),
  CONSTRAINT check_back_length CHECK (char_length(back) >= 1)
);

-- Trigger do automatycznej aktualizacji 'updated_at'
CREATE TRIGGER on_flashcards_updated
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
```

### Tabela: `study_records`

Przechowuje dane algorytmu Spaced Repetition (SR) dla każdej fiszki i użytkownika.

```sql
CREATE TABLE public.study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,

  -- Pola specyficzne dla algorytmu SR (np. FSRS)
  due_date TIMESTAMPTZ NOT NULL, -- Data następnej powtórki
  stability NUMERIC, -- Stabilność (jak długo karta pozostaje w pamięci)
  difficulty NUMERIC, -- Trudność karty
  lapses INTEGER, -- Liczba pomyłek
  state VARCHAR(50), -- Stan karty (np. new, learning, review)

  last_review_date TIMESTAMPTZ, -- Data ostatniej oceny (dla metryki KSM 2)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Każdy użytkownik ma tylko jeden rekord nauki dla danej fiszki
  CONSTRAINT unique_study_record_per_user_flashcard UNIQUE (user_id, flashcard_id),

  -- Walidacja wartości
  CONSTRAINT check_difficulty_range CHECK (difficulty IS NULL OR (difficulty >= 0 AND difficulty <= 10)),
  CONSTRAINT check_stability_positive CHECK (stability IS NULL OR stability >= 0),
  CONSTRAINT check_lapses_non_negative CHECK (lapses IS NULL OR lapses >= 0),
  CONSTRAINT check_state_values CHECK (state IS NULL OR state IN ('new', 'learning', 'review', 'relearning'))
);

-- Trigger do automatycznej aktualizacji 'updated_at'
CREATE TRIGGER on_study_records_updated
  BEFORE UPDATE ON public.study_records
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
```

## 2. Relacje między tabelami

- **`profiles` 1-do-1 `auth.users`**: Każdy użytkownik w `auth.users` może mieć jeden profil. Klucz główny `profiles.id` jest jednocześnie kluczem obcym wskazującym na `auth.users.id`.
- **`decks` N-do-1 `auth.users`**: Użytkownik może mieć wiele talii, ale każda talia należy do jednego użytkownika.
- **`flashcards` N-do-1 `decks`**: Talia może zawierać wiele fiszek, ale każda fiszka należy do jednej talii.
- **`study_records` N-do-N (`users` i `flashcards`)**: Tabela łącząca, która śledzi postęp nauki konkretnej fiszki przez konkretnego użytkownika.

Wszystkie relacje z tabelą `auth.users`, `decks` i `flashcards` używają `ON DELETE CASCADE`, co zapewnia, że:
- Usunięcie użytkownika usuwa jego profil, wszystkie talie, fiszki i rekordy nauki.
- Usunięcie talii usuwa wszystkie zawarte w niej fiszki oraz powiązane z nimi rekordy nauki.

## 3. Indeksy

Indeksy są kluczowe dla wydajności zapytań, zwłaszcza przy dużej liczbie rekordów.

```sql
-- Indeks na kluczu obcym w tabeli 'decks'
CREATE INDEX idx_decks_user_id ON public.decks(user_id);

-- Indeks na kluczu obcym w tabeli 'flashcards'
CREATE INDEX idx_flashcards_deck_id ON public.flashcards(deck_id);

-- Indeksy na kluczach obcych w tabeli 'study_records'
CREATE INDEX idx_study_records_user_id ON public.study_records(user_id);
CREATE INDEX idx_study_records_flashcard_id ON public.study_records(flashcard_id);

-- Kluczowy indeks złożony do szybkiego wyszukiwania fiszek do powtórki dla danego użytkownika
CREATE INDEX idx_study_records_user_due_date ON public.study_records(user_id, due_date);

-- Indeksy pełnotekstowe dla wyszukiwania w fiszkach (opcjonalne, dla przyszłej funkcji wyszukiwania)
CREATE INDEX idx_flashcards_front_gin ON public.flashcards USING gin(to_tsvector('simple', front));
CREATE INDEX idx_flashcards_back_gin ON public.flashcards USING gin(to_tsvector('simple', back));
```

## 4. Zasady PostgreSQL (Row-Level Security)

Aby zapewnić ścisłą izolację danych, dla każdej tabeli zostaną włączone zasady bezpieczeństwa na poziomie wiersza (RLS).

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;

-- Polityka dla 'profiles': Użytkownicy mogą widzieć i edytować tylko własny profil.
CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

-- Polityka dla 'decks': Użytkownicy mogą zarządzać (CRUD) tylko własnymi taliami.
CREATE POLICY "Users can manage their own decks"
ON public.decks FOR ALL
USING (auth.uid() = user_id);

-- Polityka dla 'flashcards': Użytkownicy mogą zarządzać fiszkami należącymi do ich talii.
CREATE POLICY "Users can manage flashcards in their own decks"
ON public.flashcards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.decks d
    WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
  )
);

-- Polityka dla 'study_records': Użytkownicy mogą zarządzać tylko własnymi rekordami nauki.
CREATE POLICY "Users can manage their own study records"
ON public.study_records FOR ALL
USING (auth.uid() = user_id);
```

## 5. Dodatkowe uwagi i decyzje projektowe

1.  **Identyfikatory UUID**: Wszystkie klucze główne to `UUID`. Jest to zgodne z najlepszymi praktykami Supabase i ułatwia generowanie identyfikatorów po stronie klienta, jeśli zajdzie taka potrzeba.
2.  **Pragmatyczne podejście do `DEFAULT`**: Zachowano wartości domyślne tylko dla pól technicznych (`id`, `created_at`, `updated_at`), co jest kompromisem między czystością kodu a praktycznością. Pola biznesowe nie mają wartości domyślnych - logika aplikacji jest odpowiedzialna za ich jawne ustawianie.
3.  **Zwiększone limity `VARCHAR`**: Dla pól tekstowych fiszek użyto `VARCHAR(5000)` zamiast pierwotnych `2000`, aby umożliwić użytkownikom edycję i rozszerzanie wygenerowanych przez AI fiszek. Limit 5000 znaków zapewnia wystarczającą przestrzeń przy zachowaniu rozsądnych ograniczeń.
4.  **CHECK constraints**: Dodano walidację na poziomie bazy danych dla kluczowych pól (`difficulty`, `stability`, `lapses`, `state`), co zapewnia integralność danych niezależnie od walidacji aplikacyjnej.
5.  **Pola dla algorytmu SR**: Pola w `study_records` mogą przyjmować wartości NULL, co umożliwia elastyczne wdrożenie różnych algorytmów SR. Constraints sprawdzają wartości tylko gdy nie są NULL.
6.  **Trigger `updated_at`**: Zastosowanie triggera bazodanowego do aktualizacji `updated_at` odciąża aplikację i zapewnia spójność danych.
7.  **Indeksy pełnotekstowe**: Przygotowano indeksy GIN dla przyszłej funkcji wyszukiwania w treści fiszek. Są one opcjonalne i mogą być pominięte w pierwszej wersji MVP.
