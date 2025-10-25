# API Endpoint Implementation Plan: Profile Resource

## GET /api/profile

### 1. Przegląd punktu końcowego
Endpoint służący do pobierania profilu aktualnie zalogowanego użytkownika. Łączy dane z tabeli `profiles` z emailem użytkownika z Supabase Auth.

### 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/profile`
- **Parametry**: Brak
- **Nagłówki**:
  - `Authorization: Bearer <token>` (wymagany)
- **Request Body**: Brak

### 3. Wykorzystywane typy
```typescript
// Response DTO
interface ProfileDTO {
  id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
  email: string; // Z Supabase Auth
}

// Error Response
interface ErrorResponseDTO {
  error: string;
  details?: unknown[];
}
```

### 4. Szczegóły odpowiedzi
**Sukces (200 OK)**:
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Błędy**:
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 404 Not Found: `{ "error": "Profile not found" }`
- 500 Internal Server Error: `{ "error": "Failed to retrieve profile" }`

### 5. Przepływ danych
1. Middleware weryfikuje token JWT i udostępnia `userId` w `context.locals`
2. Endpoint pobiera `userId` z kontekstu
3. ProfileService wykonuje zapytanie do Supabase:
   - JOIN tabeli `profiles` z `auth.users` po `id`
   - Pobiera email z `auth.users`
   - Pobiera pozostałe dane z `profiles`
4. Mapowanie wyniku na ProfileDTO
5. Zwrócenie odpowiedzi JSON

### 6. Względy bezpieczeństwa
- Token JWT weryfikowany przez middleware Supabase
- RLS Policy automatycznie ogranicza dostęp do profilu użytkownika
- Brak możliwości dostępu do profili innych użytkowników
- Email pobierany bezpiecznie z auth.users (nie może być sfałszowany)

### 7. Obsługa błędów
| Scenariusz | Kod | Odpowiedź |
|------------|-----|-----------|
| Brak tokena JWT | 401 | `{ "error": "Authentication required" }` |
| Nieprawidłowy token | 401 | `{ "error": "Authentication required" }` |
| Profil nie istnieje | 404 | `{ "error": "Profile not found" }` |
| Błąd bazy danych | 500 | `{ "error": "Failed to retrieve profile" }` |

### 8. Rozważania dotyczące wydajności
- Zapytanie używa PRIMARY KEY (`id`), więc jest bardzo szybkie
- JOIN z auth.users jest optymalny dzięki indeksom
- Rozważyć cache'owanie profilu w pamięci sesji (opcjonalne dla MVP)

### 9. Etapy wdrożenia
1. Utworzyć plik `/src/pages/api/profile.ts`
2. Dodać `export const prerender = false` dla dynamicznego route'u
3. Zaimplementować ProfileService w `/src/services/profile.service.ts`:
   ```typescript
   class ProfileService {
     async getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO>
   }
   ```
4. Zaimplementować handler GET:
   - Pobrać `userId` z `context.locals.user`
   - Wywołać `ProfileService.getProfile()`
   - Obsłużyć przypadki błędów
   - Zwrócić odpowiedź JSON z odpowiednim statusem
5. Wykonać zapytanie Supabase:
   ```sql
   SELECT p.*, u.email
   FROM profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE p.id = userId
   ```
6. Przetestować endpoint z różnymi scenariuszami

---

## PUT /api/profile

### 1. Przegląd punktu końcowego
Endpoint służący do aktualizacji profilu użytkownika, obecnie obsługuje tylko zmianę username'a. Sprawdza unikalność username przed zapisem.

### 2. Szczegóły żądania
- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/profile`
- **Parametry**: Brak
- **Nagłówki**:
  - `Authorization: Bearer <token>` (wymagany)
  - `Content-Type: application/json` (wymagany)
- **Request Body**:
  ```json
  {
    "username": "new_username"
  }
  ```

### 3. Wykorzystywane typy
```typescript
// Request Command
interface UpdateProfileCommand {
  username?: string; // 3-50 znaków, alfanumeryczne + podkreślenie
}

// Response DTO
interface ProfileDTO {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  email: string;
}

