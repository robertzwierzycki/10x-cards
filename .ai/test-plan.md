# Plan Testów Aplikacji 10xCards

**Data:** 26 października 2025
**Wersja:** 1.0
**Autor:** Gemini

## 1. Wprowadzenie

### 1.1. Cel Dokumentu
Celem tego dokumentu jest zdefiniowanie strategii, zakresu, zasobów i harmonogramu testowania aplikacji 10xCards w wersji MVP (Minimum Viable Product). Plan ten ma zapewnić, że aplikacja spełnia wymagania funkcjonalne i niefunkcjonalne określone w PRD, jest stabilna, bezpieczna i oferuje dobre doświadczenie użytkownika.

### 1.2. Zakres Testów
Testy obejmą wszystkie kluczowe moduły funkcjonalne MVP aplikacji 10xCards, w tym:
* Uwierzytelnianie i Zarządzanie Kontem (Supabase Auth)
* Zarządzanie Talią (CRUD)
* Zarządzanie Fiszkami (manualne CRUD)
* Generator Fiszek AI (integracja z OpenRouter, przepływ użytkownika)
* Tryb Nauki (integracja z algorytmem SR, sesja nauki)
* Podstawowa nawigacja i przepływ FTUE (First Time User Experience)
* Kluczowe wymagania niefunkcjonalne (wydajność AI, obsługa błędów)
* Responsywność interfejsu (Mobile/Desktop)

Funkcje *poza zakresem MVP* (zdefiniowane w PRD) nie będą objęte tym planem testów.

### 1.3. Założenia
* Dostępne będą stabilne środowiska testowe (deweloperskie, staging).
* API zewnętrzne (Supabase, OpenRouter) będą dostępne i stabilne podczas testów.
* Klucze API dla usług zewnętrznych będą dostępne dla środowisk testowych.
* Dokumentacja API (OpenAPI) będzie aktualna.

### 1.4. Definicje i Akronimy
* **MVP:** Minimum Viable Product
* **PRD:** Product Requirements Document
* **SR:** Spaced Repetition (Powtórki w interwałach)
* **RLS:** Row Level Security (Bezpieczeństwo na poziomie wiersza w Supabase)
* **FTUE:** First Time User Experience (Pierwsze doświadczenie użytkownika)
* **KSM:** Kluczowa Metryka Sukcesu
* **E2E:** End-to-End (Testy kompleksowe)
* **API:** Application Programming Interface
* **UI:** User Interface

---

## 2. Strategia Testów

Strategia opiera się na **piramidzie testów**, koncentrując się na różnych poziomach w celu zapewnienia kompleksowego pokrycia.

### 2.1. Poziomy Testowania
1.  **Testy Jednostkowe (Unit Tests):**
    * **Cel:** Weryfikacja poprawności działania małych, izolowanych fragmentów kodu (funkcje, komponenty React, hooki, schematy Zod, logika serwisów).
    * **Zakres:** Logika biznesowa w serwisach (`src/services`), hooki React (`src/hooks`), funkcje pomocnicze (`src/lib`), schematy Zod (`src/schemas`), akcje i selektory Zustand (`src/stores`).
    * **Narzędzia:** Vitest (lub Jest), React Testing Library (RTL).
2.  **Testy Integracyjne (Integration Tests):**
    * **Cel:** Weryfikacja interakcji między różnymi modułami aplikacji.
    * **Zakres:**
        * Interakcje komponentów React w ramach "wyspy" (np. przepływ w dialogu, walidacja formularza).
        * Integracja komponentów React ze storem Zustand.
        * Integracja Astro API Routes z serwisami i Supabase (mockując klienta Supabase lub używając testowej bazy danych).
        * Integracja serwisu AI z mockowanym API OpenRouter.
    * **Narzędzia:** Vitest/Jest, RTL, Supertest (dla API routes), MSW (Mock Service Worker) lub Nock.
3.  **Testy End-to-End (E2E Tests):**
    * **Cel:** Symulacja rzeczywistych przepływów użytkownika w przeglądarce, weryfikacja całej aplikacji od UI po bazę danych.
    * **Zakres:** Kluczowe scenariusze użytkownika (rejestracja, logowanie, FTUE z generowaniem AI, tworzenie talii/fiszki manualnie, pełna sesja nauki, reset hasła).
    * **Narzędzia:** Playwright (preferowany) lub Cypress.
