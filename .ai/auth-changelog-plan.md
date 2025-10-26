# Plan Integracji Backend Auth - 10xCards

**Data utworzenia:** 2025-10-26
**Status:** Zaplanowane (oczekuje na implementację)
**Wersja:** 1.0

---

## 🎯 Przegląd projektu

Integracja backend authentication dla aplikacji 10xCards zgodnie z:
- Specyfikacją: `.ai/auth-spec.md`
- User Stories: `.ai/prd.md` (Moduł AUTH - US-001 do US-005)
- Best practices: `CLAUDE.md` i `.ai/additional/supabase-auth.mdc`

---

## 📋 Decyzje architektoniczne

### Wybory techniczne (zatwierdzone przez użytkownika)

| # | Pytanie | Wybór | Uzasadnienie |
|---|---------|-------|--------------|
| 1 | **Architektura klienta Supabase** | **B - Backend-first** | API endpoints + przepisanie LoginForm/RegisterForm dla lepszego bezpieczeństwa i kontroli server-side |
| 2 | **Strategia odświeżania sesji** | **C - Auto-refresh** | Supabase SSR built-in token refresh (zero manual effort) |
| 3 | **Lokalizacja Header/UserMenu** | **A - Tylko ProtectedLayout** | MVP focus - publiczne strony nie potrzebują nawigacji |
| 4 | **Obsługa wylogowania** | **B - Client-side** | `createBrowserClient` w UserMenu (prostsza implementacja) |
| 5 | **Custom tabela profiles** | **B - Później** | MVP używa tylko `auth.users`, profiles po MVP |

---

## 📊 Aktualny stan implementacji

### ✅ Już zaimplementowane (75% gotowe)

**Strony auth (5/5):**
- ✅ `/login` - LoginForm z redirect handling
- ✅ `/register` - RegisterForm z toast notifications
- ✅ `/reset-password` - ResetPasswordForm
- ✅ `/auth/reset` - NewPasswordForm
- ✅ `/auth/confirm` - EmailConfirmation

**React komponenty (5/5):**
- ✅ `LoginForm.tsx` - obecnie używa `createBrowserClient` (DO PRZEPISANIA)
- ✅ `RegisterForm.tsx` - obecnie używa `createBrowserClient` (DO PRZEPISANIA)
- ✅ `ResetPasswordForm.tsx` - pozostaje bez zmian
- ✅ `NewPasswordForm.tsx` - pozostaje bez zmian
- ✅ `EmailConfirmation.tsx` - pozostaje bez zmian

**Infrastruktura:**
- ✅ `src/middleware/index.ts` - Supabase SSR client, route protection
- ✅ `src/schemas/auth.schema.ts` - Wszystkie 4 schematy Zod
- ✅ `src/layouts/PublicLayout.astro` - Layout dla stron auth
- ✅ `src/layouts/ProtectedLayout.astro` - Layout z auth check (DO ROZSZERZENIA)
- ✅ `src/env.d.ts` - TypeScript types dla env i Astro.locals

### ❌ Brakujące elementy (25%)

**API Endpoints (0/3):**
- ❌ `POST /api/auth/login`
- ❌ `POST /api/auth/register`
- ❌ `GET /api/auth/session` (opcjonalny)

**Komponenty nawigacyjne (0/2):**
- ❌ `UserMenu.tsx` - Dropdown z logout
- ❌ `Header.tsx` - Nawigacja dla zalogowanych

**Helpers (0/1):**
- ❌ `src/lib/supabase-server.ts` - Ujednolicony server client

---

## 🚀 Plan implementacji - 7 faz

### FAZA 1: Backend API Endpoints (45 min)

#### 1.1 Utworzenie Supabase Server Client Helper

**Plik:** `src/lib/supabase-server.ts` ✨ NOWY

**Funkcjonalność:**
- Export funkcji `createSupabaseServerClient(context)`
- Używa `createServerClient` z `@supabase/ssr`
- Cookie handling: `getAll()` i `setAll()` pattern
- Wykorzystywany w API routes i middleware

