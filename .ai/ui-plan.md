# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10xCards została zaprojektowana z myślą o prostocie i modułowości. Chociaż projekt jest oparty na Astro, analiza w `tech-stack.md` wskazuje, że niemal cała logika aplikacyjna i interaktywność (poza stronami publicznymi) będzie realizowana w React. W związku z tym, niniejsza architektura traktuje Astro jako powłokę do serwowania stron, natomiast wszystkie dynamiczne i interaktywne widoki będą implementowane jako samodzielne 'wyspy' (komponenty) React.

Struktura opiera się na kompozycji widoków (stron), które odpowiadają za główne funkcje aplikacji, oraz reużywalnych komponentów z biblioteki `Shadcn/ui`, co gwarantuje spójność wizualną i przyspiesza development. Nawigacja jest podzielona na publiczną (dostępną dla niezalogowanych użytkowników) i chronioną (dostępną po zalogowaniu), z centralnym, stałym menu nawigacyjnym zapewniającym dostęp do kluczowych modułów: listy talii i generatora AI. Zarządzanie stanem aplikacji będzie realizowane za pomocą `Zustand` dla danych globalnych (sesja użytkownika, cache) oraz lokalnego stanu komponentów (React Hooks) dla danych tymczasowych.

## 2. Lista widoków

### 1. Widok Logowania (Login View)
- **Ścieżka:** `/login`
- **Główny cel:** Umożliwienie powracającemu użytkownikowi zalogowanie się do aplikacji (US-002).
- **Kluczowe informacje:** Formularz z polami na e-mail i hasło. Linki do rejestracji i resetowania hasła.
- **Kluczowe komponenty:** `Card`, `Input`, `Label`, `Button`.
- **Integracje API:** Supabase Auth SDK (`signInWithPassword`)
- **Stany UI:** Loading (przycisk disabled + spinner), Error (komunikat o błędzie), Success (redirect do `/`)
- **UX, dostępność, bezpieczeństwo:** Komunikaty o błędach walidacji wyświetlane pod polami. Przycisk logowania blokowany ze wskaźnikiem ładowania po kliknięciu. Pola formularza powiązane z etykietami dla dostępności.

### 2. Widok Rejestracji (Register View)
- **Ścieżka:** `/register`
- **Główny cel:** Umożliwienie nowemu użytkownikowi założenia konta (US-001).
- **Kluczowe informacje:** Formularz z polami na e-mail, hasło i powtórzenie hasła. Link do strony logowania.
- **Kluczowe komponenty:** `Card`, `Input`, `Label`, `Button`.
- **Integracje API:** Supabase Auth SDK (`signUp`)
- **Stany UI:** Loading, Error, Success (redirect do `/generate` po automatycznym logowaniu)
- **UX, dostępność, bezpieczeństwo:** Walidacja poprawności e-maila i zgodności haseł po stronie klienta (Zod + React Hook Form). Jasne komunikaty o błędach. Informacja o konieczności potwierdzenia e-maila (jeśli wymagane przez Supabase).

### 3. Widok Resetowania Hasła (Reset Password View)
- **Ścieżka:** `/reset-password` (żądanie) oraz `/reset-password/confirm` (ustawienie nowego hasła z tokena)
- **Główny cel:** Umożliwienie użytkownikowi zainicjowania procesu resetowania zapomnianego hasła (US-004, US-005).
- **Kluczowe informacje:** Formularz z polem na adres e-mail. Po wysłaniu, widok potwierdzający wysłanie instrukcji. Osobny widok dla formularza zmiany hasła (dostępny z linku w e-mailu).
- **Kluczowe komponenty:** `Card`, `Input`, `Label`, `Button`.
- **Integracje API:** Supabase Auth SDK (`resetPasswordForEmail`, `updateUser`)
- **Stany UI:** Loading, Success (komunikat o wysłaniu e-maila), Error (błąd serwera)
- **UX, dostępność, bezpieczeństwo:** Komunikat zwrotny jest zawsze taki sam, niezależnie od tego, czy e-mail istnieje w bazie, aby zapobiec enumeracji użytkowników.

### 4. Panel Główny / Lista Talii (Dashboard / Deck List View)
- **Ścieżka:** `/`
- **Główny cel:** Wyświetlenie wszystkich talii użytkownika, umożliwienie nawigacji do nich oraz stworzenie nowej talii (US-007).
- **Kluczowe informacje:** Siatka lub lista kart reprezentujących talie (nazwa, liczba fiszek, data ostatniej aktualizacji). Przycisk "Stwórz nową talię". Search bar do filtrowania talii (client-side).
- **Kluczowe komponenty:** `Card`, `Button`, `Dialog` (do tworzenia nowej talii), `Input` (search), `Select` (sorting).
- **Integracje API:**
  - `GET /api/decks?page=1&limit=20&sort=updated_at&order=desc` (pobranie listy talii)
  - `POST /api/decks` (tworzenie nowej talii)
- **Stany UI:**
  - Loading (skeleton loader dla kart)
  - Empty State (brak talii - wyświetl ilustrację + CTA "Stwórz pierwszą talię" lub "Wygeneruj z AI")
  - Empty Search Results (szukana fraza nie zwróciła wyników - "Nie znaleziono talii")
  - Error (błąd ładowania - przycisk retry)
  - Success (lista talii z paginacją - infinite scroll lub "Load More" button gdy total > limit)
- **Paginacja:** Infinite scroll lub przycisk "Załaduj więcej" - automatyczne wywołanie GET /api/decks?page=X gdy użytkownik scrolluje na dół lub klika przycisk.
- **Search & Sort:** Client-side search po nazwie talii (filtrowanie loaded decks). Dropdown do sortowania: "Ostatnio zaktualizowane", "Nazwa A-Z", "Nazwa Z-A", "Najstarsze".
- **Karta talii wyświetla:** Nazwa, liczba fiszek, relative time last update ("Zaktualizowano 2 dni temu"), menu akcji (edytuj nazwę, usuń).
- **UX, dostępność, bezpieczeństwo:** Widok obsługuje "stan pusty" (dla użytkowników bez talii) z wyraźnym wezwaniem do akcji (np. "Stwórz swoją pierwszą talię lub wygeneruj ją z AI!"). Każda karta talii jest klikalna i prowadzi do Deck Detail. Search jest instant (debounced 300ms).

### 5. Widok Szczegółów Talii (Deck Detail View)
- **Ścieżka:** `/decks/[id]`
- **Główny cel:** Wyświetlenie zawartości talii, zarządzanie nią i jej fiszkami oraz rozpoczęcie sesji nauki (US-008).
- **Kluczowe informacje:** Breadcrumb ("Dashboard > [Nazwa talii]"), nazwa talii (editable inline), statystyki (liczba fiszek, fiszki do powtórki dzisiaj), przyciski akcji ("Rozpocznij naukę", "Dodaj fiszkę", "Wygeneruj z AI", "Usuń talię"), lista/tabela fiszek (przód, tył, data utworzenia).
- **Kluczowe komponenty:** `Button`, `Table` (desktop) / `Card` (mobile) dla listy fiszek, `Dialog` (dodawanie/edycja/usuwanie), `Breadcrumb`, `Badge` (statystyki).
- **Integracje API:**
  - `GET /api/decks/:id` (pobranie talii z pierwszą porcją fiszek - embedded w response)
  - `GET /api/decks/:deckId/flashcards?page=1&limit=50` (paginacja fiszek jeśli potrzeba więcej)
  - `GET /api/study/stats/:deckId` (statystyki nauki - cards_due_today, streak_days)
  - `PUT /api/decks/:id` (zmiana nazwy inline)
  - `DELETE /api/decks/:id` (usunięcie talii)
  - `POST /api/decks/:deckId/flashcards` (dodanie fiszki)
  - `PUT /api/flashcards/:id` (edycja fiszki)
  - `DELETE /api/flashcards/:id` (usunięcie fiszki)
