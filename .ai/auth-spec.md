# Specyfikacja techniczna modułu autentykacji - 10xCards

## Streszczenie

Dokument przedstawia szczegółową architekturę modułu autentykacji dla aplikacji 10xCards, obejmującą rejestrację, logowanie, wylogowanie oraz odzyskiwanie hasła. Implementacja opiera się na Supabase Auth jako głównym systemie zarządzania tożsamością, zintegrowanym z aplikacją Astro poprzez middleware SSR oraz komponenty React po stronie klienta.

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Struktura stron i komponentów

#### 1.1.1 Strony publiczne (bez autoryzacji)

**`/login` (src/pages/login.astro)** - ISTNIEJE
- Layout: `PublicLayout`
- Komponent: `LoginForm` (React z client:load)
- Funkcje: Logowanie użytkownika, przekierowanie po zalogowaniu
- Parametry URL: `?redirectTo=` - opcjonalna ścieżka powrotu po zalogowaniu

**`/register` (src/pages/register.astro)** - ISTNIEJE
- Layout: `PublicLayout`
- Komponent: `RegisterForm` (React z client:load)
- Funkcje: Rejestracja nowego konta, walidacja formularza, obsługa błędów
- Po rejestracji: Przekierowanie do `/generate` (FTUE) lub `/login` (jeśli wymagane potwierdzenie email)

**`/reset-password` (src/pages/reset-password.astro)** - DO UTWORZENIA
- Layout: `PublicLayout`
- Komponent: `ResetPasswordForm` (React z client:load)
- Funkcje: Żądanie resetu hasła, wysyłka emaila z linkiem
- Stan: Formularz żądania → Potwierdzenie wysyłki

**`/auth/reset` (src/pages/auth/reset.astro)** - DO UTWORZENIA
- Layout: `PublicLayout`
- Komponent: `NewPasswordForm` (React z client:load)
- Funkcje: Ustawienie nowego hasła po kliknięciu w link z emaila
- Parametry: Token autoryzacyjny z URL (automatycznie obsługiwany przez Supabase)

**`/auth/confirm` (src/pages/auth/confirm.astro)** - DO UTWORZENIA
- Layout: `PublicLayout`
- Komponent: `EmailConfirmation` (React z client:idle)
- Funkcje: Potwierdzenie adresu email po rejestracji
- Flow: Automatyczne przekierowanie po potwierdzeniu do `/login` lub `/generate`

#### 1.1.2 Komponenty React (client-side)

**LoginForm (src/components/auth/LoginForm.tsx)** - ISTNIEJE
- Walidacja: Zod schema (loginSchema)
- Pola: email, password
- Integracja: createBrowserClient z @supabase/ssr
- Obsługa błędów: Nieprawidłowe dane, rate limiting, błędy sieciowe
- Linki: Reset hasła, rejestracja

**RegisterForm (src/components/auth/RegisterForm.tsx)** - ISTNIEJE
- Walidacja: Zod schema (registerSchema)
- Pola: email, password, confirmPassword
- Integracja: createBrowserClient z @supabase/ssr
- Notyfikacje: toast (sonner) dla informacji o potwierdzeniu email
- Przekierowanie: Do `/generate` (FTUE) lub `/login`

**ResetPasswordForm (src/components/auth/ResetPasswordForm.tsx)** - DO UTWORZENIA
- Walidacja: resetPasswordRequestSchema
- Pole: email
- Stany:
  - Formularz wprowadzania emaila
  - Potwierdzenie wysyłki (niezależnie od istnienia emaila w bazie)
- Integracja: supabase.auth.resetPasswordForEmail()

**NewPasswordForm (src/components/auth/NewPasswordForm.tsx)** - DO UTWORZENIA
- Walidacja: resetPasswordConfirmSchema
- Pola: password, confirmPassword
- Stany:
  - Formularz nowego hasła
  - Sukces z przekierowaniem do logowania
- Integracja: supabase.auth.updateUser()

**EmailConfirmation (src/components/auth/EmailConfirmation.tsx)** - DO UTWORZENIA
- Stany:
  - Weryfikacja w toku (spinner)
  - Sukces (przekierowanie automatyczne)
  - Błąd (link wygasł, nieprawidłowy token)
- Integracja: Automatyczna obsługa przez Supabase callback

#### 1.1.3 Komponenty nawigacyjne

**UserMenu (src/components/navigation/UserMenu.tsx)** - DO UTWORZENIA
- Lokalizacja: W headerze aplikacji (dla zalogowanych)
- Zawartość:
  - Avatar/inicjały użytkownika
  - Email użytkownika
  - Link do profilu (placeholder)
  - Przycisk wylogowania
- Integracja: supabase.auth.signOut()

