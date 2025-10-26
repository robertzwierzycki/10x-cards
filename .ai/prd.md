# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

10xCards to aplikacja internetowa zaprojektowana do automatycznego generowania fiszek edukacyjnych przy użyciu modeli LLM (gpt-4o-mini). Aplikacja usprawnia proces tworzenia wysokiej jakości fiszek z tekstu dostarczonego przez użytkownika, czyniąc naukę bardziej efektywną i angażującą. Użytkownicy mogą generować fiszki automatycznie za pomocą AI, tworzyć je i zarządzać nimi manualnie oraz uczyć się za pomocą zintegrowanego algorytmu powtórek (spaced repetition).

Główne funkcje MVP obejmują: system kont użytkowników (oparty na Supabase), generowanie fiszek AI z tekstu (do 1000 znaków), pełne zarządzanie taliami i fiszkami (CRUD) oraz "Tryb Nauki" oparty na gotowym, zewnętrznym algorytmie open-source.

## 2. Problem użytkownika

Główny Problem: Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest niezwykle czasochłonne. Ten proces zniechęca uczniów i studentów do korzystania z jednej z najefektywniejszych metod nauki, jaką jest metoda powtórek w interwałach (spaced repetition).

Cel: 10xCards ma na celu drastyczne skrócenie czasu potrzebnego na stworzenie zestawu fiszek z notatek, umożliwiając użytkownikom skupienie się na nauce, a nie na przygotowywaniu materiałów.

## 3. Wymagania funkcjonalne

Wersja MVP produktu będzie obejmować następujące główne moduły funkcjonalne:

1.  Uwierzytelnianie i Zarządzanie Kontem (Supabase)
    * Rejestracja użytkownika poprzez e-mail i hasło.
    * Logowanie na istniejące konto.
    * Mechanizm resetowania hasła ("Zapomniałem hasła").
    * Możliwość wylogowania się.
    * Niezalogowany użytkownik nie ma dostępu do innych widkoów aplikacji.

2.  Zarządzanie Talią (Decks)
    * Tworzenie nowej, pustej talii.
    * Wyświetlanie listy wszystkich talii należących do użytkownika (Dashboard).
    * Wyświetlanie widoku szczegółowego talii (lista zawartych w niej fiszek).
    * Możliwość zmiany nazwy istniejącej talii.
    * Możliwość usunięcia talii (wraz ze wszystkimi fiszkami i potwierdzeniem akcji).

3.  Zarządzanie Fiszkami (Flashcards)
    * Manualne tworzenie nowej fiszki (pola "Przód" i "Tył") w ramach wybranej talii.
    * Edycja treści istniejącej fiszki (pola "Przód" i "Tył").
    * Usunięcie pojedynczej fiszki z talii.
    * Pola "Przód" i "Tył" będą prostymi polami tekstowymi (`<textarea>`) obsługującymi jedynie znaki nowej linii (bez formatowania rich-text, obrazów itp.).

4.  Generator Fiszki AI (gpt-4o-mini)
    * Interfejs z polem tekstowym do wklejenia tekstu źródłowego.
    * Widoczny licznik znaków z limitem 1000 znaków (np. 850/1000). Tekst przekraczający limit będzie automatycznie obcinany.
    * Przycisk "Generuj", który wysyła zapytanie do API modelu gpt-4o-mini.
    * Wskaźnik ładowania podczas oczekiwania na odpowiedź AI.
    * Ekran przeglądu wygenerowanych sugestii (lista par Przód/Tył) pozwalający na edycję, usunięcie lub akceptację.
    * Możliwość zapisania zaakceptowanych fiszek do istniejącej talii lub poprzez stworzenie nowej talii.
    * Fiszki stworzone w tym procesie będą miały w bazie danych flagę `is_ai_generated = true`.

5.  Tryb Nauki (Spaced Repetition)
    * Integracja z wybranym algorytmem SR open-source (np. FSRS, implementacja SM-2).
    * Przycisk "Rozpocznij naukę" na widoku talii, który rozpoczyna sesję powtórkową.
    * System serwuje użytkownikowi fiszki zaplanowane na dany dzień zgodnie z logiką algorytmu SR.
    * Interfejs nauki: wyświetlenie "Przodu" fiszki, przycisk "Pokaż Tył".
    * Po odsłonięciu "Tyłu", użytkownik ocenia znajomość za pomocą trzech przycisków: "Nie wiem", "Wiem", "Opanowane".
    * Ocena jest przekazywana do algorytmu SR, który oblicza nowy interwał powtórki dla danej fiszki.
    * Ekran podsumowania po zakończeniu sesji (np. "Nauczyłeś się X fiszek").