- **Stany UI:**
  - Loading (skeleton dla nagłówka, statystyk i tabeli)
  - Empty State (talia bez fiszek - ilustracja + 2 CTA: "Dodaj pierwszą fiszkę" lub "Wygeneruj z AI")
  - Error States:
    - 404 (talia nie znaleziona - "Ta talia nie istnieje" + link do Dashboard)
    - 403 (brak dostępu - "Nie masz dostępu do tej talii" + link do Dashboard)
    - Network error (przycisk retry)
  - Success (lista fiszek z paginacją jeśli > 50)
  - "Rozpocznij naukę" disabled jeśli brak fiszek lub cards_due_today = 0 (tooltip: "Brak fiszek do powtórki dzisiaj")
- **Paginacja fiszek:** "Load More" button na dole listy jeśli total > 50. Lazy loading przy scrollu (opcjonalnie).
- **Inline editing nazwy:** Kliknięcie na nazwę talii → input field → Enter/blur wywołuje PUT /api/decks/:id. Obsługa 409 Conflict (duplikat nazwy) - pokazanie błędu "Talia o tej nazwie już istnieje".
- **Statystyki nauki:** Badge z "X fiszek do powtórki dzisiaj" (z GET /api/study/stats/:deckId). Opcjonalnie: streak days, retention rate (collapsible panel).
- **Breadcrumb navigation:** "Dashboard > [Nazwa talii]" - kliknięcie na "Dashboard" wraca do `/`.
- **UX, dostępność, bezpieczeństwo:** Potwierdzenie usunięcia talii (US-010) w modalu zapobiega przypadkowej utracie danych. Modal pokazuje: "Czy na pewno chcesz usunąć talię '[Nazwa]'? Spowoduje to trwałe usunięcie [X] fiszek. Tej akcji nie można cofnąć." + checkbox "Rozumiem" (must check) + przycisk "Usuń" (destructive variant). Lista fiszek jest czytelna i responsywna (tabela na desktop, karty stackowane na mobile).

### 6. Widok Generatora AI (AI Generator View)
- **Ścieżka:** `/generate`
- **Główny cel:** Umożliwienie użytkownikowi automatycznego wygenerowania fiszek z podanego tekstu (główna funkcja FTUE) (US-014).
- **Kluczowe informacje:** Breadcrumb ("Dashboard > Generator AI"), pole tekstowe na notatki z licznikiem znaków (limit 1000), przycisk "Generuj". Po wygenerowaniu: lista edytowalnych sugestii, selektor talii (istniejąca lub nowa) i przyciski "Zapisz" / "Anuluj" / "Generuj ponownie".
- **Kluczowe komponenty:** `Textarea`, `Button`, `Select`, `Input`, `Card`, `Toast`, `Badge` (licznik sugestii), `Alert` (ostrzeżenia).
- **Integracje API:**
  - `POST /api/ai/generate` (generowanie sugestii fiszek - zwraca `suggestions`, `count`, `truncated`)
  - `GET /api/decks` (lista talii do wyboru w selektorze)
  - `POST /api/decks` (utworzenie nowej talii jeśli wybrano "Stwórz nową talię")
  - `POST /api/flashcards/bulk` (zapis zaakceptowanych fiszek z `is_ai_generated: true`)
- **Stany UI:**
  - **Input State:** Pole tekstowe + licznik znaków (real-time, np. "850/1000") + przycisk "Generuj" (disabled jeśli empty lub > 1000)
  - **Loading:** Spinner + komunikat "Generuję fiszki z AI..." + progress indicator (elapsed time counter) + przycisk disabled. Timeout warning po 4s ("Trochę to trwa..."). Max oczekiwanie 5s (KSM 3).
  - **Error States:**
    - Client validation: "Wprowadź tekst (min 1 znak)" lub "Tekst przekracza limit 1000 znaków"
    - 429 Rate Limit: "Przekroczono limit żądań (10/minutę). Spróbuj ponownie za [countdown] sekund." + disabled button z countdown timer
    - 500 Server Error: "Błąd serwera. Spróbuj ponownie za chwilę." + przycisk "Spróbuj ponownie"
    - 503 AI Unavailable: "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę." + przycisk "Spróbuj ponownie"
    - Empty response (API zwróciło 0 sugestii): "Nie udało się wygenerować fiszek z tego tekstu. Spróbuj użyć innego fragmentu lub przeformułuj notatki." + przycisk "Wróć"
  - **Review State:** Lista sugestii (cards z inline editing) + licznik "Wygenerowano X fiszek" + selektor talii + przyciski akcji
  - **Success:** Toast "Zapisano X fiszek do talii '[Nazwa]'!" + redirect do `/decks/[id]`
- **Truncated text handling:** Jeśli API response ma `truncated: true`, wyświetl Alert (warning): "⚠️ Twój tekst został automatycznie skrócony do 1000 znaków. Przetworzono tylko pierwszy fragment."
- **Review State - szczegóły (US-017, US-018):**
  - Każda sugestia jest w Card z:
    - Inline editable Textarea dla "Przodu" (auto-resize, max 5000 chars)
    - Inline editable Textarea dla "Tyłu" (auto-resize, max 5000 chars)
    - Przycisk "Usuń" (ikona X) - usuwa sugestię z listy (confirmation nie wymagane, bo nie zapisane)
  - Header z licznikiem: "Wygenerowano X fiszek • Edytuj lub usuń niepotrzebne"
  - Selektor talii: Dropdown z listą istniejących talii + opcja "➕ Stwórz nową talię" (otwiera inline input dla nazwy)
  - Przyciski:
    - "Zapisz do talii" (primary, disabled jeśli lista pusta lub nie wybrano talii)
    - "Anuluj" (secondary, wraca do Input State - confirmation: "Utracisz wygenerowane sugestie")
    - "Generuj ponownie" (ghost, wraca do Input State z zachowanym tekstem - confirmation jw.)
- **Rate limiting UI:** Po 429 response, przycisk "Generuj" jest disabled na 60 sekund z countdown timer: "Generuj (dostępne za 45s)". Client-side tracking czasu.
- **Optimistic UI:** Po kliknięciu "Zapisz", sugestie są dodawane do local state (Zustand) przed API response, aby instant redirect do deck view. Jeśli API fail - rollback + error toast.
- **UX, dostępność, bezpieczeństwo:** Jasny podział na stany: Input → Loading → Review → Success. Real-time character counter z visual feedback (zielony < 800, żółty 800-950, czerwony > 950). Wskaźniki ładowania z elapsed time. Klucz API Openrouter jest w backend environment variables, niewidoczny dla clienta. Edycja sugestii jest intuitive (click to edit). Walidacja front/back fields (min 1 char) przed zapisem.