**AuthGuard (src/components/auth/AuthGuard.tsx)** - DO UTWORZENIA
- Wrapper komponent dla chronionych widoków React
- Sprawdzenie sesji przed renderowaniem
- Przekierowanie do `/login?redirectTo=` jeśli brak autoryzacji

### 1.2 Layouty i kontrola dostępu

**PublicLayout (src/layouts/PublicLayout.astro)** - ISTNIEJE
- Dla stron dostępnych bez logowania
- Minimalistyczny design, centrowane formularze
- Brak nawigacji aplikacji

**ProtectedLayout (src/layouts/ProtectedLayout.astro)** - ISTNIEJE
- Sprawdza `Astro.locals.user`
- Przekierowuje do `/login` jeśli brak użytkownika
- Zawiera pełną nawigację aplikacji

**Layout bazowy (src/layouts/Layout.astro)** - DO ROZSZERZENIA
- Dodanie komponentu `<Header />` z nawigacją
- Warunkowe renderowanie menu użytkownika
- Integracja z middleware dla danych użytkownika

### 1.3 Walidacja i komunikaty błędów

#### 1.3.1 Schematy walidacji (Zod)

**loginSchema** - ISTNIEJE
- email: format email, wymagany
- password: wymagane, min 1 znak

**registerSchema** - ISTNIEJE
- email: format email, wymagany
- password: min 6 znaków
- confirmPassword: musi się zgadzać z password

**resetPasswordRequestSchema** - ISTNIEJE
- email: format email, wymagany

**resetPasswordConfirmSchema** - ISTNIEJE
- password: min 8 znaków
- confirmPassword: musi się zgadzać

#### 1.3.2 Komunikaty błędów

**Błędy walidacji (client-side)**
- Wyświetlane inline pod polami formularza
- Czerwony kolor tekstu, ikona ostrzeżenia
- Natychmiastowa walidacja przy blur/submit

**Błędy serwerowe**
- Alert na górze formularza
- Rozróżnienie typów:
  - 400: "Nieprawidłowe dane"
  - 401: "Nieprawidłowy e-mail lub hasło"
  - 409: "Email już zarejestrowany"
  - 429: "Zbyt wiele prób, spróbuj później"
  - 500: "Błąd serwera, spróbuj ponownie"
  - Network: "Brak połączenia z internetem"

**Komunikaty sukcesu**
- Toast notification (sonner) dla:
  - Pomyślna rejestracja
  - Email wysłany (reset hasła)
  - Hasło zmienione
  - Wylogowanie

### 1.4 Scenariusze użytkownika

#### 1.4.1 Rejestracja (US-001)
1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (email, hasło x2)
3. System waliduje dane lokalnie
4. Wysyła żądanie do Supabase
5. Przypadki:
   - Email wolny → Konto utworzone → Email weryfikacyjny → Przekierowanie do `/login`
   - Email zajęty → Komunikat błędu
   - Auto-confirm włączone → Przekierowanie do `/generate` (FTUE)

#### 1.4.2 Logowanie (US-002)
1. Użytkownik wchodzi na `/login`
2. Wprowadza email i hasło
3. System waliduje i wysyła do Supabase
4. Przypadki:
   - Sukces → Przekierowanie do `redirectTo` lub `/` (dashboard)
   - Błędne dane → Komunikat błędu
   - Konto nieaktywne → Informacja o weryfikacji

#### 1.4.3 Reset hasła (US-004, US-005)
1. Użytkownik klika "Zapomniałem hasła" na `/login`
2. Przekierowanie do `/reset-password`
3. Wprowadza email
4. System wysyła link resetujący
5. Komunikat: "Sprawdź email" (zawsze, dla bezpieczeństwa)
6. Użytkownik klika link w emailu
7. Przekierowanie do `/auth/reset` z tokenem
8. Ustawia nowe hasło
9. Przekierowanie do `/login` z komunikatem sukcesu

#### 1.4.4 Wylogowanie (US-003)
1. Użytkownik klika "Wyloguj" w menu
2. System usuwa sesję Supabase
3. Przekierowanie do `/login`
4. Opcjonalnie: Toast z potwierdzeniem

## 2. LOGIKA BACKENDOWA

### 2.1 Middleware autentykacji

**`src/middleware.ts`** - DO UTWORZENIA

```typescript
interface MiddlewareFlow {
  // 1. Utworzenie klienta Supabase SSR
  createServerClient(request, response)

  // 2. Pobranie sesji
  supabase.auth.getSession()

  // 3. Refresh tokenu jeśli wygasł
  supabase.auth.refreshSession()

  // 4. Ustawienie Astro.locals
  locals.supabase = supabase
  locals.user = session?.user || undefined

  // 5. Obsługa callbacków auth
  if (url.pathname.startsWith('/auth/')) {
    handleAuthCallback()
  }

  // 6. Ochrona ścieżek
  protectedPaths = ['/dashboard', '/generate', '/study']
  if (protectedPaths && !user) {
    redirect('/login?redirectTo=' + url.pathname)
  }
}
```