**Kod:**
```typescript
import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';

export const createSupabaseServerClient = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  return createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return context.headers.get('Cookie')?.split(';').map(c => {
            const [name, ...rest] = c.trim().split('=');
            return { name, value: rest.join('=') };
          }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          );
        },
      },
    }
  );
};
```

---

#### 1.2 API Endpoint: Login

**Plik:** `src/pages/api/auth/login.ts` ✨ NOWY

**Specyfikacja:**
- **Method:** POST
- **Request body:** `{ email: string, password: string }`
- **Validation:** `loginSchema` z Zod
- **Success response (200):**
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
  ```
- **Error responses:**
  - `400` - Validation failed (Zod error)
  - `401` - Invalid credentials
  - `500` - Server error

**Flow:**
1. Parse request JSON
2. Validate z `loginSchema`
3. Create Supabase client via `createSupabaseServerClient()`
4. Call `supabase.auth.signInWithPassword({ email, password })`
5. Return user data lub error

**Error handling:**
- Catch AuthError from Supabase
- Map error codes do odpowiednich HTTP status
- Return user-friendly error messages

---

#### 1.3 API Endpoint: Register

**Plik:** `src/pages/api/auth/register.ts` ✨ NOWY

**Specyfikacja:**
- **Method:** POST
- **Request body:** `{ email: string, password: string, confirmPassword: string }`
- **Validation:** `registerSchema` z Zod
- **Success response (200):**
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "requiresEmailConfirmation": true
  }
  ```
- **Error responses:**
  - `400` - Validation failed
  - `409` - Email already registered
  - `500` - Server error

**Flow:**
1. Parse request JSON
2. Validate z `registerSchema`
3. Create Supabase client
4. Call `supabase.auth.signUp({ email, password })`
5. Check if `session` is null (requires confirmation) lub present (auto-confirm)
6. Return user + `requiresEmailConfirmation` flag

**Edge case:**
- Jeśli Supabase ma email confirmation disabled → `requiresEmailConfirmation: false`
- Jeśli enabled → `requiresEmailConfirmation: true`

---

#### 1.4 API Endpoint: Session Status

**Plik:** `src/pages/api/auth/session.ts` ✨ NOWY (OPCJONALNY)