6.  Wymagania Niefunkcjonalne
    * Wydajność AI: Czas odpowiedzi P95 (percentyl 95) na wygenerowanie sugestii fiszek (od kliknięcia "Generuj" do wyświetlenia listy) musi być krótszy niż 5 sekund.
    * Obsługa Błędów: Aplikacja musi wyświetlać jasne i zrozumiałe komunikaty o błędach (np. błąd API AI, błąd sieci, nieudana walidacja formularza).

## 4. Granice produktu

Następujące funkcje i elementy są celowo wyłączone z zakresu MVP (Minimum Viable Product), aby umożliwić szybsze dostarczenie kluczowej wartości:

* Stworzenie własnego, zaawansowanego algorytmu powtórek (jak SuperMemo, Anki). Zamiast tego integrujemy gotowe rozwiązanie open-source.
* Import materiałów z różnych formatów plików (PDF, DOCX, itp.). Jedyną metodą wprowadzania danych dla AI jest kopiuj-wklej tekstu.
* Funkcje społecznościowe, takie jak publiczne przeglądanie lub współdzielenie zestawów fiszek między użytkownikami.
* Integracje z zewnętrznymi platformami edukacyjnymi (np. LMS, Moodle, Google Classroom).
* Dedykowane aplikacje mobilne (iOS, Android). Aplikacja będzie dostępna wyłącznie przez przeglądarkę internetową (responsive web).
* Zaawansowany edytor tekstu (Rich Text, pogrubienie, kursywa, listy, osadzanie obrazów). Fiszki będą obsługiwać tylko zwykły tekst.

## 5. Historyjki użytkowników

### Moduł: Uwierzytelnianie (AUTH)

* ID: US-001
* Tytuł: Rejestracja nowego użytkownika
* Opis: Jako nowy odwiedzający, chcę móc założyć konto używając mojego adresu e-mail i hasła, abym mógł zapisywać swoje talie i fiszki.
* Kryteria akceptacji:
    1.  Formularz rejestracji zawiera pola: e-mail, hasło, potwierdzenie hasła.
    2.  System waliduje poprawność formatu adresu e-mail.
    3.  System sprawdza, czy hasła w obu polach są identyczne.
    4.  System sprawdza, czy e-mail nie jest już zarejestrowany w systemie (przez Supabase).
    5.  Po pomyślnej rejestracji, użytkownik jest automatycznie logowany i przekierowywany do aplikacji (np. do generatora AI).

* ID: US-002
* Tytuł: Logowanie użytkownika
* Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto podając e-mail i hasło, aby uzyskać dostęp do moich talii.
* Kryteria akceptacji:
    1.  Formularz logowania zawiera pola: e-mail, hasło.
    2.  Po podaniu poprawnych danych, użytkownik jest zalogowany i przekierowany do strony głównej ("Lista Talii").
    3.  W przypadku podania błędnych danych, użytkownik widzi ogólny komunikat błędu (np. "Nieprawidłowy e-mail lub hasło").

* ID: US-003
* Tytuł: Wylogowanie użytkownika
* Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zakończyć moją sesję.
* Kryteria akceptacji:
    1.  W nawigacji aplikacji (np. w menu profilowym) znajduje się przycisk "Wyloguj".
    2.  Kliknięcie przycisku kończy sesję użytkownika (usuwa token) i przekierowuje go na stronę logowania.

* ID: US-004
* Tytuł: Inicjowanie resetowania hasła
* Opis: Jako użytkownik, który zapomniał hasła, chcę móc poprosić o link do jego zresetowania na mój adres e-mail.
* Kryteria akceptacji:
    1.  Na stronie logowania znajduje się link "Zapomniałem hasła".
    2.  Link prowadzi do formularza, w którym użytkownik podaje swój adres e-mail.
    3.  Po wysłaniu, system (Supabase) wysyła e-mail z unikalnym linkiem do resetowania hasła (jeśli e-mail istnieje w bazie).
    4.  Użytkownik widzi komunikat potwierdzający wysłanie instrukcji (niezależnie od tego, czy e-mail istniał).

