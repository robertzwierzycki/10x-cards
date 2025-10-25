# Middleware - Authentication & Authorization

## Przegląd

Middleware Astro obsługuje uwierzytelnianie i autoryzację dla wszystkich requestów w aplikacji. Używa Supabase SSR do zarządzania sesjami użytkowników poprzez cookies.

## Funkcjonalności

### 1. Konfiguracja Supabase SSR Client

Middleware tworzy klienta Supabase SSR z obsługą cookies:
- `get(key)` - odczytuje cookie z requestu
- `set(key, value, options)` - ustawia cookie w odpowiedzi
- `remove(key, options)` - usuwa cookie

### 2. Weryfikacja Sesji

Dla każdego requestu:
- Pobiera aktualną sesję z Supabase (`getSession()`)
- Jeśli sesja istnieje, dodaje `user` do `context.locals.user`
- Sesja jest dostępna dla wszystkich stron i API routes poprzez `Astro.locals.user`

### 3. Logika Przekierowań

#### Public Routes (dostępne dla wszystkich)
```typescript
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/reset-password",
  "/reset-password/confirm",
  "/auth/confirm"
];
```

#### Auth Routes (redirect zalogowanych użytkowników)
```typescript
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/reset-password"
];
```

#### Reguły przekierowań:

1. **Zalogowany użytkownik → Auth Route**
   - Redirect do `/` (dashboard)
   - Przykład: Jeśli zalogowany user wejdzie na `/login`, zostanie przekierowany do `/`

2. **Niezalogowany użytkownik → Protected Route**
   - Redirect do `/login?redirectTo=<original-url>`
   - Przykład: Wejście na `/decks/123` → redirect do `/login?redirectTo=%2Fdecks%2F123`
   - Po zalogowaniu użytkownik wraca na oryginalną stronę

3. **API Routes**
   - Nie są chronione przez middleware (prefix `/api/`)
   - API routes powinny samodzielnie weryfikować autoryzację

## Użycie w Aplikacji

### W stronach Astro

```astro
---
// src/pages/protected-page.astro

// Middleware już sprawdził sesję, więc user jest dostępny
const user = Astro.locals.user;

if (!user) {
  // Ten kod nie wykona się dla chronionych stron
  // bo middleware już przekierował do /login
}

// Możesz bezpiecznie używać user
const userName = user.email;
---
```

### W API Routes

```typescript
// src/pages/api/example.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  // Sprawdź czy użytkownik jest zalogowany
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  // Użyj user ID do zapytań
  const userId = locals.user.id;

  // ... reszta logiki
};
```

### W komponentach React

Komponenty React nie mają bezpośredniego dostępu do `Astro.locals`, ale mogą:

1. **Otrzymać user jako prop** (jeśli potrzebują tylko do wyświetlenia):
```astro
---
const user = Astro.locals.user;
---

<MyComponent client:load user={user} />
```

2. **Użyć Supabase Client** (jeśli potrzebują wykonać akcje):
```tsx
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// Pobierz aktualnego użytkownika
const { data: { user } } = await supabase.auth.getUser();
```

## Zmienne Środowiskowe

Wymagane zmienne w `.env`:

```bash
# Server-side (backend, middleware)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key

# Client-side (React components)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Uwaga:** `PUBLIC_*` zmienne są bezpieczne do ekspozycji w przeglądarce, ponieważ są to klucze anonimowe (anon keys).

## Bezpieczeństwo

### Row Level Security (RLS)

Mimo że middleware chroni routes, **zawsze** implementuj RLS policies w Supabase:

```sql
-- Przykład: Użytkownik może czytać tylko swoje talie
CREATE POLICY "Users can read own decks"
ON decks
FOR SELECT
USING (auth.uid() = user_id);
```

### Nie ufaj tylko middleware

- Middleware chroni przed nieautoryzowanym **dostępem do stron**
- API routes muszą **samodzielnie weryfikować** autoryzację
- RLS policies są **ostatnią linią obrony** na poziomie bazy danych

## Testowanie

### Test 1: Redirect niezalogowanego użytkownika
1. Wyloguj się
2. Spróbuj wejść na `/` lub `/decks/123`
3. Powinno przekierować do `/login?redirectTo=...`

### Test 2: Redirect zalogowanego użytkownika z /login
1. Zaloguj się
2. Spróbuj wejść na `/login`
3. Powinno przekierować do `/`

### Test 3: Persistencja redirectTo
1. Wyloguj się
2. Wejdź na `/decks/123` (redirect do login)
3. Zaloguj się
4. Powinno wrócić na `/decks/123`

## Troubleshooting

### Problem: Infinite redirect loop
**Przyczyna:** Strona w PUBLIC_ROUTES wymaga autoryzacji w kodzie strony
**Rozwiązanie:** Usuń sprawdzenie autoryzacji ze strony lub usuń ją z PUBLIC_ROUTES

### Problem: User zawsze null
**Przyczyna:** Cookies nie są ustawiane/czytane prawidłowo
**Rozwiązanie:**
- Sprawdź czy używasz HTTPS w production
- Sprawdź ustawienia SameSite w cookies
- Sprawdź czy domena jest poprawna

### Problem: API routes nie wymagają auth
**Przyczyna:** API routes są celowo wyłączone z middleware protection
**Rozwiązanie:** Dodaj sprawdzenie `locals.user` w każdym API route