**Specyfikacja:**
- **Method:** GET
- **Success response (200):**
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-01-15T10:30:00Z"
    }
  }
  ```
- **Unauthenticated response (200):**
  ```json
  {
    "authenticated": false,
    "user": null
  }
  ```

**Flow:**
1. Create Supabase client
2. Call `supabase.auth.getUser()`
3. Return authentication status

**Użycie:**
- Client-side sprawdzenie statusu sesji
- Opcjonalne dla przyszłych feature'ów (np. React hooks)

---

### FAZA 2: Przepisanie React Forms (30 min)

#### 2.1 Aktualizacja LoginForm

**Plik:** `src/components/auth/LoginForm.tsx` 🔧 AKTUALIZACJA

**Zmiany:**

**USUŃ:**
```typescript
import { createBrowserClient } from '@supabase/ssr';
// ... old Supabase client logic
```

**DODAJ:**
```typescript
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  setError(null);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || 'Wystąpił błąd podczas logowania');
      setIsLoading(false);
      return;
    }

    // Success - redirect
    const redirectUrl = new URLSearchParams(window.location.search).get('redirectTo') || '/';
    window.location.href = redirectUrl;

  } catch (error) {
    setError('Brak połączenia z internetem');
    setIsLoading(false);
  }
};
```

**ZACHOWAJ:**
- ✅ Całą strukturę komponentu
- ✅ Walidację Zod z `loginSchema`
- ✅ Error states i komunikaty
- ✅ Loading states
- ✅ Linki do reset-password i register
- ✅ Accessibility attributes (aria-invalid, aria-describedby)

**Testowanie:**
- [ ] Poprawne dane → redirect do `/` lub `redirectTo`
- [ ] Błędne hasło → Error: "Nieprawidłowy email lub hasło"
- [ ] Email nie istnieje → Error: "Nieprawidłowy email lub hasło"
- [ ] Walidacja client-side → Zod errors inline

---

#### 2.2 Aktualizacja RegisterForm

**Plik:** `src/components/auth/RegisterForm.tsx` 🔧 AKTUALIZACJA

**Zmiany:**

**USUŃ:**
```typescript
import { createBrowserClient } from '@supabase/ssr';
// ... old client logic
```

**DODAJ:**
```typescript
const onSubmit = async (data: RegisterFormData) => {
  setIsLoading(true);
  setError(null);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || 'Wystąpił błąd podczas rejestracji');
      setIsLoading(false);
      return;
    }

    // Check if email confirmation is required
    if (result.requiresEmailConfirmation) {
      toast.info('Sprawdź swoją skrzynkę email i potwierdź adres.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      // Auto-confirmed - redirect to FTUE (US-027)
      toast.success('Konto utworzone pomyślnie!');
      window.location.href = '/generate';
    }

  } catch (error) {
    setError('Brak połączenia z internetem');
    setIsLoading(false);
  }
};
```

**ZACHOWAJ:**
- ✅ Toast notifications (sonner)
- ✅ Walidację Zod z `registerSchema`
- ✅ Password confirmation logic
- ✅ Error handling
- ✅ FTUE redirect do `/generate` (US-027)

**Testowanie:**
- [ ] Email confirmation ON → Toast + redirect do `/login`
- [ ] Email confirmation OFF → Toast + redirect do `/generate`
- [ ] Email już istnieje → Error: "Email już zarejestrowany"
- [ ] Hasła nie pasują → Zod validation error

---

#### 2.3 Pozostałe komponenty auth

**Pliki BEZ ZMIAN:**
- ✅ `src/components/auth/ResetPasswordForm.tsx`
- ✅ `src/components/auth/NewPasswordForm.tsx`
- ✅ `src/components/auth/EmailConfirmation.tsx`

**Uzasadnienie:**
Te komponenty muszą używać `createBrowserClient` bo:
- Reset password używa token URL z email link
- Token jest przetwarzany przez Supabase Auth client-side
- Zmiana na API endpoint wymagałaby proxy tokenu (niepotrzebna złożoność)

---

### FAZA 3: UserMenu Component (20 min)

#### 3.1 Utworzenie UserMenu

**Plik:** `src/components/navigation/UserMenu.tsx` ✨ NOWY

**Funkcjonalność:**
- Dropdown menu używając Radix UI DropdownMenu
- Avatar z inicjałami użytkownika (np. "RK" dla robert.kowalski@example.com)
- Wyświetla email użytkownika
- Link do profilu (disabled, placeholder na przyszłość)
- Przycisk "Wyloguj" - client-side logout

**Props interface:**
```typescript
interface UserMenuProps {
  userEmail: string;
}
```

**Struktura UI:**
```
┌─────────────────────┐
│ [RK ▼]              │ ← Trigger (Avatar)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ robert@example.com  │ ← Email header
├─────────────────────┤
│ 👤 Profil           │ ← Disabled (coming soon)
│ 🚪 Wyloguj          │ ← Logout action
└─────────────────────┘
```

**Technologie:**
- `@radix-ui/react-dropdown-menu` (już zainstalowane przez shadcn)
- `createBrowserClient` z `@supabase/ssr`
- Tailwind CSS dla stylowania
- `cn()` utility z `@/lib/utils`

**Logout implementation:**
```typescript
const handleLogout = async () => {
  const supabase = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
  }

  // Always redirect (even on error, clear client state)
  window.location.href = '/login';
};
```

**Avatar logic:**
```typescript
const getInitials = (email: string): string => {
  const username = email.split('@')[0];
  const parts = username.split('.');

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase(); // "robert.kowalski" → "RK"
  }

  return username.slice(0, 2).toUpperCase(); // "john" → "JO"
};
```

**Styling:**
- Avatar: Circular, gradient background (primary colors)
- Dropdown: Shadow, rounded corners, white background
- Items: Hover states, icons alignment
- Disabled state dla profilu (opacity 50%, cursor not-allowed)

**Accessibility:**
- aria-label na trigger: "Menu użytkownika"
- Keyboard navigation (Tab, Enter, Escape)
- Focus trap w dropdown

---

### FAZA 4: Header Component (15 min)

#### 4.1 Utworzenie Header

**Plik:** `src/components/navigation/Header.tsx` ✨ NOWY

**Funkcjonalność:**
- Nawigacja dla zalogowanych użytkowników
- Logo "10xCards" (link do `/`)
- Linki: "Dashboard" (`/`), "Generator AI" (`/generate`)
- UserMenu po prawej stronie
- Responsive design (mobile-first)

**Props interface:**
```typescript
interface HeaderProps {
  userEmail: string;
  currentPath?: string; // Opcjonalnie do active state
}
```

**Layout (Desktop):**
```
┌──────────────────────────────────────────────────┐
│ 🎴 10xCards    Dashboard  |  Generator    [RK ▼] │
└──────────────────────────────────────────────────┘
```

**Layout (Mobile):**
```
┌──────────────────────────────────────────────────┐
│ 🎴 10xCards                           [☰] [RK ▼] │
└──────────────────────────────────────────────────┘
```

**Komponenty:**
```typescript
import { UserMenu } from './UserMenu';

