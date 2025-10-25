# Plan implementacji widoku logowania

## 1. Przegląd
Widok logowania umożliwia zarejestrowanym użytkownikom zalogowanie się do aplikacji 10xCards przy użyciu adresu e-mail i hasła. Po pomyślnym zalogowaniu użytkownik jest przekierowywany do głównego dashboardu z listą talii. Widok obsługuje walidację formularza po stronie klienta, komunikaty błędów oraz linki do rejestracji i resetowania hasła.

## 2. Routing widoku
- **Ścieżka główna:** `/login`
- **Plik:** `src/pages/login.astro`
- **Layout:** PublicLayout (bez paska nawigacyjnego)
- **Dostępność:** Tylko dla niezalogowanych użytkowników (middleware przekierowuje zalogowanych do `/`)

## 3. Struktura komponentów

```
login.astro (Strona Astro)
└── PublicLayout.astro
    └── LoginForm.tsx (React Island)
        ├── Card (shadcn/ui)
        │   ├── CardHeader
        │   │   └── CardTitle ("Zaloguj się")
        │   └── CardContent
        │       ├── Form (React Hook Form wrapper)
        │       │   ├── EmailField
        │       │   ├── PasswordField
        │       │   └── SubmitButton
        │       ├── ErrorMessage (conditional)
        │       └── FooterLinks
        │           ├── Link to /reset-password
        │           └── Link to /register
        └── Toast (Sonner dla komunikatów)
```

## 4. Szczegóły komponentów

### LoginForm
- **Opis komponentu:** Główny komponent formularza logowania zarządzający całym procesem uwierzytelniania
- **Główne elementy:**
  - Card container z shadcn/ui
  - Formularz z polami email i password
  - Przyciski akcji i linki nawigacyjne
- **Obsługiwane interakcje:**
  - Submit formularza (Enter lub kliknięcie przycisku)
  - Nawigacja do rejestracji/resetu hasła