* ID: US-005
* Tytuł: Wykonanie resetowania hasła
* Opis: Jako użytkownik, który otrzymał link do resetowania hasła, chcę móc ustawić nowe hasło.
* Kryteria akceptacji:
    1.  Kliknięcie w link z e-maila prowadzi do formularza ustawiania nowego hasła.
    2.  Formularz zawiera pola: nowe hasło, potwierdź nowe hasło.
    3.  Po pomyślnym ustawieniu nowego hasła, użytkownik jest o tym informowany i może się zalogować przy użyciu nowego hasła.

### Moduł: Zarządzanie Talią (DECK)

* ID: US-006
* Tytuł: Tworzenie nowej talii
* Opis: Jako użytkownik, chcę móc stworzyć nową, pustą talię z poziomu mojej listy talii, abym mógł zacząć dodawać do niej fiszki.
* Kryteria akceptacji:
    1.  Na stronie "Lista Talii" znajduje się przycisk "Stwórz nową talię".
    2.  Po kliknięciu, użytkownik jest proszony o podanie nazwy dla nowej talii.
    3.  Po zatwierdzeniu, nowa talia pojawia się na liście talii użytkownika.

* ID: US-007
* Tytuł: Wyświetlanie listy talii (Dashboard)
* Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich talii na stronie głównej, abym mógł wybrać, którą chcę przeglądać lub się z niej uczyć.
* Kryteria akceptacji:
    1.  Po zalogowaniu, strona główna (Dashboard) wyświetla listę wszystkich talii należących do użytkownika.
    2.  Każda pozycja na liście pokazuje nazwę talii.
    3.  Każda pozycja na liście jest klikalna i prowadzi do widoku "Szczegóły Talii".

* ID: US-008
* Tytuł: Wyświetlanie szczegółów talii
* Opis: Jako użytkownik, chcę móc kliknąć na talię, aby zobaczyć listę wszystkich fiszek, które ona zawiera.
* Kryteria akceptacji:
    1.  Po kliknięciu na talię z listy, użytkownik przechodzi do widoku "Szczegóły Talii".
    2.  Widok ten wyświetla nazwę talii oraz listę wszystkich zawartych w niej fiszek.
    3.  Każda fiszka na liście pokazuje tekst "Przodu" i "Tyłu".
    4.  Na tym widoku znajdują się przyciski do: "Rozpocznij naukę", "Dodaj fiszkę" (manualnie), "Edytuj talię" (zmiana nazwy/usunięcie).

* ID: US-009
* Tytuł: Zmiana nazwy talii
* Opis: Jako użytkownik, chcę móc zmienić nazwę istniejącej talii.
* Kryteria akceptacji:
    1.  W widoku "Szczegóły Talii" znajduje się opcja edycji (np. ikona ołówka).
    2.  Użytkownik może wprowadzić nową nazwę i ją zapisać.
    3.  Zmieniona nazwa jest widoczna na liście talii i w widoku szczegółów.

* ID: US-010
* Tytuł: Usuwanie talii
* Opis: Jako użytkownik, chcę móc usunąć całą talię, której już nie potrzebuję.
* Kryteria akceptacji:
    1.  W widoku "Szczegóły Talii" (lub obok talii na liście) znajduje się opcja "Usuń".
    2.  Po kliknięciu "Usuń", system wyświetla modal z potwierdzeniem (np. "Czy na pewno chcesz usunąć talię '[Nazwa Talii]'? Spowoduje to usunięcie X fiszek. Tej akcji nie można cofnąć.").
    3.  Po potwierdzeniu, talia i wszystkie powiązane z nią fiszki są trwale usuwane z bazy danych.

### Moduł: Zarządzanie Fiszkami - Manualne (CARD-M)

* ID: US-011
* Tytuł: Manualne tworzenie fiszki
* Opis: Jako użytkownik, chcę móc manualnie dodać nową fiszkę (Przód i Tył) do wybranej talii.
* Kryteria akceptacji:
    1.  W widoku "Szczegóły Talii" znajduje się przycisk "Dodaj fiszkę".
    2.  Po kliknięciu, pojawia się formularz z dwoma polami `<textarea>`: "Przód" i "Tył".
    3.  Po wypełnieniu i zapisaniu, nowa fiszka jest dodawana na koniec listy fiszek w tej talii.
    4.  Fiszka stworzona w ten sposób ma flagę `is_ai_generated = false`.