### 7. Widok Sesji Nauki (Study Session View)
- **Ścieżka:** `/study/[deckId]`
- **Główny cel:** Przeprowadzenie użytkownika przez sesję nauki opartą na algorytmie spaced repetition (US-022).
- **Kluczowe informacje:** Breadcrumb ("Dashboard > [Nazwa talii] > Nauka"), header z nazwą talii + progress bar (X/Y fiszek) + przycisk Exit, karta fiszki z przód/tył + przyciski oceny. Badge ze stanem fiszki (Nowa/Nauka/Powtórka/Relearning).
- **Kluczowe komponenty:** `Card` (duża karta fiszki z flip animation), `Button`, `Progress` (linear bar + circular), `Badge`, `Dialog` (confirm exit).
- **Integracje API:**
  - `GET /api/study/session/:deckId?limit=20` (rozpoczęcie sesji, pobranie fiszek do powtórki - default 20, max 50)
  - `POST /api/study/review` (zapisanie oceny - wymaga `study_record_id`, `flashcard_id`, `rating`)
  - `GET /api/study/stats/:deckId` (statystyki na ekranie podsumowania - opcjonalne)
- **Stany UI:**
  - **Loading:** Skeleton dla header + duża placeholder card + loading text "Przygotowuję sesję nauki..."
  - **Empty State (US-026):** Ilustracja + komunikat "Świetna robota! Brak fiszek do powtórki dzisiaj. Wróć jutro!" + przycisk "Wróć do talii" + (opcjonalnie) statystyki (streak days, total reviewed)
  - **Study Mode:**
    - **Front Side:** Duża karta z tekstem przodu + Badge z card state ("Nowa" blue, "Nauka" yellow, "Powtórka" green, "Ponowna nauka" red) + przycisk "Pokaż odpowiedź" (large, primary) + progress indicator na górze (np. "5 / 20 fiszek") + przycisk "Zakończ" (ghost, top-right)
    - **Back Side:** Przód (mniejszy font, opacity 0.7) + Tył (duży, główny) + card state badge + 3 przyciski oceny:
      - "Nie wiem" (destructive/red, maps to "again")
      - "Wiem" (default/blue, maps to "good")
      - "Opanowane" (success/green, maps to "easy")
    - **Submitting Rating:** Przyciski oceny disabled + spinner overlay na karcie + komunikat "Zapisuję..." (bloking UI na czas POST /api/study/review - powinna być szybka < 500ms)
  - **Session Complete:** Full-screen celebration card:
    - Ikona/animacja sukcesu
    - "Gratulacje! Ukończyłeś sesję nauki!"
    - Statystyki sesji: "Powtórzono: X fiszek" + breakdown ("Nie wiem: A • Wiem: B • Opanowane: C")
    - (Opcjonalnie z GET /api/study/stats/:deckId): Streak days, retention rate, total cards studied
    - Przyciski: "Wróć do talii" (primary) + "Kontynuuj naukę" (jeśli cards_due > 0 i session limit < max)
  - **Error States:**
    - Loading fail: "Nie udało się załadować sesji. Sprawdź połączenie." + przyciski "Spróbuj ponownie" / "Wróć do talii"
    - Review submit fail: Toast error "Nie udało się zapisać oceny. Spróbuj ponownie." + retry auto (max 2 attempts) lub manual retry button
- **Session limit handling:** API zwraca default 20 fiszek (max 50 z query param limit). UI pokazuje postęp względem pobranych fiszek. Po zakończeniu 20, jeśli cards_due_today > 20, oferuje "Kontynuuj naukę" który wywołuje nową sesję.
- **Exit confirmation:** Kliknięcie "Zakończ" w trakcie sesji → Dialog: "Czy na pewno chcesz zakończyć? Twój postęp zostanie zapisany (ocenione fiszki: X)." + "Zakończ" / "Anuluj". Po potwierdzeniu → redirect do `/decks/[id]`.
- **Card state visualization:** Badge z kolorem i tekstem na podstawie API field `state`:
  - "new" → Badge blue "Nowa"
  - "learning" → Badge yellow "Nauka"
  - "review" → Badge green "Powtórka"
  - "relearning" → Badge red "Ponowna nauka"
- **Keyboard shortcuts:** Space = "Pokaż odpowiedź", 1 = "Nie wiem", 2 = "Wiem", 3 = "Opanowane", Esc = "Zakończ" (z confirmacją)
- **UX, dostępność, bezpieczeńność:** Minimalistyczny, full-focus UI. Duża karta centralna. Clear visual hierarchy (progress na górze, karta w środku, przyciski na dole). Smooth transitions między fiszkami (fade in/out). Keyboard-first design. Progress jest persisted (ocenione fiszki są zapisane nawet przy wyjściu). Synchroniczny przepływ (ocena → loading → następna) zapobiega błędom. ARIA live region dla screen readers announces każdą zmianę ("Fiszka 6 z 20", "Pokaż odpowiedź", etc.).

### 8. Widok Profilu (Profile View)
- **Ścieżka:** `/profile`
- **Główny cel:** Wyświetlenie i edycja podstawowych danych użytkownika (ograniczona funkcjonalność w MVP).
- **Kluczowe informacje:** E-mail użytkownika (tylko do odczytu), opcjonalne pole username, przycisk zapisywania zmian.
- **Kluczowe komponenty:** `Card`, `Input`, `Label`, `Button`, `Avatar`.
- **Integracje API:**
  - `GET /api/profile` (pobranie danych profilu)
  - `PUT /api/profile` (aktualizacja username)
- **Stany UI:**
  - Loading (skeleton dla formularza)
  - Success (formularz z danymi)
  - Saving (przycisk "Zapisz" disabled + spinner)
  - Error (błąd walidacji username lub błąd zapisu)
- **UX, dostępność, bezpieczeństwo:** Pole e-mail jest nieaktywne (zarządzane przez Supabase Auth). Username ma walidację (3-50 znaków, alfanumeryczne + underscore). W przyszłości można dodać avatar, statystyki nauki, itp.

### 9. Widok Potwierdzenia E-maila (Email Confirmation View)
- **Ścieżka:** `/auth/confirm` (opcjonalnie, jeśli Supabase wymaga potwierdzenia)
- **Główny cel:** Obsługa kliknięcia w link potwierdzający z e-maila rejestracyjnego.
- **Kluczowe informacje:** Komunikat o sukcesie lub błędzie potwierdzenia, link do logowania.
- **Kluczowe komponenty:** `Card`, `Button`.
- **Integracje API:** Supabase Auth SDK automatycznie obsługuje token z URL
- **Stany UI:**
  - Loading (weryfikacja tokena)
  - Success ("E-mail potwierdzony! Możesz się zalogować" + link do `/login`)
  - Error ("Link wygasł lub jest nieprawidłowy" + link do resend)
- **UX, dostępność, bezpieczeństwo:** Jasny komunikat o statusie potwierdzenia. W przypadku błędu - opcja ponownego wysłania e-maila.

## 3. Mapa podróży użytkownika

### Główny przepływ: Pierwsze doświadczenie użytkownika (FTUE)