4.  **Testy Bazy Danych:**
    * **Cel:** Weryfikacja poprawności schematu, RLS, triggerów, constraints.
    * **Zakres:** Polityki RLS (izolacja danych), trigger `updated_at`, ograniczenia `UNIQUE`, `CHECK`, `FOREIGN KEY` (w tym `ON DELETE CASCADE`).
    * **Narzędzia:** Supabase test helpers (jeśli dostępne), pgTAP, lub testy integracyjne API sprawdzające efekty uboczne w bazie.
5.  **Testy Manualne Eksploracyjne:**
    * **Cel:** Odkrywanie nieprzewidzianych błędów, ocena UX/UI, weryfikacja przypadków brzegowych.
    * **Zakres:** Cała aplikacja, ze szczególnym uwzględnieniem responsywności, obsługi błędów i przepływów FTUE.

### 2.2. Typy Testów
* **Testy Funkcjonalne:** Weryfikacja, czy funkcje działają zgodnie z wymaganiami PRD (User Stories).
* **Testy Walidacji:** Sprawdzenie poprawności walidacji danych wejściowych (formularze, API).
* **Testy UI/UX:** Ocena interfejsu pod kątem spójności, łatwości użycia i estetyki (głównie manualne).
* **Testy Wydajności:** Skupione na KSM 3 (czas generowania AI < 5s P95). Możliwe użycie k6 lub Playwright metrics.
* **Testy Bezpieczeństwa:** Weryfikacja uwierzytelniania, autoryzacji (RLS), ochrony przed XSS (sanitacja inputów), bezpieczeństwa kluczy API.
* **Testy Dostępności (Accessibility):** Podstawowa weryfikacja zgodności z WCAG AA (kontrast, nawigacja klawiaturą, ARIA). Użycie Axe DevTools.
* **Testy Kompatybilności:** Sprawdzenie działania na głównych przeglądarkach (Chrome, Firefox, Safari) i systemach (desktop/mobile).
* **Testy Regresji:** Uruchamiane automatycznie (CI) lub manualnie przed wydaniem, aby upewnić się, że nowe zmiany nie zepsuły istniejących funkcji.

### 2.3. Narzędzia Testowe
* **Framework Testowy:** Vitest (lub Jest)
* **Testy Komponentów/Integracyjne UI:** React Testing Library (RTL)
* **Testy E2E:** Playwright (preferowany)
* **Mockowanie API:** MSW (Mock Service Worker) lub Nock
* **Asercje:** Vitest/Jest `expect`, `chai` (opcjonalnie)
* **Testy Dostępności:** Axe DevTools (rozszerzenie przeglądarki, biblioteka `axe-core`)
* **Testy Wydajności:** k6, Playwright `trace`
* **CI/CD:** GitHub Actions (do uruchamiania testów automatycznych)

---

## 3. Środowiska Testowe

1.  **Lokalne Środowisko Deweloperskie:**
    * Uruchamiane przez `npm run dev`.
    * Wykorzystywane do testów jednostkowych, integracyjnych i manualnych podczas developmentu.
    * Połączone z lokalną instancją Supabase (jeśli używana) lub deweloperskim projektem Supabase Cloud.
2.  **Środowisko CI (Continuous Integration):**
    * Konfiguracja w GitHub Actions.
    * Uruchamia testy jednostkowe, integracyjne (z mockami lub dedykowaną bazą testową Supabase) i E2E (opcjonalnie) przy każdym pushu/PR.
3.  **Środowisko Staging:**
    * Osobna instancja aplikacji wdrożona na platformie hostingowej (np. Vercel, DigitalOcean).
    * Połączona z dedykowanym projektem Supabase (staging).
    * Używane do testów akceptacyjnych (UAT), E2E i eksploracyjnych przed wdrożeniem na produkcję.
4.  **Środowisko Produkcyjne:**
    * Ograniczone testy "smoke tests" po wdrożeniu.
    * Ciągły monitoring i alertowanie.