export function Header({ userEmail, currentPath }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="text-xl font-bold">
            🎴 10xCards
          </a>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex gap-6">
            <a href="/" className={cn("hover:text-primary", currentPath === '/' && 'text-primary font-semibold')}>
              Dashboard
            </a>
            <a href="/generate" className={cn("hover:text-primary", currentPath === '/generate' && 'text-primary font-semibold')}>
              Generator AI
            </a>
          </nav>

          {/* User Menu */}
          <UserMenu userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
```

**Styling:**
- Height: 64px (h-16)
- Border bottom: 1px solid border-color
- Container: max-width responsive, padding horizontal
- Sticky opcjonalnie (sticky top-0 z-50)

**Mobile considerations:**
- Hamburger menu dla małych ekranów (opcjonalnie dla MVP)
- UserMenu zawsze widoczne
- Navigation collapse w drawer (przyszła iteracja)

---

#### 4.2 Integracja z ProtectedLayout

**Plik:** `src/layouts/ProtectedLayout.astro` 🔧 AKTUALIZACJA

**Zmiany:**

**DODAJ na górze:**
```astro
---
import Header from '@/components/navigation/Header';
import Layout from './Layout.astro';

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/login?redirectTo=' + Astro.url.pathname);
}

const currentPath = Astro.url.pathname;
---
```

**DODAJ w body:**
```astro
<Layout title={title}>
  <Header userEmail={user.email} currentPath={currentPath} client:load />

  <main class="container mx-auto px-4 py-8">
    <slot />
  </main>