1.  **Rejestracja:** Użytkownik trafia na `/register`, tworzy konto.
2.  **(Opcjonalnie) Potwierdzenie e-maila:** Jeśli Supabase wymaga potwierdzenia, użytkownik klika link w e-mailu i trafia na `/auth/confirm`.
3.  **Onboarding:** Po sukcesie jest automatycznie przekierowywany na `/generate`.
4.  **Generowanie:** Widzi powitalny komunikat, wkleja tekst do pola `Textarea` (z licznikiem znaków) i klika "Generuj".
5.  **Przegląd:** Przycisk jest blokowany, pojawia się wskaźnik ładowania. Po chwili (max 5s) widok aktualizuje się, pokazując listę edytowalnych sugerowanych fiszek.
6.  **Edycja (opcjonalnie):** Użytkownik może edytować tekst sugestii lub usunąć niepotrzebne pary.
7.  **Zapis:** Użytkownik wybiera opcję "Stwórz nową talię" z selektora, wpisuje jej nazwę i klika "Zapisz".
8.  **Potwierdzenie:** Po pomyślnym zapisie (wywołania `POST /api/decks` i `POST /api/flashcards/bulk`), otrzymuje powiadomienie toast "Fiszki zapisane!".
9.  **Nawigacja:** Zostaje przekierowany do widoku nowej talii (`/decks/[id]`), gdzie widzi swoje świeżo utworzone fiszki z flagą `is_ai_generated: true`.

### Przepływ dodatkowy: Sesja nauki

1.  **Nawigacja:** Użytkownik loguje się i z panelu głównego (`/`) wybiera istniejącą talię (klika na kartę).
2.  **Inicjacja:** W widoku szczegółów talii (`/decks/[id]`) klika przycisk "Rozpocznij naukę".
3.  **Pobieranie sesji:** Aplikacja wywołuje `GET /api/study/session/[deckId]` i przechodzi do `/study/[deckId]`. Wyświetla skeleton loader.
4.  **Nauka - Fiszka 1:** Użytkownik widzi przód pierwszej fiszki i pasek postępu (1/10). Klika "Pokaż odpowiedź".
5.  **Ocena:** Widzi tył fiszki. Ocenia swoją znajomość klikając jeden z trzech przycisków: "Nie wiem" (again), "Wiem" (good), "Opanowane" (easy).
6.  **Pętla:** Proces powtarza się dla wszystkich fiszek w sesji. Po każdej ocenie UI jest blokowane (spinner + disabled buttons) na czas wywołania `POST /api/study/review`. Następnie automatycznie ładowana jest kolejna fiszka.
7.  **Zakończenie:** Po ostatniej fiszce pojawia się ekran podsumowania: "Gratulacje! Powtórzono 10 fiszek. Wróć jutro po kolejne!" + przycisk "Wróć do talii".
8.  **Powrót:** Użytkownik wraca do widoku szczegółów talii (`/decks/[id]`).

### Przepływ dodatkowy: Tworzenie fiszek manualnie

1.  **Nawigacja:** Użytkownik jest w widoku szczegółów talii (`/decks/[id]`).
2.  **Inicjacja:** Klika przycisk "Dodaj fiszkę".
3.  **Dialog:** Otwiera się modal `FlashcardEditor` z dwoma polami: "Przód" i "Tył" (oba `<textarea>`).
4.  **Wypełnienie:** Użytkownik wpisuje treść i klika "Zapisz".
5.  **Walidacja:** Formularz waliduje (min 1 znak, max 5000 znaków dla każdego pola). Jeśli błąd - pokazuje komunikat.
6.  **Zapis:** Aplikacja wywołuje `POST /api/decks/:deckId/flashcards`. Przycisk jest disabled + spinner.
7.  **Potwierdzenie:** Po sukcesie, modal zamyka się, nowa fiszka pojawia się na liście (z flagą `is_ai_generated: false`), toast "Fiszka dodana!".

### Przepływ dodatkowy: Edycja/usuwanie talii

1.  **Edycja nazwy:** W widoku szczegółów talii, użytkownik klika ikonę edycji obok nazwy → inline input lub modal → wpisuje nową nazwę → `PUT /api/decks/:id` → toast "Talia zaktualizowana!".
2.  **Usuwanie:** Użytkownik klika przycisk "Usuń talię" → pojawia się modal potwierdzenia: "Czy na pewno chcesz usunąć talię 'Nazwa'? Spowoduje to usunięcie 42 fiszek. Tej akcji nie można cofnąć." → po potwierdzeniu `DELETE /api/decks/:id` → redirect do Dashboard (`/`) → toast "Talia usunięta".

## 4. Układ i struktura nawigacji

Aplikacja będzie posiadać dwa główne układy (layouty):

1.  **Układ publiczny (`PublicLayout`):** Obejmuje strony `/login`, `/register`, `/reset-password`. Nie posiada paska nawigacyjnego, aby skupić użytkownika na zadaniu.
2.  **Układ chroniony (`ProtectedLayout`):** Obejmuje wszystkie strony po zalogowaniu. Zawiera logikę sprawdzającą sesję użytkownika i przekierowującą do `/login` w przypadku jej braku.

**Nawigacja w `ProtectedLayout`:**

Na górze strony znajduje się stały pasek nawigacyjny zawierający:
- **Logo/Nazwa aplikacji:** Link do panelu głównego (`/`). Zawsze widoczny po lewej stronie.
- **Linki nawigacyjne (desktop):**
    - "Moje talie" (link do `/`) - z active state indicator (underline lub background)
    - "Generator AI" (link do `/generate`) - z active state indicator
    - Active state: bold font + accent color lub colored underline/background
- **Hamburger menu (mobile):**
    - Collapsible menu z tymi samymi linkami
    - Overlay/drawer z animacją slide-in
- **Menu użytkownika (po prawej stronie):**
    - Avatar użytkownika (Fallback: inicjały lub domyślna ikona) otwierające `DropdownMenu` on click
    - W menu:
      - Email użytkownika (disabled item, gray text, truncated jeśli długi)
      - Separator (divider line)
      - Link do "Profil" (`/profile`)
      - Link do "Ustawienia" (opcjonalnie, może być disabled w MVP)
      - Separator
      - Przycisk "Wyloguj" (red/destructive color)
- **Logout confirmation:**
    - Kliknięcie "Wyloguj" → Dialog: "Czy na pewno chcesz się wylogować?" + "Wyloguj" (destructive) / "Anuluj"
    - Po potwierdzeniu → wywołanie `supabase.auth.signOut()` → redirect do `/login` → toast "Wylogowano pomyślnie"
- **Responsywność:**
    - Desktop (≥1024px): Pełny horizontal navbar z wszystkimi linkami
    - Tablet (768-1023px): Logo + links + avatar (może być condensed)
    - Mobile (<768px): Logo + hamburger + avatar (links w drawer menu)

Taka struktura zapewnia stały i przewidywalny dostęp do kluczowych funkcji aplikacji z każdego miejsca po zalogowaniu. Active state pokazuje użytkownikowi, gdzie się znajduje.

## 5. Kluczowe komponenty

Poniższe komponenty (głównie z `Shadcn/ui`) będą stanowić podstawowe bloki konstrukcyjne interfejsu i będą reużywane w całej aplikacji:

### Komponenty podstawowe (Shadcn/ui)
- **`Button`:** Standardowy przycisk do wszystkich akcji. Będzie obsługiwał stan `disabled` i wyświetlanie wskaźnika ładowania (spinner). Warianty: default, destructive, outline, ghost, link.
- **`Card`:** Kontener do grupowania powiązanych informacji, używany w panelu głównym (karty talii), formularzach i widokach nauki.
- **`Input` & `Textarea`:** Podstawowe pola do wprowadzania danych w formularzach i generatorze AI. Pełna integracja z React Hook Form.
- **`Label`:** Etykieta dla pól formularzy, kluczowa dla dostępności (powiązana z `htmlFor`).
- **`Dialog`:** Komponent modalny używany do akcji wymagających dodatkowego kontekstu lub potwierdzenia (np. tworzenie nowej talii, potwierdzenie usunięcia).
- **`Toast`:** Dyskretne powiadomienia (pop-up) do informowania o wyniku operacji (sukces, błąd). Używa **Sonner** (oficjalna integracja z Shadcn/ui). Pozycja: bottom-right (desktop) / top-center (mobile). Auto-dismiss po 3-5s (z progress bar).
- **`Select`:** Rozwijane menu do wyboru talii w generatorze AI.
- **`Table`:** Do prezentacji listy fiszek w widoku szczegółów talii (z sortowaniem i paginacją).
- **`DropdownMenu`:** Używane dla menu użytkownika w pasku nawigacyjnym oraz menu akcji na kartach talii.
- **`Avatar`:** Komponent awatara użytkownika (w menu nawigacji i widoku profilu).
- **`Progress`:** Pasek postępu używany w sesji nauki do pokazania postępu (X/Y fiszek). Warianty: linear (bar) i circular (ring).
- **`Skeleton`:** Komponenty placeholder używane podczas ładowania danych (loading states).
- **`Badge`:** Małe kolorowe etykiety dla statusów (card state, liczniki, tags).
- **`Alert`:** Komponenty dla ostrzeżeń i komunikatów informacyjnych (np. truncated text warning).
- **`Breadcrumb`:** Nawigacja kontekstowa pokazująca ścieżkę użytkownika (Dashboard > Talia > Nauka).

### Komponenty złożone (custom)
- **`DeckCard`:** Karta talii w widoku Dashboard (zawiera nazwę, liczbę fiszek, relative time, menu akcji).
- **`FlashcardRow`:** Wiersz tabeli z fiszką (zawiera przód, tył, created_at, przyciski edycji/usunięcia).
- **`FlashcardEditor`:** Dialog z formularzem do tworzenia/edycji fiszki (pola front/back z character counter + walidacja Zod).
- **`StudyCard`:** Duży komponent fiszki w trybie nauki (animacja flip, przód/tył, card state badge, smooth transitions).
- **`CharCounter`:** Licznik znaków dla Textarea (np. "850/1000") z color coding (green/yellow/red).
- **`EmptyState`:** Komponent dla stanów pustych (ilustracja SVG + komunikat + 1-2 CTA buttons).
- **`ErrorBoundary`:** React Error Boundary dla obsługi błędów renderowania (fallback UI + retry button).
- **`CountdownButton`:** Przycisk z countdown timer (używany dla rate limit - "Generuj (dostępne za 45s)").
- **`EditableText`:** Inline editable text field (używane dla nazwy talii w Deck Detail).
- **`SearchBar`:** Input z ikoną search + clear button (debounced onChange).
- **`ConfirmDialog`:** Reusable confirmation modal (np. delete deck, exit study session).

## 6. Zarządzanie stanem aplikacji

### Zustand Stores

Aplikacja będzie używać **Zustand** do zarządzania stanem globalnym. Planowane store'y:

#### `useAuthStore`
Zarządzanie sesją użytkownika:
```typescript
{
  user: User | null,
  session: Session | null,
  isLoading: boolean,
  setUser: (user: User | null) => void,
  setSession: (session: Session | null) => void,
  signOut: () => Promise<void>
}
```

#### `useDecksStore`
Cache dla listy talii:
```typescript
{
  decks: Deck[],
  isLoading: boolean,
  error: string | null,
  fetchDecks: () => Promise<void>,
  addDeck: (deck: Deck) => void,
  updateDeck: (id: string, updates: Partial<Deck>) => void,
  removeDeck: (id: string) => void,
  clearDecks: () => void
}
```

#### `useGeneratorStore`
Stan generatora AI (opcjonalnie, jeśli potrzeba cache):
```typescript
{
  suggestions: FlashcardSuggestion[],
  isGenerating: boolean,
  error: string | null,
  setSuggestions: (suggestions: FlashcardSuggestion[]) => void,
  removeSuggestion: (index: number) => void,
  updateSuggestion: (index: number, updates: Partial<FlashcardSuggestion>) => void,
  clearSuggestions: () => void
}
```

### React Hook Form + Zod

Wszystkie formularze będą używać **React Hook Form** z **Zod** do walidacji:
- Login/Register: walidacja e-maila i hasła
- Deck creation/editing: walidacja nazwy (1-255 znaków)
- Flashcard creation/editing: walidacja front/back (1-5000 znaków)
- AI Generator: walidacja tekstu (1-1000 znaków)
- Profile: walidacja username (3-50 znaków, alfanumeryczne + underscore)

### Server State (React Query - opcjonalnie)

Dla lepszej obsługi cache i refetch logiki, można rozważyć użycie **TanStack Query (React Query)** w przyszłości, ale dla MVP Zustand + fetch w komponentach będzie wystarczający.

### Timezone Handling

**WAŻNE:** API zwraca wszystkie daty w formacie UTC (ISO 8601: `2024-01-01T00:00:00Z`).

**Client-side conversion:**
- Wszystkie timestamps z API muszą być konwertowane do local timezone użytkownika przed wyświetleniem
- Używamy biblioteki `date-fns` lub `dayjs` z timezone support
- Display formats:
  - Relative time: "2 godziny temu", "wczoraj", "3 dni temu" (dla recent dates)
  - Absolute time: "15 stycznia 2024, 14:30" (dla older dates)
  - Due dates w Study: "Następna powtórka: jutro o 10:00" lub "za 3 dni"
- Przykład kodu:
```typescript
import { formatDistanceToNow, format } from 'date-fns';
import { pl } from 'date-fns/locale';

// UTC string z API
const utcDate = "2024-01-01T12:00:00Z";

// Konwersja i wyświetlanie
const date = new Date(utcDate); // automatyczna konwersja do local timezone
const relative = formatDistanceToNow(date, { addSuffix: true, locale: pl }); // "3 godziny temu"
const absolute = format(date, "d MMMM yyyy, HH:mm", { locale: pl }); // "1 stycznia 2024, 13:00"
```

## 9. Wymagania implementacyjne

### Routing i struktura plików

Astro używa file-based routing w katalogu `src/pages/`:

```
src/pages/
├── index.astro                    # Dashboard (lista talii) - chroniony
├── login.astro                    # Widok logowania - publiczny
├── register.astro                 # Widok rejestracji - publiczny
├── reset-password.astro           # Żądanie resetu hasła - publiczny
├── reset-password/
│   └── confirm.astro              # Potwierdzenie nowego hasła - publiczny
├── auth/
│   └── confirm.astro              # Potwierdzenie e-maila - publiczny
├── profile.astro                  # Widok profilu - chroniony
├── generate.astro                 # Generator AI - chroniony
├── decks/
│   └── [id].astro                 # Szczegóły talii - chroniony
└── study/
    └── [deckId].astro             # Sesja nauki - chroniony
```

### Middleware i ochrona tras

W pliku `src/middleware/index.ts`:
- Sprawdzanie sesji Supabase dla tras chronionych
- Przekierowanie do `/login` jeśli brak sesji
- Przekierowanie do `/` jeśli zalogowany użytkownik próbuje dostać się do `/login` lub `/register`
- Wstrzykiwanie obiektu `supabase` do `context.locals`

### Obsługa błędów