---

## 4. Obszary Funkcjonalne do Testowania (Priorytetyzowane)

### P1 (Krytyczne - Muszą działać bezbłędnie)
* **AUTH-P1:** Rejestracja nowego użytkownika (US-001)
* **AUTH-P1:** Logowanie istniejącego użytkownika (US-002)
* **AUTH-P1:** Działanie RLS - izolacja danych użytkownika (testy DB/API)
* **AI-GEN-P1:** Podstawowy przepływ generowania AI (tekst -> generuj -> przegląd -> zapis do nowej talii) (US-014, US-016, US-019)
* **STUDY-P1:** Podstawowy przepływ sesji nauki (start -> pokaż przód -> pokaż tył -> oceń -> następna karta -> zakończ) (US-022, US-023, US-024, US-025)
* **DECK-P1:** Tworzenie nowej talii (US-006)
* **DECK-P1:** Wyświetlanie listy talii (US-007)
* **DECK-P1:** Wyświetlanie szczegółów talii (US-008)
* **CARD-M-P1:** Manualne tworzenie fiszki (US-011)
* **API-SEC-P1:** Ochrona endpointów API wymagających autoryzacji
* **API-SEC-P1:** Bezpieczne przechowywanie i użycie klucza OpenRouter API

### P2 (Wysokie - Kluczowe funkcje wspierające)
* **AUTH-P2:** Wylogowanie (US-003)
* **AUTH-P2:** Pełny przepływ resetowania hasła (US-004, US-005)
* **AI-GEN-P2:** Obsługa limitu 1000 znaków (obcinanie, komunikat) (US-015)
* **AI-GEN-P2:** Edycja i usuwanie sugestii AI przed zapisem (US-017, US-018)
* **AI-GEN-P2:** Zapis sugestii AI do istniejącej talii (US-016)
* **AI-GEN-P2:** Obsługa błędów API AI (5xx, timeout) i pustej odpowiedzi (US-020, US-021)
* **AI-GEN-P2:** Obsługa Rate Limiting (429) w UI (countdown)
* **STUDY-P2:** Poprawność działania algorytmu SR (podstawowe scenariusze: nowa karta, poprawna odpowiedź, błąd)
* **STUDY-P2:** Obsługa braku fiszek do powtórki (US-026)
* **STUDY-P2:** Przycisk "Rozpocznij naukę" - stany disabled/enabled
* **DECK-P2:** Zmiana nazwy talii (US-009) i obsługa konfliktu nazw (409)
* **DECK-P2:** Usuwanie talii z potwierdzeniem (US-010) i weryfikacja CASCADE delete
* **CARD-M-P2:** Edycja fiszki manualnej (US-012)
* **CARD-M-P2:** Usuwanie fiszki manualnej (US-013)
* **DASH-P2:** Filtrowanie talii (client-side search)
* **DASH-P2:** Sortowanie talii
* **UI-P2:** Podstawowa responsywność (mobile vs desktop dla głównych widoków)
* **FTUE-P2:** Przekierowanie po rejestracji do `/generate` (US-027)

### P3 (Średnie - Usprawnienia i przypadki brzegowe)
* **PROFILE-P3:** Wyświetlanie profilu (email read-only)
* **PROFILE-P3:** Aktualizacja username (walidacja, unikalność)
* **DASH-P3:** Paginacja listy talii ("Load More" / Infinite Scroll)
* **DECK-DETAIL-P3:** Paginacja listy fiszek
* **UI-P3:** Obsługa stanów pustych (Empty States) we wszystkich relevantnych miejscach
* **UI-P3:** Obsługa stanów ładowania (Skeleton Loaders)
* **UI-P3:** Spójność komponentów Shadcn/ui
* **A11Y-P3:** Podstawowe testy dostępności (nawigacja klawiaturą, kontrast, etykiety ARIA)
* **PERF-P3:** Testowanie KSM 3 (P95 < 5s dla AI Generation)
* **API-P3:** Testowanie endpointów metryk (`/api/metrics/*`)
* **API-P3:** Testowanie endpointu Health Check (`/api/health`)
* **BROWSER-P3:** Testy na najnowszych wersjach Chrome, Firefox, Safari (desktop) i Chrome/Safari (mobile)