</Layout>
```

**ZACHOWAJ:**
- ✅ Sprawdzenie `Astro.locals.user`
- ✅ Redirect do `/login` jeśli brak auth
- ✅ Toaster dla notifications

**Testowanie:**
- [ ] Header pojawia się na wszystkich protected pages
- [ ] Logo link do `/` działa
- [ ] Navigation links działają
- [ ] UserMenu wyświetla poprawny email
- [ ] Active state na aktualnej stronie

---

### FAZA 5: Aktualizacja Middleware (10 min)

#### 5.1 Refactor middleware

**Plik:** `src/middleware/index.ts` 🔧 AKTUALIZACJA

**Zmiany:**

**USUŃ:**
```typescript
// Duplikowany kod tworzenia Supabase client
const supabase = createServerClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY,
  {
    cookies: {
      getAll() { ... },
      setAll() { ... }
    }
  }
);
```

**DODAJ:**
```typescript
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Public paths
    const PUBLIC_PATHS = [
      '/login',
      '/register',
      '/reset-password',
      '/auth/confirm',
      '/auth/reset',
    ];

    // Skip API routes
    if (url.pathname.startsWith('/api/')) {
      return next();
    }

    // Create Supabase client using helper
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers
    });

    // Get user session
    const { data: { user } } = await supabase.auth.getUser();

    // Set locals
    if (user) {
      locals.user = {
        email: user.email!,
        id: user.id,
      };
      locals.supabase = supabase;
    }

    // Redirect authenticated users away from auth pages
    if (user && PUBLIC_PATHS.includes(url.pathname)) {
      return redirect('/');
    }

    // Protect non-public routes
    if (!user && !PUBLIC_PATHS.includes(url.pathname)) {
      return redirect('/login?redirectTo=' + encodeURIComponent(url.pathname));
    }

    return next();
  }
);
```

**ZACHOWAJ:**
- ✅ Logikę route protection
- ✅ PUBLIC_PATHS array
- ✅ Redirect logic z `redirectTo`
- ✅ Setting `locals.user` i `locals.supabase`

**Uwaga:**
Token refresh jest automatyczny w `@supabase/ssr` - `getUser()` automatycznie odświeża expired tokeny.

---

### FAZA 6: Testowanie End-to-End (30 min)

#### 6.1 Checklist User Stories

**US-001: Rejestracja nowego użytkownika**
- [ ] Formularz zawiera: email, password, confirmPassword
- [ ] Walidacja email format (Zod)
- [ ] Walidacja hasła (min 6 znaków)
- [ ] Sprawdzenie confirmPassword === password
- [ ] Email zajęty → Error: "Email już zarejestrowany" (409)
- [ ] Email confirmation ON → Toast + redirect `/login`
- [ ] Email confirmation OFF → Toast + redirect `/generate` (FTUE)

**US-002: Logowanie użytkownika**
- [ ] Formularz zawiera: email, password
- [ ] Poprawne dane → Redirect do `/` (dashboard)
- [ ] Redirect z `?redirectTo=/study` → Po login redirect do `/study`
- [ ] Błędne dane → Error: "Nieprawidłowy email lub hasło" (401)
- [ ] Email niepotwierdzony → Informacja o weryfikacji

**US-003: Wylogowanie użytkownika**
- [ ] Przycisk "Wyloguj" w UserMenu
- [ ] Kliknięcie → Sesja zakończona
- [ ] Redirect do `/login`
- [ ] Ponowne wejście na protected page → Redirect do `/login`

**US-004: Inicjowanie resetowania hasła**
- [ ] Link "Zapomniałem hasła" na `/login`
- [ ] Redirect do `/reset-password`
- [ ] Formularz z polem email
- [ ] Wysłanie → Email z linkiem (jeśli email istnieje)
- [ ] Komunikat: "Sprawdź email" (zawsze, security)

**US-005: Wykonanie resetowania hasła**
- [ ] Link z emaila → Redirect do `/auth/reset?token=...`
- [ ] Formularz: password, confirmPassword
- [ ] Walidacja: min 8 znaków, passwords match
- [ ] Zapisanie → Success message
- [ ] Redirect do `/login` z komunikatem sukcesu

**US-027: FTUE (First Time User Experience)**
- [ ] Nowy użytkownik (auto-confirm ON) → Redirect do `/generate`
- [ ] Widzi nawigację Header z logo i linkami
- [ ] UserMenu z emailem
- [ ] Może od razu wygenerować fiszki

---

#### 6.2 Checklist Error Handling

**Login errors:**
- [ ] Błędne hasło → "Nieprawidłowy email lub hasło"
- [ ] Email nie istnieje → "Nieprawidłowy email lub hasło"
- [ ] Rate limiting (>5 prób) → "Zbyt wiele prób, spróbuj później" (429)
- [ ] Brak internetu → "Brak połączenia z internetem"
- [ ] Server error → "Błąd serwera, spróbuj ponownie" (500)

**Register errors:**
- [ ] Email zajęty → "Email już zarejestrowany" (409)
- [ ] Walidacja password < 6 → Inline error
- [ ] Passwords don't match → Inline error
- [ ] Invalid email format → Inline error

**Reset password errors:**
- [ ] Link wygasły (>60 min) → "Link wygasł, poproś o nowy"
- [ ] Invalid token → "Nieprawidłowy link"
- [ ] Password < 8 chars → Inline error

---

#### 6.3 Manual Testing Flow

**Test 1: Pełny flow nowego użytkownika**
1. Open `/register`
2. Fill form: `test@example.com`, `password123`
3. Submit → Check toast
4. If confirmation required: Check email → Click link → `/auth/confirm` → `/login`
5. If auto-confirm: Redirect to `/generate`
6. Check Header visible
7. Check UserMenu shows correct email
8. Click "Generator AI" → Navigate to `/generate`
9. Click Logo → Navigate to `/`
10. Click "Wyloguj" → Redirect to `/login`
11. Try accessing `/generate` → Redirect to `/login?redirectTo=/generate`

**Test 2: Password reset flow**
1. Go to `/login`
2. Click "Zapomniałem hasła"
3. Enter email → Submit
4. Check toast "Sprawdź email"
5. Open email → Click link
6. Enter new password → Submit
7. Success message → Redirect to `/login`
8. Login with new password → Success

**Test 3: Protected routes**
1. Logout (clear session)
2. Try accessing `/` → Redirect to `/login`
3. Try accessing `/generate` → Redirect to `/login?redirectTo=/generate`
4. Login → Redirect to `/generate` (from redirectTo)
5. Access `/dashboard` (protected) → Should work

---

### FAZA 7: Environment & Security (15 min)

#### 7.1 Aktualizacja .env.example

**Plik:** `.env.example` 🔧 AKTUALIZACJA

**Dodaj (jeśli nie ma):**
```bash
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Public env vars (accessible in browser)
# These are needed for client-side Supabase operations (logout, password reset)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenRouter API (for AI flashcard generation)
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Notatki:**
- `PUBLIC_*` zmienne są wymagane dla client-side operations (UserMenu logout, ResetPasswordForm, etc.)
- Anon key jest bezpieczny do eksponowania (RLS policies chronią dane)
- Nigdy nie dodawaj `.env` do git (już w `.gitignore`)