- **Obsługiwana walidacja:**
  - Email: format e-mail (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Hasło: minimum 1 znak, maksimum 255 znaków
  - Walidacja wykonywana przed submittem
- **Typy:**
  - `LoginFormData` (input)
  - `LoginFormProps` (props)
  - `AuthError` (błędy Supabase)
- **Propsy:**
  - `redirectTo?: string` - opcjonalna ścieżka przekierowania po logowaniu

### EmailField
- **Opis komponentu:** Pole formularza dla adresu e-mail z etykietą i obsługą błędów
- **Główne elementy:**
  - Label z tekstem "E-mail"
  - Input typu "email" z autoComplete="email"
  - FormMessage dla błędów walidacji
- **Obsługiwane interakcje:**
  - onChange - walidacja on blur
  - onBlur - pokazanie błędów
  - autoFocus na mount
- **Obsługiwana walidacja:**
  - Wymagane pole
  - Poprawny format e-mail
  - Maksymalna długość: 255 znaków
- **Typy:**
  - `FieldError` z React Hook Form
- **Propsy:**
  - `register` - funkcja rejestracji z React Hook Form
  - `error?: FieldError` - błąd walidacji

### PasswordField
- **Opis komponentu:** Pole formularza dla hasła z etykietą i obsługą błędów
- **Główne elementy:**
  - Label z tekstem "Hasło"
  - Input typu "password" z autoComplete="current-password"
  - FormMessage dla błędów walidacji
- **Obsługiwane interakcje:**
  - onChange - walidacja on blur
  - onBlur - pokazanie błędów
  - Submit na Enter
- **Obsługiwana walidacja:**
  - Wymagane pole
  - Minimum 1 znak
  - Maksimum 255 znaków
- **Typy:**
  - `FieldError` z React Hook Form
- **Propsy:**
  - `register` - funkcja rejestracji z React Hook Form
  - `error?: FieldError` - błąd walidacji

### SubmitButton
- **Opis komponentu:** Przycisk submit z obsługą stanów ładowania
- **Główne elementy:**
  - Button z wariantem "default"
  - Spinner icon (gdy isLoading)
  - Tekst "Zaloguj się" / "Logowanie..."
- **Obsługiwane interakcje:**
  - onClick (submit formularza)
  - Disabled podczas ładowania
- **Obsługiwana walidacja:** Brak (walidacja na poziomie formularza)
- **Typy:**
  - `SubmitButtonProps`
- **Propsy:**
  - `isLoading: boolean` - stan ładowania
  - `disabled?: boolean` - dodatkowa blokada

### ErrorMessage
- **Opis komponentu:** Alert wyświetlający błędy logowania
- **Główne elementy:**
  - Alert z wariantem "destructive"
  - AlertDescription z komunikatem błędu
  - Icon błędu
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `ErrorMessageProps`
- **Propsy:**
  - `message: string` - treść błędu do wyświetlenia

### FooterLinks
- **Opis komponentu:** Sekcja z linkami do rejestracji i resetu hasła
- **Główne elementy:**
  - Link "Nie masz konta? Zarejestruj się"
  - Link "Zapomniałeś hasła?"
  - Separator między linkami
- **Obsługiwane interakcje:**
  - Kliknięcie w linki (nawigacja client-side)
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

## 5. Typy

```typescript
// Dane formularza logowania
interface LoginFormData {
  email: string;      // Adres e-mail użytkownika
  password: string;   // Hasło użytkownika
}

// Props głównego komponentu formularza
interface LoginFormProps {
  redirectTo?: string;  // Opcjonalna ścieżka przekierowania po logowaniu
}

// Schema walidacji Zod
const loginSchema = z.object({
  email: z.string()
    .min(1, "E-mail jest wymagany")
    .email("Nieprawidłowy format e-mail")
    .max(255, "E-mail jest za długi"),
  password: z.string()
    .min(1, "Hasło jest wymagane")
    .max(255, "Hasło jest za długie")
});

// Typ dla błędu autoryzacji
interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

// Props dla przycisku submit
interface SubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
}

// Props dla komponentu błędu
interface ErrorMessageProps {
  message: string;
}

// Stan formularza
interface LoginFormState {
  isSubmitting: boolean;
  serverError: string | null;
}
```

## 6. Zarządzanie stanem

### React Hook Form
Główne zarządzanie formularzem przez React Hook Form z integracją Zod:
```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  setError
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: '',
    password: ''
  }
});
```

### Stan lokalny (useState)
- `serverError: string | null` - błąd z serwera Supabase
- `isRedirecting: boolean` - flaga podczas przekierowania

### Zustand (opcjonalnie)
Jeśli potrzebny globalny stan użytkownika:
```typescript
interface AuthStore {
  user: User | null;
  session: Session | null;
  setAuth: (user: User | null, session: Session | null) => void;
}
```

### Custom Hook: useLogin
```typescript
function useLogin(redirectTo?: string) {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useNavigate();

  const login = async (data: LoginFormData) => {
    setServerError(null);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error) {
      setServerError("Nieprawidłowy e-mail lub hasło");
      return;
    }

    router(redirectTo || '/');
  };

  return { login, serverError };
}
```

## 7. Integracja API

### Supabase Auth SDK
Wykorzystanie metody `signInWithPassword`:

**Request:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: string,    // z formularza
  password: string  // z formularza
});
```

**Response Success:**
```typescript
{
  data: {
    user: User,
    session: {
      access_token: string,
      refresh_token: string,
      expires_in: number,
      expires_at: number,
      token_type: string
    }
  },
  error: null
}
```

**Response Error:**
```typescript
{
  data: { user: null, session: null },
  error: {
    message: string,  // "Invalid login credentials"
    status: number,   // 400
    code: string      // "invalid_credentials"
  }
}
```

### Obsługa sesji
Po pomyślnym logowaniu, Supabase automatycznie:
- Zapisuje tokeny w localStorage/cookies
- Zarządza odświeżaniem tokenów
- Udostępnia sesję przez `supabase.auth.getSession()`

## 8. Interakcje użytkownika

1. **Wpisanie adresu e-mail**
   - Trigger: onChange/onBlur na input
   - Akcja: Walidacja formatu e-mail
   - Feedback: Błąd pod polem jeśli niepoprawny

2. **Wpisanie hasła**
   - Trigger: onChange/onBlur na input
   - Akcja: Walidacja długości
   - Feedback: Błąd pod polem jeśli puste

3. **Kliknięcie "Zaloguj się"**
   - Trigger: onClick lub Enter w formularzu
   - Akcja: Submit formularza, wywołanie Supabase Auth
   - Feedback: Loading spinner, następnie redirect lub błąd

4. **Kliknięcie "Zapomniałeś hasła?"**
   - Trigger: onClick na link
   - Akcja: Nawigacja do `/reset-password`
   - Feedback: Zmiana strony

5. **Kliknięcie "Zarejestruj się"**
   - Trigger: onClick na link
   - Akcja: Nawigacja do `/register`
   - Feedback: Zmiana strony

## 9. Warunki i walidacja

### Walidacja po stronie klienta (przed submittem)
- **E-mail:**
  - Pole wymagane (nie może być puste)
  - Format e-mail (zawiera @ i domenę)
  - Maksimum 255 znaków
  - Wyświetlenie błędu natychmiast po opuszczeniu pola

- **Hasło:**
  - Pole wymagane (minimum 1 znak)
  - Maksimum 255 znaków
  - Wyświetlenie błędu po opuszczeniu pola

### Walidacja po stronie serwera (Supabase)
- Weryfikacja istnienia użytkownika
- Weryfikacja poprawności hasła
- Sprawdzenie statusu konta (aktywne/zablokowane)
- Rate limiting (automatyczny w Supabase)

### Wpływ na stan UI
- **Błąd walidacji:** Czerwone obramowanie pola, komunikat pod polem
- **Submit w trakcie:** Przycisk disabled, loading spinner
- **Błąd serwera:** Alert nad formularzem z komunikatem
- **Sukces:** Przekierowanie do dashboardu

## 10. Obsługa błędów

### Błędy walidacji formularza
```typescript
if (errors.email) {
  // Wyświetl pod polem: errors.email.message
}
```

### Błędy autoryzacji Supabase
```typescript
catch (error) {
  if (error.status === 400) {
    setServerError("Nieprawidłowy e-mail lub hasło");
  } else if (error.status === 429) {
    setServerError("Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.");
  } else if (error.status === 500) {
    setServerError("Błąd serwera. Spróbuj ponownie później.");
  } else if (!navigator.onLine) {
    setServerError("Brak połączenia z internetem");
  } else {
    setServerError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
  }
}
```

### Toast notifications
Wykorzystanie Sonner dla krytycznych błędów:
```typescript
toast.error("Sesja wygasła. Zaloguj się ponownie.");
```

### Accessibility errors
- ARIA live region dla ogłaszania błędów screen readerom
- Focus management - powrót do pierwszego błędnego pola

## 11. Kroki implementacji

1. **Utworzenie strony Astro**
   - Stwórz `src/pages/login.astro`
   - Importuj PublicLayout
   - Dodaj SEO meta tagi

2. **Utworzenie komponentu LoginForm**
   - Stwórz `src/components/auth/LoginForm.tsx`
   - Zainstaluj zależności: `npm install @supabase/supabase-js`
   - Zaimportuj komponenty shadcn/ui

3. **Konfiguracja React Hook Form i Zod**
   - Zdefiniuj schema walidacji
   - Skonfiguruj useForm z zodResolver
   - Dodaj rejestrację pól

4. **Implementacja pól formularza**
   - Stwórz komponenty EmailField i PasswordField
   - Dodaj register i error props
   - Stylizuj z Tailwind CSS

5. **Integracja z Supabase Auth**
   - Zaimportuj klienta Supabase
   - Implementuj funkcję handleSubmit
   - Obsłuż odpowiedzi success/error

6. **Dodanie stanów UI**
   - Loading state dla przycisku
   - Error alert dla błędów serwera
   - Disabled state podczas submitu

7. **Implementacja nawigacji**
   - Dodaj linki do rejestracji i resetu
   - Skonfiguruj przekierowanie po logowaniu
   - Obsłuż query param redirectTo

8. **Testy i walidacja**
   - Przetestuj flow logowania
   - Sprawdź walidację pól
   - Zweryfikuj obsługę błędów
   - Test dostępności (keyboard nav, screen reader)

9. **Optymalizacja**
   - Lazy loading dla React (client:idle)
   - Prefetch dla linked pages
   - Debounce walidacji

10. **Middleware protection**
    - Zaktualizuj middleware w `src/middleware/index.ts`
    - Dodaj logikę przekierowania zalogowanych użytkowników
    - Zabezpiecz przed dostępem do `/login` dla zalogowanych