// Validation Schema
const updateProfileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional()
});
```

### 4. Szczegóły odpowiedzi
**Sukces (200 OK)**:
```json
{
  "id": "uuid",
  "username": "new_username",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

**Błędy**:
- 400 Bad Request: `{ "error": "Validation failed", "details": [...] }`
- 401 Unauthorized: `{ "error": "Authentication required" }`
- 409 Conflict: `{ "error": "Username already taken" }`
- 500 Internal Server Error: `{ "error": "Failed to update profile" }`

### 5. Przepływ danych
1. Middleware weryfikuje token JWT
2. Parsowanie i walidacja body żądania (Zod)
3. Trimowanie username (usunięcie whitespace)
4. ProfileService sprawdza unikalność username:
   ```sql
   SELECT id FROM profiles
   WHERE LOWER(username) = LOWER(?)
   AND id != userId
   ```
5. Jeśli username wolny, wykonanie UPDATE:
   ```sql
   UPDATE profiles
   SET username = ?, updated_at = NOW()
   WHERE id = userId
   ```
6. Pobranie zaktualizowanego profilu (jak w GET)
7. Zwrócenie ProfileDTO

### 6. Względy bezpieczeństwa
- Token JWT weryfikowany przez middleware
- RLS Policy zapewnia, że użytkownik może edytować tylko swój profil
- Walidacja input chroni przed SQL injection (Zod + parametryzowane zapytania)
- Case-insensitive sprawdzenie unikalności username
- Rate limiting powinien być rozważony dla tej operacji

### 7. Obsługa błędów
| Scenariusz | Kod | Odpowiedź |
|------------|-----|-----------|
| Brak tokena JWT | 401 | `{ "error": "Authentication required" }` |
| Nieprawidłowy format username | 400 | `{ "error": "Validation failed", "details": [{"field": "username", "message": "..."}] }` |
| Username za krótki/długi | 400 | `{ "error": "Validation failed", "details": [...] }` |
| Username zawiera niedozwolone znaki | 400 | `{ "error": "Validation failed", "details": [...] }` |
| Username już zajęty | 409 | `{ "error": "Username already taken" }` |
| Błąd bazy danych | 500 | `{ "error": "Failed to update profile" }` |

### 8. Rozważania dotyczące wydajności
- Sprawdzenie unikalności używa indeksu na `username`
- UPDATE używa PRIMARY KEY
- Transakcja nie jest wymagana (pojedyncza operacja)
- Rozważyć dodanie rate limiting (np. 5 zmian/dzień)

### 9. Etapy wdrożenia
1. Rozszerzyć `/src/pages/api/profile.ts` o metodę PUT
2. Utworzyć schemat walidacji Zod:
   ```typescript
   const updateProfileSchema = z.object({
     username: z.string()
       .min(3)
       .max(50)
       .regex(/^[a-zA-Z0-9_]+$/)
       .optional()
   });
   ```
3. Rozszerzyć ProfileService o metodę:
   ```typescript
   async updateProfile(
     supabase: SupabaseClient,
     userId: string,
     command: UpdateProfileCommand
   ): Promise<ProfileDTO>
   ```
4. Zaimplementować handler PUT:
   - Parsować body żądania
   - Walidować używając Zod
   - Trimować username
   - Sprawdzić unikalność username
   - Wykonać UPDATE
   - Pobrać i zwrócić zaktualizowany profil
5. Dodać logikę sprawdzenia unikalności:
   ```typescript
   const { data: existing } = await supabase
     .from('profiles')
     .select('id')
     .ilike('username', username)
     .neq('id', userId)
     .single();

   if (existing) {
     throw new ConflictError('Username already taken');
   }
   ```
6. Obsłużyć wszystkie przypadki błędów z odpowiednimi kodami
7. Przetestować scenariusze:
   - Poprawna aktualizacja
   - Duplikat username
   - Nieprawidłowy format
   - Brak autoryzacji

---

## Wspólne komponenty

### ProfileService Implementation
```typescript
// src/services/profile.service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileDTO, UpdateProfileCommand } from '@/types';

export class ProfileService {
  async getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO> {
    // Pobierz profil z joinowanym emailem
    const { data, error } = await supabase
      .from('profiles')
      .select('*, auth.users!inner(email)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error('Profile not found');
    }

    return {
      id: data.id,
      username: data.username,
      email: data.auth.users.email,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async updateProfile(
    supabase: SupabaseClient,
    userId: string,
    command: UpdateProfileCommand
  ): Promise<ProfileDTO> {
    if (command.username) {
      // Sprawdź unikalność
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', command.username)
        .neq('id', userId)
        .single();

      if (existing) {
        throw new ConflictError('Username already taken');
      }

      // Wykonaj update
      const { error } = await supabase
        .from('profiles')
        .update({ username: command.username })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    }

    // Zwróć zaktualizowany profil
    return this.getProfile(supabase, userId);
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
```

### Middleware Configuration
Middleware powinno być już skonfigurowane zgodnie z CLAUDE.md, ale dla pewności:
- Weryfikacja JWT tokena
- Udostępnienie `userId` w `context.locals.user`
- Udostępnienie klienta Supabase w `context.locals.supabase`

### Error Response Format
Wszystkie błędy powinny zwracać spójny format:
```typescript
{
  error: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
}
```