---

#### 7.2 Weryfikacja src/env.d.ts

**Plik:** `src/env.d.ts` ✅ SPRAWDZENIE

**Powinno zawierać:**
```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user:
      | {
          id: string;
          email: string;
        }
      | undefined;
  }
}
```

**Jeśli brakuje któregoś type, dodaj.**

---

#### 7.3 Security Checklist

**Cookie Security:**
- [x] httpOnly: true (zarządzane przez Supabase SSR)
- [x] secure: true (tylko HTTPS w production)
- [x] sameSite: 'lax' (CSRF protection)

**Error Messages:**
- [x] Nie ujawniaj czy email istnieje (login/register)
- [x] Generic error dla failed login: "Nieprawidłowy email lub hasło"
- [x] Password reset zawsze: "Sprawdź email" (niezależnie czy email istnieje)

**Rate Limiting:**
- [x] Supabase built-in: 5 attempts/minute (wystarczające dla MVP)
- [ ] Custom rate limiting (opcjonalne, post-MVP)

**Input Validation:**
- [x] Server-side validation w API routes (Zod schemas)
- [x] Client-side validation w forms (React Hook Form + Zod)
- [x] SQL injection protection (Supabase automatic via parameterized queries)

**Future enhancements (post-MVP):**
- [ ] CSP headers w middleware
- [ ] Sentry error monitoring
- [ ] Custom rate limiting middleware
- [ ] 2FA (Two-Factor Authentication)

---

## 📁 Podsumowanie plików

### ✨ Pliki do UTWORZENIA (6)

| # | Ścieżka | Typ | Faza | Opis |
|---|---------|-----|------|------|
| 1 | `src/lib/supabase-server.ts` | Helper | 1 | Ujednolicony Supabase SSR client |
| 2 | `src/pages/api/auth/login.ts` | API | 1 | POST endpoint - login |
| 3 | `src/pages/api/auth/register.ts` | API | 1 | POST endpoint - rejestracja |
| 4 | `src/pages/api/auth/session.ts` | API | 1 | GET endpoint - status sesji (opcjonalny) |
| 5 | `src/components/navigation/UserMenu.tsx` | Component | 3 | Dropdown menu z logout |
| 6 | `src/components/navigation/Header.tsx` | Component | 4 | Nawigacja dla zalogowanych |

### 🔧 Pliki do AKTUALIZACJI (4)