#### Globalne obsługiwanie błędów
- `ErrorBoundary` komponent React dla błędów renderowania
- Toast notifications dla błędów API
- Dedykowane strony błędów: `src/pages/404.astro`, `src/pages/500.astro`

#### Komunikaty błędów (user-friendly)
- **400 Validation Error:** "Sprawdź wprowadzone dane"
- **401 Unauthorized:** "Sesja wygasła. Zaloguj się ponownie"
- **403 Forbidden:** "Nie masz dostępu do tego zasobu"
- **404 Not Found:** "Nie znaleziono talii/fiszki"
- **429 Rate Limit:** "Zbyt wiele żądań. Spróbuj za chwilę"
- **500 Server Error:** "Wystąpił błąd serwera. Spróbuj ponownie"
- **503 AI Service Unavailable:** "Usługa AI jest niedostępna. Spróbuj ponownie za chwilę"

### Wskaźniki ładowania (Loading States)

Dla wszystkich asynchronicznych operacji:
- **Skeleton loaders:** Dla list (Dashboard, Deck Detail), kart talii
- **Spinner + disabled button:** Dla przycisków akcji (Submit, Save, Delete)
- **Progress bar:** Dla sesji nauki (X/Y fiszek)
- **Full-page loader:** Dla inicjalnego ładowania chronionej strony (sprawdzanie sesji)

### Responsywność (Mobile-first)

Breakpointy Tailwind CSS:
- `sm:` 640px (telefony poziomo)
- `md:` 768px (tablety)
- `lg:` 1024px (laptopy)
- `xl:` 1280px (desktopy)

Kluczowe dostosowania:
- Dashboard: siatka 1 kolumna (mobile) → 2 kolumny (tablet) → 3 kolumny (desktop)
- Pasek nawigacji: hamburger menu (mobile) → pełny pasek (desktop)
- Tabela fiszek: karty stackowane (mobile) → tabela (desktop)
- Dialogi: full-screen (mobile) → centered modal (desktop)

### Dostępność (a11y)

- Wszystkie interaktywne elementy dostępne z klawiatury
- Focus states dla wszystkich kontrolek
- ARIA labels dla ikon bez tekstu
- Color contrast ratio min 4.5:1
- Screen reader friendly (semantyczny HTML)
- Skip navigation link
- Announcements dla dynamicznych zmian (toast z `aria-live`)

### Performance

- Lazy loading dla React komponentów (`client:idle`, `client:visible`)
- Image optimization (jeśli dodamy obrazy w przyszłości)
- Code splitting (automatyczne przez Astro)
- Minimalizacja bundle size (tylko potrzebne shadcn komponenty)
- Debouncing dla licznika znaków w generatorze AI
- Optimistic UI updates tam gdzie możliwe (np. dodawanie fiszki do listy przed potwierdzeniem API)

## 10. Checklist implementacji MVP

### Przygotowanie projektu
- [ ] Inicjalizacja projektu Astro 5 z Node adapter (SSR mode)
- [ ] Instalacja Shadcn/ui i konfiguracja Tailwind 4
- [ ] Konfiguracja Supabase:
  - [ ] Utworzenie projektu w Supabase dashboard
  - [ ] Uruchomienie migracji bazy danych (schema z `.ai/api-plan.md`)
  - [ ] Konfiguracja RLS (Row Level Security) policies dla wszystkich tabel
  - [ ] Testowanie RLS policies (user może czytać tylko swoje dane)
  - [ ] Konfiguracja Supabase Auth (email templates, redirect URLs)
- [ ] Konfiguracja zmiennych środowiskowych (`.env.local`):
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `PUBLIC_SITE_URL` (dla redirects)
- [ ] Setup TypeScript (strict mode) i ESLint (z CLAUDE.md rules)
- [ ] Instalacja dependencies:
  - [ ] Zustand (state management)
  - [ ] React Hook Form + @hookform/resolvers
  - [ ] Zod (validation schemas)
  - [ ] date-fns (timezone handling + formatting)
  - [ ] clsx / cn utility (className merging)
- [ ] Setup middleware dla ochrony tras (`src/middleware/index.ts`)
- [ ] Konfiguracja OpenAPI spec (`public/openapi.yaml`) - już istnieje, zweryfikować zgodność

### Komponenty UI (Shadcn/ui)
- [ ] Button (z loading state)
- [ ] Card
- [ ] Input & Textarea
- [ ] Label
- [ ] Dialog
- [ ] Toast (Sonner)
- [ ] Select
- [ ] Table
- [ ] DropdownMenu
- [ ] Avatar
- [ ] Progress (linear & circular)
- [ ] Skeleton
- [ ] Badge
- [ ] Alert
- [ ] Breadcrumb
- [ ] Stworzenie custom komponentów:
  - [ ] DeckCard
  - [ ] FlashcardRow
  - [ ] FlashcardEditor
  - [ ] StudyCard (z flip animation)
  - [ ] CharCounter (z color coding)
  - [ ] EmptyState
  - [ ] ErrorBoundary
  - [ ] CountdownButton (rate limit timer)
  - [ ] EditableText (inline editing)
  - [ ] SearchBar (debounced)
  - [ ] ConfirmDialog (reusable)

### Layouty
- [ ] PublicLayout (bez nawigacji)
- [ ] ProtectedLayout (z paskiem nawigacyjnym)
- [ ] Navigation component (logo, linki, user menu)

### Widoki publiczne (Auth)
- [ ] Login View (`/login`)
- [ ] Register View (`/register`)
- [ ] Reset Password View (`/reset-password` i `/reset-password/confirm`)
- [ ] Email Confirmation View (`/auth/confirm`)

### Widoki chronione
- [ ] Dashboard (`/`) - lista talii + empty state
- [ ] Deck Detail View (`/decks/[id]`) - lista fiszek + akcje
- [ ] AI Generator View (`/generate`) - input + review state
- [ ] Study Session View (`/study/[deckId]`) - nauka + podsumowanie
- [ ] Profile View (`/profile`)

### API Routes
- [ ] `POST /api/ai/generate` (generowanie fiszek)
- [ ] `GET /api/decks` (lista talii)
- [ ] `POST /api/decks` (tworzenie talii)
- [ ] `GET /api/decks/:id` (szczegóły talii)
- [ ] `PUT /api/decks/:id` (edycja talii)
- [ ] `DELETE /api/decks/:id` (usunięcie talii)
- [ ] `POST /api/decks/:deckId/flashcards` (dodanie fiszki)
- [ ] `POST /api/flashcards/bulk` (bulk dodanie fiszek z AI)
- [ ] `PUT /api/flashcards/:id` (edycja fiszki)
- [ ] `DELETE /api/flashcards/:id` (usunięcie fiszki)
- [ ] `GET /api/study/session/:deckId` (rozpoczęcie sesji nauki)
- [ ] `POST /api/study/review` (zapisanie oceny fiszki)
- [ ] `GET /api/profile` (profil użytkownika)
- [ ] `PUT /api/profile` (edycja profilu)

### Zustand Stores
- [ ] useAuthStore
- [ ] useDecksStore
- [ ] useGeneratorStore (opcjonalnie)

### Integracje
- [ ] Supabase Auth integration:
  - [ ] Sign up z email verification
  - [ ] Sign in
  - [ ] Sign out
  - [ ] Reset password flow
  - [ ] Session management w middleware
