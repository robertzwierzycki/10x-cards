# Plan implementacji widoku Rejestracji

## 1. Przegląd

Widok Rejestracji jest kluczowym punktem wejścia dla nowych użytkowników aplikacji 10xCards. Jego głównym celem jest umożliwienie szybkiej i bezproblemowej rejestracji konta poprzez formularz z polami email, hasło i potwierdzenie hasła. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany bezpośrednio do Generatora AI (/generate), zgodnie z filozofią First Time User Experience (FTUE), aby natychmiast doświadczyć głównej wartości produktu.

## 2. Routing widoku

- **Ścieżka:** `/register`
- **Plik:** `src/pages/register.astro`
- **Layout:** `PublicLayout` (bez paska nawigacyjnego)
- **Middleware:** Sprawdzenie czy użytkownik jest już zalogowany → przekierowanie do dashboard (/)
- **Przekierowanie po sukcesie:** `/generate` (Generator AI)

## 3. Struktura komponentów

```
RegisterView (register.astro)
└── PublicLayout
    └── RegisterForm (React, client:load)
        ├── Card (shadcn/ui)
        │   ├── CardHeader
        │   │   └── CardTitle ("Załóż konto")
        │   ├── CardContent
        │   │   └── Form (react-hook-form)
        │   │       ├── FormField (email)
        │   │       │   ├── Label
        │   │       │   ├── Input
        │   │       │   └── FormMessage
        │   │       ├── FormField (password)
        │   │       │   ├── Label
        │   │       │   ├── Input
        │   │       │   └── FormMessage
        │   │       └── FormField (confirmPassword)
        │   │           ├── Label
        │   │           ├── Input
        │   │           └── FormMessage
        │   └── CardFooter
        │       ├── Button (submit)
        │       └── Link ("Masz już konto? Zaloguj się")
        └── Toaster (Sonner - notyfikacje)
```

## 4. Szczegóły komponentów

### RegisterView (register.astro)
- **Opis komponentu:** Strona Astro renderowana po stronie serwera, sprawdza sesję użytkownika i osadza komponent React z formularzem
- **Główne elementy:** Import PublicLayout, import RegisterForm, middleware check dla sesji
- **Obsługiwane zdarzenia:** Brak (SSR)
- **Warunki walidacji:** Sprawdzenie czy użytkownik zalogowany (w middleware)
- **Typy:** Brak specyficznych typów
- **Propsy:** Brak

### RegisterForm (RegisterForm.tsx)
- **Opis komponentu:** Główny komponent React obsługujący logikę formularza rejestracji, walidację i komunikację z Supabase Auth
- **Główne elementy:** Card container, Form z react-hook-form, trzy FormField, Button submit, Link do logowania
- **Obsługiwane zdarzenia:**
  - onSubmit - wysłanie formularza do Supabase
  - onChange dla każdego pola - real-time walidacja
  - onBlur dla każdego pola - walidacja przy opuszczeniu pola
- **Warunki walidacji:**
  - Email: wymagany, poprawny format email
  - Hasło: wymagane, minimum 6 znaków
  - Potwierdzenie hasła: wymagane, musi być identyczne z hasłem
- **Typy:** RegisterFormData, ErrorResponseDTO, SupabaseAuthResponse
- **Propsy:** Brak (standalone component)

### FormField (shadcn/ui)
- **Opis komponentu:** Reużywalny komponent pola formularza z etykietą i obsługą błędów
- **Główne elementy:** Label, Input, FormMessage (dla błędów)
- **Obsługiwane zdarzenia:** onChange, onBlur (przekazywane z react-hook-form)
- **Warunki walidacji:** Przekazywane przez control z react-hook-form
- **Typy:** FieldValues, Control, FieldPath (z react-hook-form)
- **Propsy:**
  - control: Control<RegisterFormData>
  - name: "email" | "password" | "confirmPassword"
  - label: string
  - type: "email" | "password" | "text"
  - placeholder?: string

### Button (shadcn/ui)
- **Opis komponentu:** Przycisk submit formularza ze wsparciem dla stanu loading
- **Główne elementy:** Tekst przycisku, opcjonalny Spinner (Loader2 icon)
- **Obsługiwane zdarzenia:** onClick (implicit przez type="submit")
- **Warunki walidacji:** Disabled gdy isLoading lub !formState.isValid
- **Typy:** ButtonProps (z shadcn/ui)
- **Propsy:**
  - type: "submit"
  - disabled: boolean
  - className?: string
  - children: ReactNode

### Toaster (Sonner)
- **Opis komponentu:** System notyfikacji dla komunikatów błędów i sukcesu
- **Główne elementy:** Toast container, pojedyncze toast messages
- **Obsługiwane zdarzenia:** Programatyczne wywołanie toast.error(), toast.success()
- **Warunki walidacji:** Brak
- **Typy:** ToastOptions
- **Propsy:** position, duration, theme (konfigurowane globalnie)

## 5. Typy