| # | Ścieżka | Typ | Faza | Zmiany |
|---|---------|-----|------|--------|
| 1 | `src/components/auth/LoginForm.tsx` | Component | 2 | Fetch API zamiast createBrowserClient |
| 2 | `src/components/auth/RegisterForm.tsx` | Component | 2 | Fetch API zamiast createBrowserClient |
| 3 | `src/middleware/index.ts` | Middleware | 5 | Użycie createSupabaseServerClient helper |
| 4 | `src/layouts/ProtectedLayout.astro` | Layout | 4 | Dodanie Header component |

### ✅ Pliki BEZ ZMIAN (8)

| # | Ścieżka | Typ | Powód |
|---|---------|-----|-------|
| 1 | `src/components/auth/ResetPasswordForm.tsx` | Component | Client-side token handling |
| 2 | `src/components/auth/NewPasswordForm.tsx` | Component | Client-side token handling |
| 3 | `src/components/auth/EmailConfirmation.tsx` | Component | Client-side verification |
| 4 | `src/pages/login.astro` | Page | Tylko wymiana komponentu wewnątrz |
| 5 | `src/pages/register.astro` | Page | Tylko wymiana komponentu wewnątrz |
| 6 | `src/pages/reset-password.astro` | Page | Działa poprawnie |
| 7 | `src/schemas/auth.schema.ts` | Schema | Wszystkie schematy gotowe |
| 8 | `src/layouts/PublicLayout.astro` | Layout | Działa poprawnie |

---

## ⏱️ Szacowany czas implementacji

| Faza | Czas | Opis |
|------|------|------|
| **Faza 1** | 45 min | Backend API endpoints + helper |
| **Faza 2** | 30 min | Przepisanie LoginForm + RegisterForm |
| **Faza 3** | 20 min | UserMenu component |
| **Faza 4** | 15 min | Header + integracja z ProtectedLayout |
| **Faza 5** | 10 min | Refactor middleware |
| **Faza 6** | 30 min | Testowanie end-to-end |
| **Faza 7** | 15 min | Environment & security check |
| **TOTAL** | **~2.5h** | Pełna implementacja + testy |

---

## 🎯 Kryteria ukończenia

### Definicja "Done"

Projekt jest ukończony gdy:

- [ ] Wszystkie 6 nowych plików zostało utworzonych i działa
- [ ] Wszystkie 4 aktualizacje plików zostały wprowadzone
- [ ] Wszystkie User Stories (US-001 do US-005, US-027) działają poprawnie
- [ ] Error handling dla wszystkich przypadków edge case
- [ ] Header i UserMenu wyświetlają się na protected pages
- [ ] Logout funkcjonuje poprawnie (client-side)
- [ ] Token refresh działa automatycznie (Supabase SSR)
- [ ] `.env.example` zaktualizowany z PUBLIC_* zmiennymi
- [ ] Manual testing checklist: 100% pass rate
- [ ] Dev server działa bez błędów TypeScript
- [ ] Build production (`npm run build`) przechodzi bez błędów

---

## 📝 Notatki implementacyjne

### Uwagi techniczne

1. **Supabase SSR Auto-refresh:**
   - `@supabase/ssr` automatycznie odświeża tokeny przy każdym `getUser()`
   - Nie trzeba jawnego `refreshSession()` w middleware
   - Token expiry: 1 godzina (konfigurowalny w Supabase dashboard)

2. **Client vs Server Auth:**
   - Login/Register: Server-side (API endpoints) ← Bezpieczniejsze
   - Password reset: Client-side (token handling) ← Wymóg techniczny
   - Logout: Client-side (prostota) ← Wystarczające dla MVP

3. **Public env vars:**
   - `PUBLIC_*` prefix ekspozycja zmiennych w browser bundle
   - Anon key jest bezpieczny (RLS policies chronią dane)
   - Używane w: UserMenu (logout), ResetPasswordForm, NewPasswordForm, EmailConfirmation

4. **Error handling strategy:**
   - API routes: Try-catch z specific error codes
   - React forms: State management (setError) + inline display
   - Toast dla success messages (sonner)
   - Alert/banner dla critical errors

5. **TypeScript coverage:**
   - Wszystkie API routes: `APIRoute` type z Astro
   - Props interfaces dla React components
   - Zod schemas dla runtime validation + type inference
   - Database types z Supabase codegen