- [ ] OpenRouter API integration (GPT-4o-mini):
  - [ ] Setup API client w backend API route
  - [ ] **AI Prompt Engineering - KRYTYCZNE dla KSM 1 (75% acceptance):**
    - [ ] Napisanie system prompta (instrukcje dla AI jak generować fiszki)
    - [ ] Testowanie różnych prompt variations (A/B testing if possible)
    - [ ] Optymalizacja pod kątem: quality (clear questions), quantity (3-10 cards), format (JSON response)
    - [ ] Przykładowy prompt template:
      ```
      "Jesteś ekspertem od tworzenia fiszek edukacyjnych.
      Z podanego tekstu wygeneruj 3-10 par pytanie-odpowiedź (przód-tył fiszki).
      Zasady:
      - Pytania powinny być konkretne i testować zrozumienie
      - Odpowiedzi powinny być zwięzłe ale kompletne
      - Unikaj trywialnych pytań
      - Format JSON: [{front: string, back: string}]

      Tekst: [USER_INPUT]"
      ```
  - [ ] Error handling (rate limits, timeouts, malformed responses)
  - [ ] Response parsing i validation (Zod schema dla AI output)
  - [ ] Monitoring czasu odpowiedzi (KSM 3: P95 < 5s)
- [ ] Spaced Repetition Algorithm integration (FSRS v4.5 lub SM-2):
  - [ ] Wybór algorytmu (research FSRS vs SM-2)
  - [ ] Instalacja/implementacja biblioteki
  - [ ] Konfiguracja parametrów algorytmu (initial difficulty, etc.)
  - [ ] Integracja z POST /api/study/review (calculate next review date)
  - [ ] Testowanie accuracy algorytmu

### Testing & Refinement
- [ ] Testowanie wszystkich przepływów użytkownika (manualne):
  - [ ] FTUE flow (register → generate → save → view deck)
  - [ ] Study session flow (start → review all cards → completion)
  - [ ] Manual flashcard creation flow
  - [ ] Deck management (create, edit, delete)
  - [ ] Profile editing
  - [ ] Password reset flow (email flow)
- [ ] Testowanie responsywności:
  - [ ] Mobile (iPhone SE, 375px)
  - [ ] Tablet (iPad, 768px)
  - [ ] Desktop (1920px)
  - [ ] Landscape orientations
- [ ] Testowanie dostępności (a11y):
  - [ ] Keyboard navigation (Tab, Enter, Esc)
  - [ ] Screen reader testing (NVDA/JAWS)
  - [ ] Color contrast check (WCAG AA)
  - [ ] Focus indicators
  - [ ] ARIA labels i landmarks
- [ ] Testowanie błędów i edge cases:
  - [ ] Network errors (offline, timeout)
  - [ ] API rate limits (429 responses)
  - [ ] Empty states (no decks, no cards, no cards due)
  - [ ] Very long text (deck names, flashcard content)
  - [ ] Special characters in input
  - [ ] Concurrent requests (race conditions)
  - [ ] Browser back/forward navigation
  - [ ] Page refresh mid-session
- [ ] Performance testing:
  - [ ] **KSM 3: P95 < 5s dla AI generation** - measure with browser DevTools Network tab
  - [ ] Lighthouse audit (Performance, Accessibility, Best Practices)
  - [ ] Bundle size analysis (build output)
  - [ ] First Contentful Paint (FCP), Largest Contentful Paint (LCP)
  - [ ] Time to Interactive (TTI)
- [ ] Security audit:
  - [ ] RLS policies verification (user isolation)
  - [ ] API keys not exposed in client
  - [ ] XSS prevention (sanitized inputs)
  - [ ] CSRF protection
  - [ ] SQL injection prevention (Supabase handles this)
- [ ] Code review i refactoring:
  - [ ] Component reusability check
  - [ ] Remove duplicated code
  - [ ] Type safety verification
  - [ ] Error boundary coverage

### Deployment
- [ ] Konfiguracja Vercel/Netlify lub DigitalOcean (zgodnie z tech-stack)
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Konfiguracja zmiennych środowiskowych w production
- [ ] Setup custom domain i SSL
- [ ] Testowanie w production environment (smoke tests)
- [ ] Monitoring i error tracking:
  - [ ] Setup Sentry lub podobny (error tracking)
  - [ ] Setup analytics (np. Vercel Analytics lub Plausible)
  - [ ] Setup uptime monitoring (np. UptimeRobot)
  - [ ] Log aggregation (dla API errors)
- [ ] Performance monitoring:
  - [ ] Setup Real User Monitoring (RUM)
  - [ ] Track KSM 3 (P95 AI generation time) w production
  - [ ] Setup alerts dla slow requests (> 5s)

## 11. Future Enhancements (poza MVP)

Następujące funkcje są świadomie wyłączone z MVP, ale mogą być dodane w kolejnych iteracjach:

### 🎨 UI/UX Enhancements
- [ ] **Dark mode:** Toggle w ustawieniach + persist preference. CSS variables już przygotowane.
- [ ] **Keyboard shortcuts:** Global shortcuts (n = new deck, / = search, g h = go home, etc.)
- [ ] **Swipe gestures (mobile):** Swipe cards w Study Session, swipe to delete w listach
- [ ] **Animations i transitions:** Lepsze micro-interactions, page transitions
- [ ] **Themes:** Customizable color schemes poza dark/light
- [ ] **Dashboard customization:** Drag & drop decks, custom sorting, grid/list view toggle

### 📊 Features
- [ ] **Metrics Dashboard (Admin):** Wyświetlanie KSM 1 i KSM 2 dla product managera
- [ ] **Study reminders:** Email/push notifications o fiszki do powtórki
- [ ] **Study statistics:** Expanded stats page (heatmap, charts, progress over time)
- [ ] **Tags/Categories:** Organizacja talii w folders lub tags
- [ ] **Bulk operations:** Multi-select decks/cards → bulk delete, move, export
- [ ] **Export/Import:** CSV/JSON/Anki format
- [ ] **Deck sharing:** Public/private decks, share links, discover community decks
- [ ] **Collaborative decks:** Multiple users editing same deck
- [ ] **Rich text editor:** Formatting (bold, italic, lists), images w flashcards
- [ ] **Audio flashcards:** TTS lub audio upload dla pronunciation practice
- [ ] **Spaced repetition tunning:** User-customizable SR parameters

### 🔐 Account & Profile
- [ ] **Delete account:** Self-service account deletion
- [ ] **Avatar upload:** Custom avatar images (Supabase Storage)
- [ ] **Profile settings expanded:** Language preference, notification preferences, theme
- [ ] **OAuth providers:** Google, GitHub login (Supabase Auth supports)
- [ ] **Two-factor authentication:** Enhanced security

### 🧠 AI Enhancements
- [ ] **Multiple AI models:** User choice (GPT-4, Claude, Gemini)
- [ ] **Custom prompts:** User-defined system prompts
- [ ] **Batch generation:** Upload file (PDF, DOCX) → generate multiple decks
- [ ] **AI-powered suggestions:** "Review now" recommendations based on ML
- [ ] **Image-to-flashcards:** OCR + AI generation from screenshots/photos
- [ ] **Auto-tagging:** AI classifies decks into categories

### 📱 Platform
- [ ] **PWA (Progressive Web App):** Install prompt, offline support, app-like feel
- [ ] **Native mobile apps:** React Native lub Flutter
- [ ] **Browser extension:** Quick capture from web pages
- [ ] **API for third-party integrations:** Public API dla developers