### RegisterFormData (nowy typ - ViewModel)
```typescript
interface RegisterFormData {
  email: string;        // Adres email użytkownika
  password: string;     // Hasło (min. 6 znaków)
  confirmPassword: string; // Potwierdzenie hasła (musi być === password)
}
```

**Szczegóły pól:**
- `email`: string - wymagany, musi być poprawnym formatem email (walidacja regex)
- `password`: string - wymagany, minimum 6 znaków długości
- `confirmPassword`: string - wymagany, musi być identyczny z polem password

### RegisterValidationSchema (Zod schema)
```typescript
const registerValidationSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Podaj poprawny adres email"),
  password: z
    .string()
    .min(6, "Hasło musi mieć minimum 6 znaków"),
  confirmPassword: z
    .string()
    .min(1, "Potwierdzenie hasła jest wymagane")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"]
});
```

### ErrorResponseDTO (istniejący w types.ts)
```typescript
interface ErrorResponseDTO {
  error: string;
  details?: unknown[];
  retry_after?: number;
}
```

### SupabaseAuthResponse (z @supabase/supabase-js)
```typescript
interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}
```

## 6. Zarządzanie stanem

Stan jest zarządzany lokalnie w komponencie RegisterForm przy użyciu React hooks. Nie jest wymagany custom hook ani globalny store.

### Stany lokalne (useState):
- `isLoading: boolean` - wskazuje czy formularz jest w trakcie wysyłania (domyślnie: false)
  - Ustawiany na true przy rozpoczęciu submit
  - Ustawiany na false po otrzymaniu odpowiedzi (sukces lub błąd)
  - Wpływa na: disabled state przycisku, pokazywanie spinnera

### Stan formularza (react-hook-form):
- `formState.errors` - obiekt zawierający błędy walidacji dla każdego pola
- `formState.isValid` - boolean wskazujący czy cały formularz jest poprawny
- `formState.isDirty` - boolean wskazujący czy użytkownik zmodyfikował formularz
- `formState.touchedFields` - obiekt śledzący które pola były "touched"

### Brak potrzeby custom hooka
Logika rejestracji jest prosta, jednokierunkowa i nie będzie reużywana w innych komponentach, więc custom hook byłby nadmiarowy.

## 7. Integracja API

### Endpoint: Supabase Auth SDK (client-side)

**Metoda:** `supabase.auth.signUp()`

**Typ żądania:**
```typescript
interface SignUpRequest {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string; // URL dla potwierdzenia email
    data?: object; // Dodatkowe metadata użytkownika
  };
}
```

**Przykład wywołania:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`
  }
});
```

**Typ odpowiedzi:**
```typescript
interface SignUpResponse {
  data: {
    user: User | null;      // Obiekt użytkownika
    session: Session | null; // Sesja (null jeśli wymaga potwierdzenia email)
  };
  error: AuthError | null;   // Błąd jeśli wystąpił
}
```

**Scenariusze odpowiedzi:**
1. **Sukces z auto-confirm:** user !== null, session !== null → redirect do /generate
2. **Sukces z email verification:** user !== null, session === null → komunikat o sprawdzeniu email
3. **Błąd - email zajęty:** error.message zawiera "already registered"
4. **Błąd serwera:** error z innym komunikatem

## 8. Interakcje użytkownika

### Wypełnianie formularza
- **Akcja:** Użytkownik wpisuje dane w pola email, hasło, potwierdzenie hasła
- **Rezultat:** Real-time walidacja na blur, komunikaty błędów pod polami

### Próba wysłania niepoprawnego formularza
- **Akcja:** Kliknięcie "Zarejestruj się" z błędami walidacji
- **Rezultat:** Wyświetlenie wszystkich błędów, focus na pierwszym błędnym polu, brak wywołania API

### Pomyślne wysłanie formularza
- **Akcja:** Kliknięcie "Zarejestruj się" z poprawnymi danymi
- **Rezultat:**
  - Przycisk zmienia się na loading (spinner + "Rejestrowanie...")
  - Wywołanie supabase.auth.signUp()
  - Przy sukcesie: redirect do /generate
  - Przy błędzie: toast z komunikatem błędu

### Kliknięcie linku do logowania
- **Akcja:** Kliknięcie "Masz już konto? Zaloguj się"
- **Rezultat:** Nawigacja do /login

### Obsługa błędu duplikatu email
- **Akcja:** Rejestracja z już istniejącym emailem
- **Rezultat:** Toast error "Ten adres email jest już zarejestrowany"

## 9. Warunki i walidacja

### Walidacja po stronie klienta (Zod + React Hook Form)

#### Email
- **Warunek:** Pole wymagane (nie może być puste)
- **Warunek:** Musi być poprawnym formatem email
- **Kiedy sprawdzane:** onBlur, onChange (debounced), onSubmit
- **Komunikat błędu:** "Email jest wymagany" lub "Podaj poprawny adres email"
- **Wpływ na UI:** Czerwona obwódka pola, komunikat pod polem, przycisk submit disabled

