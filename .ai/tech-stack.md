# Analiza Stosu Technologicznego (Tech Stack) - 10xCards

Data: 25 października 2025
Autor: Menedżer Produktu
Status: Wersja robocza

Poniższa analiza ocenia proponowany stos technologiczny (`<tech-stack>`) pod kątem jego zdolności do realizacji wymagań zdefiniowanych w dokumencie PRD (`@prd.md`) dla aplikacji 10xCards.

---

## 1. Czy technologia pozwoli nam szybko dostarczyć MVP?

**Ocena: Tak, z pewnymi zastrzeżeniami dotyczącymi hostingu.**

Proponowany stos zawiera elementy, które drastycznie przyspieszają rozwój, ale także takie, które mogą go niepotrzebnie spowolnić na etapie MVP.

### Elementy Przyspieszające (Pro):

* **Supabase (Backend):** To największy akcelerator. Dostarcza gotowe uwierzytelnianie (adresuje US-001 do US-005) oraz bazę danych z SDK (adresuje US-006 do US-013). Eliminuje to potrzebę budowania i utrzymywania osobnego API backendowego dla operacji CRUD, co jest ogromną oszczędnością czasu.
* **Shadcn/ui (Frontend):** Jest to zbiór gotowych, stylowych komponentów (przyciski, modale, formularze, liczniki). Pozwoli to na błyskawiczne zbudowanie interfejsu dla Generatora AI (US-014), przepływu akceptacji (US-016) i Trybu Nauki (US-023, US-024) bez straty czasu na pisanie podstawowego CSS.
* **Openrouter.ai (AI):** Działa jako prosty interfejs API. Integracja jest prosta i nie powinna zająć dużo czasu.

### Elementy Spowalniające (Cons):

* **DigitalOcean + Docker (Hosting):** Jest to niepotrzebnie złożone rozwiązanie na etap MVP. Wymaga napisania `Dockerfile`, konfiguracji pipeline'u w Github Actions do budowania i pushowania obrazu oraz ręcznej konfiguracji serwera na DigitalOcean.
* **Astro + React (Frontend):** Chociaż to potężne połączenie, wprowadza dwie różne filozofie (Astro dla statycznych stron, React dla "wysp" interaktywności). Dla aplikacji, która w całości jest *po* zalogowaniu (czyli jest dynamiczna), może to być nadmiarowa złożoność w porównaniu do frameworka "full-stack" jak Next.js.

---

## 2. Czy rozwiązanie będzie skalowalne w miarę wzrostu projektu?

**Ocena: Zdecydowanie tak.**

Ten stos, choć częściowo złożony dla MVP, jest zbudowany z myślą o skalowalności.

* **Supabase:** Jest oparty na PostgreSQL i zaprojektowany do skalowania. Możemy zacząć od hostowanej wersji, a w razie potrzeby przenieść się na własną, większą instancję.
* **DigitalOcean + Docker:** To klasyczne, wysoce skalowalne podejście. Umożliwia łatwe skalowanie pionowe (mocniejszy serwer) i poziome (więcej kontenerów, load balancing), a w przyszłości migrację do Kubernetes (np. DOKS).
* **Openrouter.ai:** Jest to zarządzana usługa pośrednicząca, zaprojektowana do obsługi dużego ruchu API.
* **Astro/React:** Skalują się bez problemu po stronie frontendowej.

---

## 3. Czy koszt utrzymania i rozwoju będzie akceptowalny?

**Ocena: Tak, ale nie jest to opcja najtańsza z możliwych dla MVP.**

* **Koszty Stałe (Utrzymanie):**
    * **DigitalOcean:** Generuje stały miesięczny koszt za serwer (Droplet), nawet przy zerowym ruchu.
    * **Supabase:** Posiada hojny darmowy plan, który powinien wystarczyć na MVP. Koszty pojawią się wraz ze wzrostem bazy danych i liczby użytkowników, ale są przewidywalne.
* **Koszty Zmienne (Rozwój/Użycie):**
    * **Openrouter.ai:** To główny koszt zmienny, bezpośrednio powiązany z sukcesem metryki KSM 2 (Adopcja AI). Każde wygenerowanie fiszek (US-014) będzie generować koszt. Użycie `gpt-4o-mini` i limit 1000 znaków (zdefiniowany w PRD) pomagają utrzymać ten koszt w ryzach. Możliwość ustawienia limitów finansowych w Openrouter jest kluczową funkcją zarządzania ryzykiem.
* **Koszty Zerowe:** Frontend (Astro/React/TS/Tailwind/Shadcn) i CI/CD (Github Actions, w ramach darmowego limitu) są darmowe.

**Wniosek:** Koszt jest akceptowalny, ale koszt hostingu (DigitalOcean) można by zredukować do zera na etapie MVP, wybierając inną platformę.

---

## 4. Czy potrzebujemy aż tak złożonego rozwiązania?