### 2.2 Endpointy API

**`/api/auth/logout` (POST)** - DO UTWORZENIA
- Funkcja: Wylogowanie server-side
- Proces:
  1. Pobranie supabase z locals
  2. supabase.auth.signOut()
  3. Usunięcie ciasteczek sesji
  4. Response: { success: true }

**`/api/auth/session` (GET)** - DO UTWORZENIA
- Funkcja: Sprawdzenie statusu sesji
- Response:
  ```json
  {
    "authenticated": boolean,
    "user": { "id", "email", "created_at" } | null,
    "expiresAt": timestamp | null
  }
  ```

**`/api/auth/refresh` (POST)** - DO UTWORZENIA
- Funkcja: Odświeżenie tokenu
- Proces:
  1. supabase.auth.refreshSession()
  2. Aktualizacja ciasteczek
  3. Response: Nowa sesja lub błąd

### 2.3 Modele danych

**Tabela `auth.users` (zarządzana przez Supabase)**
- id: UUID
- email: string, unique
- created_at: timestamp
- email_confirmed_at: timestamp | null
- last_sign_in_at: timestamp

**Tabela `profiles` (custom)** - DO UTWORZENIA
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**RLS Policies**
```sql
-- Użytkownik może czytać tylko swój profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Użytkownik może aktualizować tylko swój profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2.4 Obsługa wyjątków

**Strategia try-catch**
```typescript
try {
  // Operacja Supabase
} catch (error) {
  if (error instanceof AuthError) {
    // Specyficzne błędy auth
    switch(error.status) {
      case 400: // Bad request
      case 422: // Validation error
        return validationError(error.message)
      case 401: // Unauthorized
        return unauthorizedError()
      case 429: // Rate limit
        return rateLimitError()
    }
  }
  // Logowanie do Sentry/monitoring
  logger.error(error)
  return internalError()
}
```

**Middleware error boundary**
- Przechwytywanie błędów w middleware
- Fallback do publicznego dostępu przy błędzie
- Logowanie błędów krytycznych

### 2.5 Server-side rendering z Astro

**Konfiguracja SSR**
- output: "server" w astro.config.mjs - ISTNIEJE
- adapter: @astrojs/node - ISTNIEJE
- mode: "standalone" - ISTNIEJE

**Integracja z Supabase w Astro**
```typescript
// W komponentach .astro
const supabase = Astro.locals.supabase
const user = Astro.locals.user

// Operacje CRUD
const { data, error } = await supabase
  .from('decks')
  .select('*')
  .eq('user_id', user.id)