* ID: US-012
* Tytuł: Edycja istniejącej fiszki
* Opis: Jako użytkownik, chcę móc edytować treść "Przodu" lub "Tyłu" istniejącej fiszki, aby poprawić błąd lub zaktualizować informację.
* Kryteria akceptacji:
    1.  Na liście fiszek w widoku talii, każda fiszka ma opcję "Edytuj".
    2.  Kliknięcie "Edytuj" pozwala na modyfikację tekstu w polach "Przód" i "Tył".
    3.  Zapisanie zmian aktualizuje fiszkę w bazie danych i na liście.
    4.  Edycja fiszki, która była wygenerowana przez AI, nie zmienia jej flagi `is_ai_generated`.

* ID: US-013
* Tytuł: Usuwanie pojedynczej fiszki
* Opis: Jako użytkownik, chcę móc usunąć pojedynczą fiszkę z talii.
* Kryteria akceptacji:
    1.  Na liście fiszek w widoku talii, każda fiszka ma opcję "Usuń".
    2.  Po kliknięciu "Usuń", system wyświetla szybkie potwierdzenie (np. "Czy na pewno usunąć?").
    3.  Po potwierdzeniu, fiszka jest usuwana z talii.

### Moduł: Generator AI (AI-GEN)

* ID: US-014
* Tytuł: Generowanie fiszek z tekstu (Główna ścieżka)
* Opis: Jako użytkownik, chcę wkleić fragment moich notatek, kliknąć "Generuj", aby otrzymać listę sugerowanych fiszek (Przód/Tył).
* Kryteria akceptacji:
    1.  Na stronie "Generator AI" znajduje się pole tekstowe `<textarea>`.
    2.  Po wklejeniu tekstu i kliknięciu "Generuj", przycisk staje się nieaktywny, a użytkownik widzi wskaźnik ładowania.
    3.  Aplikacja wysyła zapytanie do API gpt-4o-mini z tekstem użytkownika i promptem systemowym.
    4.  Po otrzymaniu odpowiedzi, system parsuje ją i wyświetla listę sugerowanych par fiszek (Przód/Tył) na ekranie przeglądu.

* ID: US-015
* Tytuł: Obsługa limitu 1000 znaków
* Opis: Jako użytkownik, wprowadzając tekst do generatora AI, chcę widzieć, ile znaków mi pozostało i być poinformowanym, jeśli przekroczę limit.
* Kryteria akceptacji:
    1.  Pod polem tekstowym generatora AI widoczny jest licznik znaków w formacie "X/1000".
    2.  Gdy użytkownik wklei tekst dłuższy niż 1000 znaków, tekst jest automatycznie obcinany do 1000 znaków.
    3.  Użytkownik widzi komunikat informujący, że tekst został obcięty.
    4.  Licznik pokazuje "1000/1000".

* ID: US-016
* Tytuł: Przegląd i akceptacja sugestii AI
* Opis: Jako użytkownik, po wygenerowaniu fiszek przez AI, chcę móc je przejrzeć i zapisać te, które mi odpowiadają, do wybranej talii.
* Kryteria akceptacji:
    1.  Ekran przeglądu wyświetla listę wygenerowanych par (Przód/Tył).
    2.  Na dole ekranu znajduje się rozwijana lista (select) moich istniejących talii oraz opcja "Stwórz nową talię".
    3.  Przycisk "Zapisz fiszki" jest aktywny.
    4.  Po kliknięciu "Zapisz", wszystkie widoczne na liście fiszki są zapisywane do wybranej talii z flagą `is_ai_generated = true`.

* ID: US-017
* Tytuł: Edycja sugestii AI przed zapisaniem
* Opis: Jako użytkownik, na ekranie przeglądu sugestii AI, chcę móc szybko edytować tekst w polach "Przód" lub "Tył" przed ich zapisaniem.
* Kryteria akceptacji:
    1.  Każda sugerowana para fiszek na liście przeglądu ma pola "Przód" i "Tył" w formie edytowalnych pól tekstowych.
    2.  Mogę zmienić tekst w tych polach.
    3.  Zmiany te są uwzględniane podczas zapisywania fiszek do talii.

* ID: US-018
* Tytuł: Odrzucenie sugestii AI przed zapisaniem
* Opis: Jako użytkownik, na ekranie przeglądu sugestii AI, chcę móc usunąć pojedyncze, niepasujące mi pary, aby nie zostały zapisane.
* Kryteria akceptacji:
    1.  Obok każdej sugerowanej pary fiszek znajduje się przycisk "Usuń" (np. ikona kosza).
    2.  Kliknięcie go usuwa parę z listy sugestii.
    3.  Usunięta para nie zostanie zapisana do talii po kliknięciu "Zapisz".

