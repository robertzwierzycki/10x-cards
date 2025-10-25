<conversation_summary>
<decisions>
1. Wszystkie 10 pierwotnych zaleceń dotyczących projektu bazy danych zostało zaakceptowanych jako podstawa do dalszych prac.
2. Zalecenie 6: Tabela `profiles` zostanie utworzona, ale bez pola na awatar. Będzie przechowywać podstawowe dane, takie jak nazwa użytkownika.
3. Zalecenie 7: Dla wszystkich pól tekstowych (`decks.name`, `flashcards.front`, `flashcards.back`) zostanie użyty typ danych `VARCHAR`, a nie `TEXT`.
4. Zalecenie 9: W schemacie bazy danych nie będą stosowane wartości domyślne (`DEFAULT`). Logika aplikacji będzie odpowiedzialna za ustawianie wartości początkowych.
</decisions>

<matched_recommendations>
1. **Modelowanie postępów w nauce:** Zostanie stworzona oddzielna tabela `study_records` łącząca `users` i `flashcards`, zawierająca pola wymagane przez algorytm Spaced Repetition (SR), takie jak `due_date`, `stability`, `difficulty`.
2. **Unikalność nazw talii:** Zostanie dodane ograniczenie unikalności (unique constraint) na parze kolumn (`user_id`, `name`) w tabeli `decks`.
3. **Usuwanie kaskadowe:** Relacje zostaną skonfigurowane z opcją `ON DELETE CASCADE`, aby usunięcie talii powodowało usunięcie jej fiszek, a usunięcie użytkownika – wszystkich jego danych.
4. **Indeksowanie:** Zostaną utworzone indeksy na kluczach obcych. Dodatkowo, powstanie kluczowy dla wydajności złożony indeks w tabeli `study_records` na kolumnach `user_id` i `due_date`.
5. **Bezpieczeństwo (RLS):** Zostaną zaimplementowane polityki Row-Level Security, aby użytkownicy mieli dostęp wyłącznie do swoich danych (talii, fiszek i rekordów nauki).
6. **Tabela profili:** Zostanie utworzona tabela `profiles` (powiązana 1-do-1 z `auth.users`), która będzie przechowywać publiczne dane użytkownika (np. `username`), ale bez pola na awatar.
7. **Typy danych:** Dla pól `decks.name`, `flashcards.front` i `flashcards.back` zostanie użyty typ `VARCHAR` z określonymi limitami długości.
8. **Automatyczna aktualizacja `updated_at`:** Zostanie zaimplementowany trigger bazodanowy, który automatycznie zaktualizuje pole `updated_at` przy każdej modyfikacji wiersza.
9. **Brak wartości domyślnych:** Schemat nie będzie zawierał wartości `DEFAULT`. Aplikacja będzie jawnie ustawiać wszystkie wymagane wartości przy tworzeniu rekordów.
10. **Pola dla metryk:** Tabela `study_records` będzie zawierać pole `last_review_date`, aby umożliwić identyfikację "aktywnych fiszek" na potrzeby metryki sukcesu KSM 2.
</matched_recommendations>

<database_planning_summary>
Na podstawie dokumentu wymagań produktu (PRD) i analizy stosu technologicznego, zaplanowano schemat bazy danych PostgreSQL dla aplikacji 10xCards.

**Główne wymagania:** Baza danych musi obsługiwać uwierzytelnianie użytkowników, pełne operacje CRUD na taliach i fiszkach, rozróżnienie między fiszkami tworzonymi manualnie a generowanymi przez AI, a także wspierać mechanizm nauki oparty na algorytmie Spaced Repetition (SR).

**Kluczowe encje i ich relacje:**
*   `users`: Zarządzana przez Supabase Auth, stanowi centralny punkt odniesienia dla własności danych.
*   `profiles`: Relacja jeden-do-jednego z `users`, przechowująca publiczne dane profilowe.
*   `decks`: Relacja wiele-do-jednego z `users`. Każda talia należy do jednego użytkownika.
*   `flashcards`: Relacja wiele-do-jednego z `decks`. Każda fiszka należy do jednej talii.
*   `study_records`: Tabela łącząca, realizująca relację wiele-do-wielu między `users` a `flashcards`. Przechowuje stan algorytmu SR (np. datę następnej powtórki, interwał) dla każdej fiszki i każdego użytkownika.

**Bezpieczeństwo i Skalowalność:**
*   **Bezpieczeństwo:** Kluczowym elementem jest wdrożenie polityk bezpieczeństwa na poziomie wiersza (RLS) dla wszystkich tabel. Zapewni to ścisłą izolację danych i uniemożliwi użytkownikom dostęp do danych innych niż własne.
*   **Skalowalność i Wydajność:** Wydajność zapytań, zwłaszcza tych dotyczących "Trybu Nauki", zostanie zapewniona przez strategiczne indeksowanie kluczy obcych oraz stworzenie złożonego indeksu do szybkiego wyszukiwania fiszek zaplanowanych do powtórki. Zastosowanie triggera do aktualizacji pól `updated_at` odciąży aplikację i zapewni spójność danych.
</database_planning_summary>

<unresolved_issues>
1.  **Długość pól `VARCHAR`:** Należy podjąć ostateczną decyzję co do maksymalnej długości pól `VARCHAR` dla `flashcards.front` i `flashcards.back`.
2.  **Pola dla algorytmu SR:** Ostateczna lista pól w tabeli `study_records` (np. `stability`, `difficulty`, `lapses`, `state`) będzie zależeć od konkretnej implementacji algorytmu Spaced Repetition (np. FSRS, SM-2), która zostanie wybrana na etapie kodowania.
</unresolved_issues>
</conversation_summary>