```

## 3. SYSTEM AUTENTYKACJI

### 3.1 Konfiguracja Supabase Auth

**Ustawienia projektu Supabase**
```javascript
{
  // Auth Settings
  siteUrl: 'https://10xcards.pl',
  redirectUrls: [
    'http://localhost:3000/**',
    'https://10xcards.pl/**'
  ],

  // Email Templates
  emailTemplates: {
    confirmation: {
      subject: 'Potwierdź rejestrację w 10xCards',
      redirectTo: '{{ .SiteURL }}/auth/confirm'
    },
    resetPassword: {
      subject: 'Zresetuj hasło w 10xCards',
      redirectTo: '{{ .SiteURL }}/auth/reset'
    }
  },

  // Security
  passwordMinLength: 6,
  emailConfirmationRequired: true, // dla produkcji
  enableSignup: true,

  // Sessions
  jwtExpiry: 3600, // 1 godzina
  refreshTokenRotation: true
}
```

### 3.2 Przepływ autoryzacji

#### 3.2.1 Rejestracja
```mermaid
User -> RegisterForm: Wypełnia dane
RegisterForm -> Supabase: signUp(email, password)
Supabase -> Email: Wysyła link weryfikacyjny
Supabase -> RegisterForm: { user, session: null }
RegisterForm -> User: "Sprawdź email"
User -> Email: Klika link
Email -> /auth/confirm: Token weryfikacyjny
/auth/confirm -> Supabase: Potwierdza email
Supabase -> /auth/confirm: Sukces
/auth/confirm -> /login: Przekierowanie
```

#### 3.2.2 Logowanie
```mermaid
User -> LoginForm: Email + hasło
LoginForm -> Supabase: signInWithPassword()
Supabase -> LoginForm: { user, session }
LoginForm -> Middleware: Set cookies
Middleware -> Dashboard: Przekierowanie
```

#### 3.2.3 Sesja i refresh
```mermaid
Request -> Middleware: Każde żądanie
Middleware -> Supabase: getSession()
Supabase -> Middleware: session | null
Middleware -> Supabase: refreshSession() jeśli wygasła
Supabase -> Middleware: Nowy token
Middleware -> Astro.locals: user, supabase
Astro.locals -> Page/API: Dostępne dane
```

### 3.3 Bezpieczeństwo

**Zabezpieczenia implementowane:**

1. **HTTPS Only** - Wymuszenie SSL w produkcji
2. **Secure Cookies** - httpOnly, sameSite, secure flags
3. **CSRF Protection** - Token w Supabase Auth
4. **Rate Limiting** - Wbudowane w Supabase (5 prób/min)
5. **Password Policy** - Min 6 znaków (konfigurowalne)
6. **Email Verification** - Wymagane w produkcji
7. **Session Rotation** - Automatyczny refresh tokenów
8. **XSS Protection** - React escapowanie, CSP headers

**Content Security Policy**
```typescript
// middleware.ts
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' *.supabase.co; " +
  "connect-src 'self' *.supabase.co *.openrouter.ai; " +
  "img-src 'self' data: https:; " +
  "style-src 'self' 'unsafe-inline';"
)
```

### 3.4 Integracja z istniejącą aplikacją

**Migracja istniejących komponentów:**

1. **Aktualizacja ProtectedLayout**
   - Dodanie sprawdzenia wygaśnięcia sesji
   - Obsługa soft refresh w tle

2. **Rozszerzenie nawigacji**
   - Dodanie UserMenu do headerów
   - Warunkowe pokazywanie linków

3. **Aktualizacja API routes**
   - Sprawdzenie `locals.user` w każdym endpoincie
   - Jednolity format błędów 401

4. **Dashboard po zalogowaniu**
   - `/` przekierowuje do `/dashboard` dla zalogowanych
   - `/dashboard` pokazuje listę talii (US-007)

### 3.5 Monitoring i analityka

**Metryki do śledzenia:**

1. **Funnel rejestracji**
   - Rozpoczęte rejestracje
   - Ukończone rejestracje
   - Potwierdzone emaile
   - Czas do pierwszej akcji

2. **Bezpieczeństwo**
   - Nieudane logowania
   - Rate limit hits
   - Podejrzane wzorce (geolokalizacja)

3. **Performance**
   - Czas logowania P95 < 2s
   - Czas refresh tokenu P95 < 500ms
   - Dostępność 99.9%

**Integracja z Sentry**
```typescript
// middleware.ts
import * as Sentry from "@sentry/astro";

Sentry.setUser({
  id: user?.id,
  email: user?.email
});

// Śledzenie błędów auth
Sentry.captureException(error, {
  tags: {
    component: 'auth',
    action: 'login'
  }
});
```

## 4. Plan implementacji

### Faza 1: Infrastruktura (Priorytet: KRYTYCZNY)
1. Utworzenie `src/middleware.ts`
2. Konfiguracja Supabase SSR
3. Aktualizacja Astro.locals types

### Faza 2: Komponenty brakujące (Priorytet: WYSOKI)
1. ResetPasswordForm
2. NewPasswordForm
3. EmailConfirmation
4. UserMenu

### Faza 3: Strony auth (Priorytet: WYSOKI)
1. `/reset-password`
2. `/auth/reset`
3. `/auth/confirm`

### Faza 4: Integracja (Priorytet: ŚREDNI)
1. Aktualizacja Layout z nawigacją
2. Dodanie UserMenu do headerów
3. Testy end-to-end flow

### Faza 5: Bezpieczeństwo (Priorytet: WYSOKI)
1. CSP headers
2. Rate limiting własny
3. Monitoring Sentry

### Faza 6: Profile użytkownika (Priorytet: NISKI)
1. Tabela profiles
2. Strona /profile
3. Edycja profilu

## 5. Podsumowanie

Przedstawiona architektura modułu autentykacji dla 10xCards wykorzystuje mocne strony Supabase Auth, minimalizując ilość własnego kodu do utrzymania. Kluczowe elementy jak middleware SSR, komponenty formularzy i strony auth są już częściowo zaimplementowane, co przyspiesza rozwój.

Priorytetem jest utworzenie middleware.ts, który połączy Supabase z Astro, oraz uzupełnienie brakujących komponentów resetowania hasła. System jest zaprojektowany z myślą o bezpieczeństwie, skalowalności i dobrej praktyce UX, spełniając wszystkie wymagania z dokumentu PRD.

Całkowity czas implementacji brakujących elementów szacowany jest na 2-3 dni deweloperskie, przy założeniu że konfiguracja Supabase jest już gotowa.