---

## 5. Testy Niefunkcjonalne

### 5.1. Testy Wydajności
* **Cel:** Weryfikacja spełnienia KSM 3 (P95 < 5s dla generowania AI).
* **Metoda:** Użycie narzędzi deweloperskich przeglądarki (zakładka Network) do pomiaru czasu od kliknięcia "Generuj" do wyświetlenia sugestii. Symulacja różnych długości tekstu (100, 500, 1000 znaków). Testy na środowisku staging. Opcjonalnie: skrypty k6 do testów obciążeniowych API `/api/ai/generate`.
* **Kryteria Akceptacji:** P95 czasu odpowiedzi < 5000ms.

### 5.2. Testy Bezpieczeństwa
* **Cel:** Weryfikacja mechanizmów uwierzytelniania, autoryzacji i ochrony danych.
* **Metoda:**
    * Próby dostępu do chronionych zasobów bez logowania (oczekiwany redirect lub 401).
    * Próby dostępu do zasobów innego użytkownika (oczekiwane 403 lub 404).
    * Weryfikacja polityk RLS w Supabase (manualna inspekcja + testy API).
    * Sprawdzenie, czy klucz API OpenRouter nie jest eksponowany po stronie klienta.
    * Testy na podstawowe ataki XSS (wstrzykiwanie skryptów w pola tekstowe - oczekiwana sanitacja).
    * Sprawdzenie mechanizmu resetowania hasła (ważność linku, ochrona przed brute-force).
* **Kryteria Akceptacji:** Brak możliwości nieautoryzowanego dostępu. Poprawna izolacja danych użytkowników. Brak wycieku kluczy API. Poprawna sanitacja danych wejściowych.

### 5.3. Testy Użyteczności (UX)
* **Cel:** Ocena łatwości obsługi, intuicyjności i ogólnego doświadczenia użytkownika.
* **Metoda:** Testy eksploracyjne, heurystyki Nielsena, (opcjonalnie) testy z niewielką grupą użytkowników.
* **Kryteria Akceptacji:**
    * Przepływy FTUE, generowania AI i nauki są płynne i zrozumiałe.
    * Nawigacja jest spójna i przewidywalna.
    * Komunikaty błędów są jasne i pomocne.
    * Stany ładowania i puste są poprawnie obsługiwane.

### 5.4. Testy Dostępności (Accessibility)
* **Cel:** Zapewnienie podstawowej zgodności z WCAG 2.1 AA.
* **Metoda:**
    * Użycie narzędzia Axe DevTools (rozszerzenie przeglądarki) do automatycznej analizy.
    * Manualne testy nawigacji klawiaturą (Tab, Shift+Tab, Enter, Space, Esc).
    * Sprawdzenie kontrastu kolorów (narzędzia online lub wbudowane w przeglądarkę).
    * Weryfikacja semantyki HTML i użycia atrybutów ARIA (np. dla dialogów, przycisków ikonowych).
* **Kryteria Akceptacji:** Brak krytycznych błędów zgłaszanych przez Axe. Możliwość pełnej obsługi aplikacji za pomocą klawiatury. Współczynnik kontrastu > 4.5:1 dla tekstu.

### 5.5. Testy Kompatybilności
* **Cel:** Zapewnienie poprawnego działania na popularnych przeglądarkach i urządzeniach.
* **Metoda:** Testy manualne na docelowych platformach.
* **Zakres:**
    * **Przeglądarki Desktop:** Ostatnie 2 wersje Chrome, Firefox, Safari.
    * **Przeglądarki Mobile:** Chrome (Android), Safari (iOS).
    * **Rozdzielczości:** Mobile (375px), Tablet (768px), Desktop (1024px, 1440px).
* **Kryteria Akceptacji:** Aplikacja renderuje się poprawnie i wszystkie funkcje działają zgodnie z oczekiwaniami na wszystkich testowanych platformach.

---

## 6. Automatyzacja Testów