#### Hasło
- **Warunek:** Pole wymagane
- **Warunek:** Minimum 6 znaków
- **Kiedy sprawdzane:** onBlur, onChange (debounced), onSubmit
- **Komunikat błędu:** "Hasło musi mieć minimum 6 znaków"
- **Wpływ na UI:** Czerwona obwódka, komunikat pod polem, przycisk submit disabled

#### Potwierdzenie hasła
- **Warunek:** Pole wymagane
- **Warunek:** Musi być identyczne z hasłem
- **Kiedy sprawdzane:** onBlur, onChange, przy zmianie pola hasło
- **Komunikat błędu:** "Hasła muszą być identyczne"
- **Wpływ na UI:** Czerwona obwódka, komunikat pod polem, przycisk submit disabled

### Walidacja po stronie serwera (Supabase)

#### Unikalność email
- **Sprawdzane przez:** Supabase Auth przy signUp
- **Komunikat błędu:** "Ten adres email jest już zarejestrowany"
- **Wpływ na UI:** Toast error, formularz pozostaje aktywny

## 10. Obsługa błędów

### Błędy walidacji formularza
- **Scenariusz:** Niepoprawne dane w formularzu
- **Obsługa:** Inline komunikaty pod polami (FormMessage), przycisk submit pozostaje disabled
- **Prezentacja:** Czerwone obwódki pól, czerwone komunikaty błędów

### Email już zarejestrowany
- **Scenariusz:** Użytkownik próbuje zarejestrować się z istniejącym emailem
- **Obsługa:** Catch error z Supabase, sprawdzenie message
- **Prezentacja:** Toast.error("Ten adres email jest już zarejestrowany")

### Błąd połączenia sieciowego
- **Scenariusz:** Brak internetu lub Supabase niedostępny
- **Obsługa:** Try/catch block, generic error handling
- **Prezentacja:** Toast.error("Błąd połączenia. Spróbuj ponownie.")

### Błąd serwera
- **Scenariusz:** 500 error z Supabase
- **Obsługa:** Error w response z Supabase
- **Prezentacja:** Toast.error("Wystąpił błąd. Spróbuj ponownie później.")

### Email verification required
- **Scenariusz:** Supabase wymaga potwierdzenia email
- **Obsługa:** Sprawdzenie czy session === null mimo user !== null
- **Prezentacja:** Toast.info("Sprawdź swoją skrzynkę email i potwierdź rejestrację")

## 11. Kroki implementacji

### 1. Przygotowanie struktury
- Utworzenie `src/pages/register.astro`
- Utworzenie `src/components/auth/RegisterForm.tsx`
- Instalacja wymaganych komponentów shadcn/ui (Card, Button, Input, Form)
- Instalacja Sonner dla toast notifications

### 2. Implementacja schematu walidacji Zod
```typescript
// src/schemas/auth.schema.ts
import { z } from "zod";

export const registerValidationSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Podaj poprawny adres email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
  confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"]
});
```

### 3. Implementacja strony Astro
```astro
---
// src/pages/register.astro
import PublicLayout from "@/layouts/PublicLayout.astro";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Sprawdzenie czy użytkownik jest zalogowany
const session = Astro.locals.session;
if (session) {
  return Astro.redirect("/");
}
---

<PublicLayout title="Rejestracja - 10xCards">
  <div class="container max-w-md mx-auto py-16">
    <RegisterForm client:load />
  </div>
</PublicLayout>
```

### 4. Implementacja komponentu RegisterForm
- Setup react-hook-form z zodResolver
- Implementacja handleSubmit z wywołaniem supabase.auth.signUp()
- Obsługa różnych scenariuszy odpowiedzi
- Implementacja UI z komponentami shadcn

### 5. Implementacja obsługi błędów
- Try/catch dla wywołania API
- Mapowanie komunikatów błędów na user-friendly wersje
- Toast notifications dla błędów globalnych

### 6. Stylizacja i dostępność
- Dodanie odpowiednich klas Tailwind
- Upewnienie się że wszystkie pola mają labels
- Dodanie aria-labels gdzie potrzebne
- Testowanie keyboard navigation

### 7. Testowanie
- Test walidacji formularza (puste pola, niepoprawny email, krótkie hasło)
- Test zgodności haseł
- Test rejestracji z nowym emailem
- Test błędu duplikatu email
- Test przekierowania po sukcesie
- Test linku do logowania

### 8. Integracja z middleware
- Upewnienie się że middleware poprawnie sprawdza sesję
- Testowanie przekierowania dla zalogowanych użytkowników

### 9. Konfiguracja Supabase
- Sprawdzenie ustawień email verification w Supabase dashboard
- Konfiguracja email templates jeśli potrzebne
- Testowanie flow z potwierdzeniem email

### 10. Code review i optymalizacja
- Sprawdzenie TypeScript types
- ESLint i Prettier
- Sprawdzenie wydajności (bundle size)
- Dokumentacja kodu gdzie potrzebna