**Ocena: Nie. Proponowany stos jest bardziej złożony niż wymaga tego MVP.**

Źródła niepotrzebnej złożoności to:

1.  **Hosting (Docker + DigitalOcean):** Wymaga ręcznej konfiguracji i utrzymania serwera. Dla aplikacji, która jest zasadniczo frontendem (Astro/React) komunikującym się z usługami BaaS (Supabase) i SaaS (Openrouter), jest to nadmiarowe.
2.  **Frontend (Astro + React):** PRD opisuje *aplikację* (za logowaniem), a nie stronę *contentową*. Korzyści z Astro (optymalizacja statycznej treści) są minimalne, gdy 99% widoków jest dynamicznych i wymaga Reacta (Lista Talii, Generator AI, Tryb Nauki). Użycie samego Reacta (np. przez Next.js lub Vite) uprościłoby architekturę.

---

## 5. Czy nie istnieje prostsze podejście, które spełni nasze wymagania?

**Ocena: Tak. Istnieje prostszy, tańszy i szybszy w dostarczeniu stos.**

Rekomendowany prostszy stos:

* **Frontend/Fullstack:** **Next.js** (lub alternatywnie sam React przez Vite).
* **UI:** React 19, TypeScript 5, Tailwind 4, Shadcn/ui (zachowujemy - to duży plus).
* **Backend:** **Supabase** (zachowujemy - idealny wybór).
* **AI:** **Openrouter.ai** (zachowujemy).
* **Hosting + CI/CD:** **Vercel** (lub Netlify).

**Uzasadnienie uproszczenia:**

1.  **Vercel zastępuje DigitalOcean + Docker + Github Actions:** Vercel oferuje hosting (z darmowym planem idealnym na MVP), CI/CD zintegrowane z Gitem (zero konfiguracji) oraz obsługę funkcji serverless (Serverless/Edge Functions).
2.  **Next.js zastępuje Astro + React:** Ujednolica stos frontendowy. Co najważniejsze, funkcje serverless Vercela (lub API routes w Next.js) są idealnym miejscem do bezpiecznego wywoływania API Openrouter (adresując problem bezpieczeństwa klucza API), bez potrzeby utrzymywania osobnego serwera.

To podejście redukuje koszty utrzymania MVP do $0 (darmowe plany Vercel i Supabase) i drastycznie skraca czas "od kodu do produkcji".

---

## 6. Czy technologie pozwoli nam zadbać o odpowiednie bezpieczeństwo?

**Ocena: Tak, ale wymaga to świadomej implementacji.**

* **Uwierzytelnianie i Dane Użytkownika:**
    * **Supabase:** To najmocniejszy punkt. Supabase Auth (JWT) i PostgreSQL z RLS (Row Level Security) to standard branżowy. Możemy (i musimy) skonfigurować RLS, aby użytkownik miał dostęp *tylko* do własnych talii i fiszek. Stos w pełni to wspiera.
* **Klucze API (Openrouter.ai):**
    * To główne ryzyko. Klucz API *nigdy* nie może znaleźć się w kodzie frontendowym (Astro/React).
    * Proponowany stos *wymusza* stworzenie jakiejś formy backendu pośredniczącego. W przypadku Astro, musielibyśmy użyć *API route* (endpointu po stronie serwera), który hostowany byłby na serwerze DigitalOcean.
    * Alternatywnie, można użyć **Supabase Edge Functions** – jest to bezpieczny sposób na ukrycie klucza i wywoływanie go po stronie serwera.
    * **Podsumowując:** Stos *pozwala* na bezpieczną implementację, ale to zadanie (stworzenie endpointu pośredniczącego) musi być wykonane.
* **Bezpieczeństwo Serwera:**
    * Wybierając **DigitalOcean**, bierzemy na siebie odpowiedzialność za bezpieczeństwo serwera (konfiguracja firewalla, zarządzanie kluczami SSH, aktualizacje systemu). Jest to dodatkowy obowiązek, którego uniknęlibyśmy, korzystając z zarządzanej platformy (jak Vercel lub Supabase Functions).

---

### Podsumowanie i Rekomendacje

Proponowany stos jest **funkcjonalny i wysoce skalowalny**, ale **nie jest zoptymalizowany pod kątem szybkości dostarczenia MVP i minimalizacji kosztów**.

Kluczowe komponenty (Supabase, Shadcn/ui, Openrouter) są doskonałym wyborem i bezpośrednio wspierają wymagania PRD.

Jednak komponenty hostingu (DigitalOcean + Docker) i architektura frontendu (Astro + React) wprowadzają niepotrzebną złożoność i koszty na tym etapie.

**Rekomendacja:** Należy rozważyć zastąpienie pary (DigitalOcean + Docker + Astro) parą (Vercel + Next.js). Pozwoli to zachować wszystkie zalety stosu (React, Shadcn, Supabase, Openrouter), jednocześnie drastycznie redukując koszty i czas wdrożenia MVP.