* **Testy Jednostkowe i Integracyjne:** Powinny być w pełni zautomatyzowane i uruchamiane w CI przy każdym pushu/PR. Cel: >80% pokrycia kodu dla logiki biznesowej (serwisy, hooki).
* **Testy E2E:** Kluczowe przepływy (P1) powinny być zautomatyzowane przy użyciu Playwright. Uruchamiane w CI (np. raz dziennie lub przed wdrożeniem na staging).
* **Testy Bazy Danych (RLS):** Można zautomatyzować za pomocą skryptów SQL/pgTAP uruchamianych w CI na testowej bazie danych lub poprzez dedykowane testy integracyjne API.

---

## 7. Zarządzanie Defektami

* **Zgłaszanie Błędów:** Użycie systemu śledzenia błędów (np. GitHub Issues). Każdy zgłoszony błąd powinien zawierać:
    * Tytuł
    * Opis (kroki do reprodukcji, oczekiwany vs aktualny wynik)
    * Środowisko (przeglądarka, OS, środowisko testowe)
    * Priorytet (Krytyczny, Wysoki, Średni, Niski)
    * Zrzuty ekranu/wideo (jeśli dotyczy)
* **Cykl Życia Błędu:** Nowy -> W Trakcie -> Do Weryfikacji -> Zamknięty / Otwarty Ponownie.
* **Priorytetyzacja:** Błędy krytyczne (blokujące główne funkcje, utrata danych, luki bezpieczeństwa) muszą być naprawione przed wydaniem MVP.

---

## 8. Kryteria Wejścia i Wyjścia

### 8.1. Kryteria Wejścia (Rozpoczęcie Testów)
* Funkcjonalność jest zaimplementowana i wdrożona na środowisku testowym.
* Testy jednostkowe i integracyjne przechodzą w CI.
* Dostępna jest dokumentacja (User Stories, API spec).

### 8.2. Kryteria Wyjścia (Zakończenie Testów / Gotowość do Wydania MVP)
* Wszystkie zautomatyzowane testy (jednostkowe, integracyjne, E2E P1) przechodzą.
* Wszystkie testy manualne dla scenariuszy P1 i P2 zostały wykonane i zakończone sukcesem.
* Brak znanych błędów krytycznych (P1).
* Liczba znanych błędów wysokiego priorytetu (P2) jest akceptowalna przez Product Ownera.
* Spełnione są kluczowe wymagania niefunkcjonalne (KSM 3, podstawowa dostępność i bezpieczeństwo).
* Dokumentacja testowa jest kompletna.

---

## 9. Zasoby i Harmonogram

*(Ta sekcja jest placeholderem i wymaga uzupełnienia przez zespół)*

* **Zespół Testowy:** [Określić role, np. QA Engineer, Deweloperzy]
* **Narzędzia:** [Potwierdzić listę narzędzi]
* **Harmonogram:** Testy powinny być prowadzone równolegle z developmentem (testy jednostkowe, integracyjne) oraz w dedykowanych fazach (testy E2E, UAT, eksploracyjne) przed wydaniem MVP.

---

## 10. Ryzyka i Plany Awaryjne

* **Ryzyko:** Niestabilność API OpenRouter.
    * **Plan:** Implementacja solidnego mechanizmu retry, monitorowanie API, przygotowanie komunikatu dla użytkowników w razie awarii.
* **Ryzyko:** Błędy w politykach RLS Supabase prowadzące do wycieku danych.
    * **Plan:** Dedykowane testy RLS, przegląd kodu polityk, regularne audyty bezpieczeństwa.
* **Ryzyko:** Niska jakość generowanych fiszek AI (niespełnienie KSM 1).
    * **Plan:** Iteracyjne ulepszanie promptu systemowego, monitoring metryki akceptacji, A/B testy promptów (jeśli możliwe).
* **Ryzyko:** Problemy z wydajnością generowania AI (niespełnienie KSM 3).
    * **Plan:** Optymalizacja zapytań do AI, badanie możliwości cache'owania, informowanie użytkownika o dłuższym czasie oczekiwania.
* **Ryzyko:** Złożoność testowania hybrydowego frontendu (Astro+React).
    * **Plan:** Skupienie testów E2E na kluczowych interakcjach, użycie `waitFor` w Playwright/Cypress do obsługi hydracji.