* ID: US-019
* Tytuł: Zapisywanie sugestii AI do nowej talii
* Opis: Jako użytkownik, na ekranie przeglądu sugestii AI, chcę mieć możliwość zapisania fiszek bezpośrednio do nowej talii, bez konieczności tworzenia jej wcześniej.
* Kryteria akceptacji:
    1.  W selektorze talii dostępna jest opcja "Stwórz nową talię...".
    2.  Wybranie tej opcji powoduje wyświetlenie pola do wpisania nazwy nowej talii.
    3.  Po kliknięciu "Zapisz", system najpierw tworzy nową talię o podanej nazwie, a następnie zapisuje w niej wygenerowane fiszki.

* ID: US-020
* Tytuł: Obsługa błędu API generatora AI
* Opis: Jako użytkownik, jeśli podczas generowania fiszek wystąpi błąd (np. błąd serwera AI), chcę otrzymać jasny komunikat.
* Kryteria akceptacji:
    1.  Jeśli zapytanie do API gpt-4o-mini zwróci błąd (np. status 500), wskaźnik ładowania znika.
    2.  Użytkownik widzi komunikat o błędzie, np. "Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie później."
    3.  Użytkownik może ponownie spróbować wysłać zapytanie.

* ID: US-021
* Tytuł: Obsługa braku wygenerowanych fiszek
* Opis: Jako użytkownik, jeśli wprowadzę tekst, z którego AI nie jest w stanie wygenerować żadnych sensownych fiszek, chcę zostać o tym poinformowany.
* Kryteria akceptacji:
    1.  Jeśli odpowiedź AI jest pusta lub nie zawiera poprawnie sformatowanych par fiszek, system nie przechodzi do ekranu przeglądu.
    2.  Użytkownik widzi komunikat, np. "Nie udało się wygenerować żadnych fiszek z podanego tekstu. Spróbuj użyć innego fragmentu."

### Moduł: Tryb Nauki (STUDY)

* ID: US-022
* Tytuł: Rozpoczęcie sesji nauki
* Opis: Jako użytkownik, chcę móc rozpocząć sesję nauki dla wybranej talii, aby powtórzyć materiał.
* Kryteria akceptacji:
    1.  Na stronie "Szczegóły Talii" znajduje się przycisk "Rozpocznij naukę".
    2.  Po kliknięciu, system (korzystając z algorytmu SR) pobiera fiszki zaplanowane do powtórki na dany dzień z tej talii.
    3.  Użytkownik jest przekierowywany do interfejsu nauki z pierwszą fiszką.

* ID: US-023
* Tytuł: Proces nauki - odkrywanie fiszki
* Opis: Podczas nauki, chcę najpierw zobaczyć "Przód" fiszki, a następnie, gdy będę gotowy, odkryć "Tył".
* Kryteria akceptacji:
    1.  Interfejs nauki domyślnie wyświetla tylko tekst z pola "Przód" fiszki.
    2.  Widoczny jest przycisk "Pokaż Tył".
    3.  Po kliknięciu przycisku, pod spodem wyświetlany jest tekst z pola "Tył" tej samej fiszki.

* ID: US-024
* Tytuł: Ocenianie znajomości fiszki
* Opis: Po zobaczeniu "Tyłu" fiszki, chcę ocenić, jak dobrze ją znałem, aby system mógł zaplanować kolejną powtórkę.
* Kryteria akceptacji:
    1.  Po odsłonięciu "Tyłu", przycisk "Pokaż Tył" znika lub jest nieaktywny.
    2.  Pojawiają się trzy przyciski oceny: "Nie wiem", "Wiem", "Opanowane".
    3.  Kliknięcie jednego z przycisków zapisuje ocenę, przekazuje ją do algorytmu SR (który aktualizuje parametry powtórki fiszki) i automatycznie ładuje kolejną fiszkę (lub kończy sesję).