---

## 🔄 Flow diagramy

### Login Flow (po implementacji)

```
User → LoginForm.tsx
  ↓ Submit (email, password)
  ↓ Zod validation
  ↓ fetch('/api/auth/login')
  ↓
API /api/auth/login
  ↓ Parse JSON
  ↓ Validate with loginSchema
  ↓ createSupabaseServerClient()
  ↓ supabase.auth.signInWithPassword()
  ↓ Set cookies (automatic via SSR)
  ↓ Return { user } or { error }
  ↓
LoginForm.tsx
  ↓ Success: window.location.href = redirectTo || '/'
  ↓ Error: setError(message)
  ↓
Protected Page (e.g. /generate)
  ↓
Middleware
  ↓ getUser() → user found
  ↓ Set Astro.locals.user
  ↓ Allow access
  ↓
ProtectedLayout.astro
  ↓ Render Header with UserMenu
  ↓ Render page content
```

### Register Flow (po implementacji)

```
User → RegisterForm.tsx
  ↓ Submit (email, password, confirmPassword)
  ↓ Zod validation
  ↓ fetch('/api/auth/register')
  ↓
API /api/auth/register
  ↓ Parse JSON
  ↓ Validate with registerSchema
  ↓ createSupabaseServerClient()
  ↓ supabase.auth.signUp()
  ↓ Check if session exists (auto-confirm vs email required)
  ↓ Return { user, requiresEmailConfirmation }
  ↓
RegisterForm.tsx
  ↓ If requiresEmailConfirmation: toast + redirect /login
  ↓ If auto-confirm: toast + redirect /generate (FTUE)
```

### Logout Flow (po implementacji)

```
User → Clicks "Wyloguj" in UserMenu
  ↓
UserMenu.tsx handleLogout()
  ↓ createBrowserClient()
  ↓ supabase.auth.signOut()
  ↓ Clear client-side cookies
  ↓ window.location.href = '/login'
  ↓
Middleware (next request)
  ↓ getUser() → user = null
  ↓ Redirect to /login (protected routes)
```

---

## 🚀 Następne kroki (post-implementacja)

### Priorytet P1 (po MVP)
1. **Dashboard page** (`/` lub `/dashboard`)
   - Lista wszystkich talii użytkownika
   - Statystyki (liczba fiszek, progress nauki)
   - Quick actions (nowa talia, start studying)

2. **Generator AI integration**
   - Połączenie z OpenRouter API
   - Frontend dla `/generate`
   - US-014 do US-021 z PRD

3. **Study Mode**
   - Implementacja Spaced Repetition
   - US-022 do US-026 z PRD

### Priorytet P2 (nice to have)
1. **Custom profiles table**
   - Username, full_name, avatar_url
   - Profile edit page
   - RLS policies

2. **Security enhancements**
   - CSP headers
   - Rate limiting middleware
   - Sentry monitoring

3. **UX improvements**
   - Loading skeletons
   - Optimistic UI updates
   - Toast notifications dla wszystkich actions

---

## 📚 Referencje

- **Auth Spec:** `.ai/auth-spec.md`
- **PRD:** `.ai/prd.md` (US-001 do US-005, US-027)
- **Coding Guidelines:** `CLAUDE.md`
- **Supabase Integration:** `.ai/additional/supabase-auth.mdc`
- **Supabase SSR Docs:** https://supabase.com/docs/guides/auth/server-side/creating-a-client
- **Astro Middleware Docs:** https://docs.astro.build/en/guides/middleware/

---

## ✅ Status tracking

**Ostatnia aktualizacja:** 2025-10-26
**Implementacja rozpoczęta:** -
**Implementacja ukończona:** -
**Testy przeszły:** -
**Deployed do produkcji:** -

---

**Notatki:**
- Ten dokument będzie aktualizowany po każdej fazie
- Checklisty zostaną zaznaczone po ukończeniu
- Błędy i edge cases będą dokumentowane w sekcji "Issues"

---

_Dokument wygenerowany przez Claude Code na podstawie auth-spec.md, prd.md, CLAUDE.md i supabase-auth.mdc_