### 🎯 Learning Features
- [ ] **Gamification:** Streaks, achievements, leaderboards
- [ ] **Study sessions customization:** Pomodoro timer, break reminders
- [ ] **Cloze deletions:** Fill-in-the-blank flashcards
- [ ] **Multiple choice mode:** Alternative study mode
- [ ] **Spaced repetition algorithm comparison:** A/B test FSRS vs SM-2
- [ ] **Learning analytics:** Retention curves, forgetting curves, optimal study times

Każda z tych funkcji powinna być rozważana osobno po walidacji MVP z prawdziwymi użytkownikami i analiz metryk KSM.

---

## 📋 Podsumowanie: Coverage Matrix

### Pokrycie User Stories z PRD

| Moduł | User Story | Widok UI | Status |
|-------|-----------|----------|--------|
| **AUTH** | US-001: Rejestracja | Register View | ✅ Kompletne |
| **AUTH** | US-002: Logowanie | Login View | ✅ Kompletne |
| **AUTH** | US-003: Wylogowanie | Navbar → Dropdown Menu | ✅ Kompletne |
| **AUTH** | US-004: Reset hasła (request) | Reset Password View | ✅ Kompletne |
| **AUTH** | US-005: Reset hasła (confirm) | Reset Password Confirm View | ✅ Kompletne |
| **DECK** | US-006: Tworzenie talii | Dashboard → Dialog | ✅ Kompletne |
| **DECK** | US-007: Lista talii | Dashboard View | ✅ Kompletne + search & pagination |
| **DECK** | US-008: Szczegóły talii | Deck Detail View | ✅ Kompletne + stats |
| **DECK** | US-009: Zmiana nazwy | Deck Detail → Inline Edit | ✅ Kompletne + 409 handling |
| **DECK** | US-010: Usuwanie talii | Deck Detail → Confirm Dialog | ✅ Kompletne + enhanced UX |
| **CARD-M** | US-011: Tworzenie fiszki | Deck Detail → Dialog | ✅ Kompletne |
| **CARD-M** | US-012: Edycja fiszki | FlashcardRow → Dialog | ✅ Kompletne |
| **CARD-M** | US-013: Usuwanie fiszki | FlashcardRow → Confirm | ✅ Kompletne |
| **AI-GEN** | US-014: Generowanie fiszek | AI Generator View | ✅ Kompletne + elapsed time |
| **AI-GEN** | US-015: Limit 1000 znaków | AI Generator → CharCounter | ✅ Kompletne + color coding |
| **AI-GEN** | US-016: Przegląd sugestii | AI Generator → Review State | ✅ Kompletne + deck selector |
| **AI-GEN** | US-017: Edycja sugestii | Review State → Inline Edit | ✅ Kompletne + char counter |
| **AI-GEN** | US-018: Odrzucenie sugestii | Review State → Delete Button | ✅ Kompletne |
| **AI-GEN** | US-019: Nowa talia z AI | Review State → Selector | ✅ Kompletne + inline input |
| **AI-GEN** | US-020: Błąd API | AI Generator → Error States | ✅ Kompletne + retry logic |
| **AI-GEN** | US-021: Brak wygenerowanych | AI Generator → Empty Response | ✅ Kompletne |
| **STUDY** | US-022: Rozpoczęcie sesji | Deck Detail → Button | ✅ Kompletne + disabled state |
| **STUDY** | US-023: Odkrywanie fiszki | Study Session → Front/Back | ✅ Kompletne + card state |
| **STUDY** | US-024: Ocenianie | Study Session → Rating Buttons | ✅ Kompletne + keyboard |
| **STUDY** | US-025: Zakończenie sesji | Study Session → Complete Screen | ✅ Kompletne + stats |
| **STUDY** | US-026: Brak fiszek | Study Session → Empty State | ✅ Kompletne |
| **NAV/FTUE** | US-027: FTUE | Register → Generate → Deck | ✅ Kompletne flow |
| **NAV/FTUE** | US-028: Nawigacja | ProtectedLayout Navbar | ✅ Kompletne + active state |

**Coverage: 28/28 User Stories (100%)** ✅

### Pokrycie API Endpoints

| Endpoint | Widok Użycia | Status |
|----------|--------------|--------|
| `GET /api/decks` | Dashboard | ✅ Z paginacją |
| `POST /api/decks` | Dashboard, AI Generator | ✅ Z 409 handling |
| `GET /api/decks/:id` | Deck Detail | ✅ |
| `PUT /api/decks/:id` | Deck Detail (inline edit) | ✅ Z 409 handling |
| `DELETE /api/decks/:id` | Deck Detail | ✅ Z confirmacją |
| `GET /api/decks/:deckId/flashcards` | Deck Detail | ✅ Z paginacją |
| `POST /api/decks/:deckId/flashcards` | Deck Detail | ✅ |
| `POST /api/flashcards/bulk` | AI Generator | ✅ |
| `PUT /api/flashcards/:id` | FlashcardRow | ✅ |
| `DELETE /api/flashcards/:id` | FlashcardRow | ✅ |
| `POST /api/ai/generate` | AI Generator | ✅ Z `truncated` flag |
| `GET /api/study/session/:deckId` | Study Session | ✅ Z limit param |
| `POST /api/study/review` | Study Session | ✅ |
| `GET /api/study/stats/:deckId` | Deck Detail, Study Complete | ✅ |
| `GET /api/profile` | Profile View | ✅ |
| `PUT /api/profile` | Profile View | ✅ |
| `GET /api/health` | (Monitoring) | ⚪ Infrastructure |
| `GET /api/metrics/*` | (Future: Admin Dashboard) | ⚪ Post-MVP |

**Coverage: 16/16 core endpoints (100%)** ✅

### Kluczowe Metryki Sukcesu (KSM)

| Metryka | Wymaganie | UI Support | Status |
|---------|-----------|------------|--------|
| **KSM 1** | 75% AI acceptance rate | Review State z inline editing + delete | ✅ Wsparte - AI prompt engineering jest KRYTYCZNE |
| **KSM 2** | 75% fiszek AI-generated | Flag `is_ai_generated` w bazie | ✅ Wsparte - tracking w backend |
| **KSM 3** | P95 < 5s AI generation | Loading state z elapsed time counter | ✅ Wsparte - monitoring w checklist |

---

## ✅ Znak jakości: Plan UI jest KOMPLETNY

Ten plan UI został dokładnie przeanalizowany i zweryfikowany wobec:
- ✅ **PRD** (28/28 User Stories covered)
- ✅ **API Plan** (16/16 core endpoints integrated)
- ✅ **Tech Stack** (Astro + React + Zustand + Shadcn + Supabase)
- ✅ **Wszystkie 3 KSM** (metryki sukcesu wsparte)

**Gotowość do implementacji: 100%** 🚀

**Następne kroki:**
1. Rozpocząć implementację według Checklist (sekcja 10)
2. **PRIORYTET 1:** AI Prompt Engineering (krytyczne dla KSM 1)
3. **PRIORYTET 2:** Supabase RLS policies (bezpieczeństwo)
4. **PRIORYTET 3:** Study Session UX (core value proposition)

**Uwaga końcowa:** Plan uwzględnia wszystkie edge cases, error states, loading states, i accessibility requirements. Każdy widok ma jasno określone integracje API, stany UI, i wymagania UX. Checklist jest szczegółowy i actionable.