* ID: US-025
* Tytuł: Zakończenie sesji nauki
* Opis: Jako użytkownik, po przejściu przez wszystkie zaplanowane fiszki, chcę zobaczyć ekran podsumowania sesji.
* Kryteria akceptacji:
    1.  Gdy w sesji nie ma już więcej fiszek do powtórzenia, użytkownik jest przenoszony do ekranu podsumowania.
    2.  Ekran ten wyświetla prosty komunikat, np. "Gratulacje! Ukończyłeś sesję. Powtórzono X fiszek."
    3.  Użytkownik ma możliwość powrotu do listy talii.

* ID: US-026
* Tytuł: Obsługa braku fiszek do powtórki
* Opis: Jako użytkownik, jeśli kliknę "Rozpocznij naukę", ale nie mam żadnych fiszek zaplanowanych na dziś (lub talia jest pusta), chcę otrzymać komunikat.
* Kryteria akceptacji:
    1.  Jeśli użytkownik kliknie "Rozpocznij naukę", a algorytm SR zwróci 0 fiszek na dany dzień:
    2.  (Wariant A) Przycisk "Rozpocznij naukę" jest nieaktywny (disabled) z podpowiedzią "Brak fiszek do powtórki na dziś".
    3.  (Wariant B) Po kliknięciu, użytkownik widzi komunikat "Brak fiszek do powtórki na dziś. Wróć jutro!" zamiast interfejsu nauki.

### Moduł: Nawigacja i Pierwsze Użycie (NAV/FTUE)

* ID: US-027
* Tytuł: Pierwsze doświadczenie użytkownika (FTUE)
* Opis: Jako nowy użytkownik, który właśnie się zarejestrował, chcę być natychmiast skierowany do głównej funkcji (Generator AI), aby od razu doświadczyć wartości produktu.
* Kryteria akceptacji:
    1.  Po pomyślnej rejestracji (US-001), użytkownik nie jest kierowany na listę talii (która jest pusta), ale bezpośrednio do strony "Generator AI".
    2.  Strona może zawierać prosty dymek lub komunikat powitalny, np. "Witaj w 10xCards! Wklej poniżej swoje notatki, aby stworzyć pierwsze fiszki."

* ID: US-028
* Tytuł: Główna nawigacja aplikacji
* Opis: Jako zalogowany użytkownik, chcę mieć stały i łatwy dostęp do kluczowych sekcji aplikacji.
* Kryteria akceptacji:
    1.  Po zalogowaniu, na górze strony widoczny jest pasek nawigacyjny.
    2.  Pasek ten zawiera linki do: "Lista Talii" (strona główna/dashboard), "Generator AI".
    3.  Pasek zawiera również menu/ikonę użytkownika, która umożliwia dostęp do strony "Profil" (na razie może być pusta) oraz przycisk "Wyloguj".

## 6. Metryki sukcesu

Kluczowe metryki sukcesu (KSM) dla MVP pozwolą ocenić adopcję i jakość głównej propozycji wartości (generowanie AI).

1.  KSM 1: Jakość Generowania AI
    * Metryka: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
    * Sposób mierzenia: Śledzenie stosunku fiszek, które zostały wygenerowane i nieusunięte przez użytkownika na ekranie "Przeglądu AI" (patrz US-018), do całkowitej liczby wygenerowanych fiszek w danej sesji.
    * Cel: `(Liczba fiszek zapisanych) / (Liczba fiszek pierwotnie zasugerowanych przez AI) >= 0.75`.

2.  KSM 2: Adopcja Funkcji AI (Kluczowa)
    * Metryka: 75% aktywnych fiszek w systemie posiada flagę `is_ai_generated = true`.
    * Sposób mierzenia: "Aktywna fiszka" jest definiowana jako fiszka, która została oceniona w "Trybie Nauki" (patrz US-024) przynajmniej raz w ciągu ostatnich 30 dni. Będziemy mierzyć stosunek aktywnych fiszek z flagą `is_ai_generated = true` do wszystkich aktywnych fiszek.
    * Cel: `(Aktywne fiszki z is_ai_generated=true) / (Wszystkie aktywne fiszki) >= 0.75`.

3.  KSM 3: Wydajność (Wymaganie Niefunkcjonalne)
    * Metryka: P95 czasu generowania fiszek (od kliknięcia "Generuj" do wyświetlenia listy sugestii) jest poniżej 5 sekund.
    * Sposób mierzenia: Logowanie i analiza percentyli czasów odpowiedzi po stronie serwera (czas zapytania do API gpt-4o-mini i przetwarzania) oraz po stronie klienta (całkowity czas oczekiwania użytkownika).
    * Cel: `P95(T_response) < 5000ms`.