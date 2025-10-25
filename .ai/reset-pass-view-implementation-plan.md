# Plan implementacji widoku Reset Password

## 1. Przegląd
Widok resetowania hasła umożliwia użytkownikom odzyskanie dostępu do konta poprzez zresetowanie zapomnianego hasła. Składa się z dwóch osobnych stron:
- Strona żądania resetu hasła - gdzie użytkownik podaje swój email
- Strona potwierdzenia resetu - gdzie użytkownik ustawia nowe hasło po kliknięciu w link z emaila

Funkcjonalność ta jest kluczowa dla utrzymania dostępności aplikacji i zapewnienia użytkownikom możliwości odzyskania konta.

## 2. Routing widoku
- **Strona żądania resetu**: `/reset-password`
- **Strona potwierdzenia resetu**: `/reset-password/confirm`

Obie strony są publicznie dostępne (nie wymagają autoryzacji) i powinny przekierowywać zalogowanych użytkowników na dashboard.

## 3. Struktura komponentów

```
/reset-password (strona Astro)
├── PublicLayout (layout Astro)
└── ResetPasswordRequestForm (komponent React)
    ├── Card (shadcn/ui)
    ├── Form (react-hook-form)
    ├── FormField
    │   ├── Label
    │   ├── Input
    │   └── FormMessage
    ├── Button
    └── Alert (komunikaty sukcesu/błędu)

/reset-password/confirm (strona Astro)
├── PublicLayout (layout Astro)
└── ResetPasswordConfirmForm (komponent React)
    ├── Card (shadcn/ui)
    ├── Form (react-hook-form)
    ├── FormField (nowe hasło)
    │   ├── Label
    │   ├── PasswordInput (custom)
    │   └── FormMessage
    ├── FormField (potwierdzenie hasła)
    │   ├── Label
    │   ├── PasswordInput (custom)
    │   └── FormMessage
    ├── Button
    └── Alert (komunikaty sukcesu/błędu)
```

## 4. Szczegóły komponentów

### ResetPasswordRequestForm
- **Opis komponentu**: Formularz żądania resetu hasła, który pozwala użytkownikowi wprowadzić email i wysłać żądanie resetu.
- **Główne elementy**:
  - Card z nagłówkiem "Resetuj hasło"
  - Input dla adresu email
  - Przycisk "Wyślij link resetujący"
  - Link powrotny do strony logowania
  - Alert dla komunikatów
- **Obsługiwane interakcje**:
  - Wprowadzenie adresu email
  - Kliknięcie przycisku wysłania
  - Nawigacja do strony logowania
- **Obsługiwana walidacja**:
  - Email wymagany (komunikat: "Adres email jest wymagany")
  - Poprawny format email (regex: /^\S+@\S+\.\S+$/, komunikat: "Nieprawidłowy format adresu email")
  - Minimalna długość 3 znaki
  - Maksymalna długość 255 znaków
- **Typy**:
  - `ResetPasswordRequestData` (email: string)
  - `FormState` (isLoading, error, success)
- **Propsy**: Brak (komponent autonomiczny)

### ResetPasswordConfirmForm
- **Opis komponentu**: Formularz ustawiania nowego hasła po kliknięciu w link z emaila resetującego.
- **Główne elementy**:
  - Card z nagłówkiem "Ustaw nowe hasło"
  - PasswordInput dla nowego hasła
  - PasswordInput dla potwierdzenia hasła
  - Przycisk "Ustaw hasło"
  - Alert dla komunikatów
- **Obsługiwane interakcje**:
  - Wprowadzenie nowego hasła
  - Wprowadzenie potwierdzenia hasła
  - Przełączanie widoczności hasła
  - Kliknięcie przycisku zapisania
- **Obsługiwana walidacja**:
  - Hasło wymagane (komunikat: "Hasło jest wymagane")
  - Minimalna długość 6 znaków (komunikat: "Hasło musi mieć minimum 6 znaków")
  - Maksymalna długość 255 znaków
  - Potwierdzenie musi być identyczne z hasłem (komunikat: "Hasła muszą być identyczne")
  - Opcjonalnie: siła hasła (wielkie/małe litery, cyfry, znaki specjalne)
- **Typy**:
  - `ResetPasswordConfirmData` (password: string, confirmPassword: string)
  - `FormState` (isLoading, error, success)
- **Propsy**: Brak (komponent autonomiczny)

### PasswordInput
- **Opis komponentu**: Reużywalny komponent pola hasła z przyciskiem do pokazywania/ukrywania hasła.
- **Główne elementy**:
  - Input type="password" lub "text"
  - Przycisk z ikoną oka (Eye/EyeOff z lucide-react)
- **Obsługiwane interakcje**:
  - Wprowadzanie tekstu
  - Kliknięcie przycisku pokazywania/ukrywania
- **Obsługiwana walidacja**: Brak (walidacja w komponencie rodzica)
- **Typy**: Standardowe typy HTML input
- **Propsy**:
  ```typescript
  interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    id?: string;
    placeholder?: string;
    disabled?: boolean;
  }
  ```

## 5. Typy

```typescript
// Schemat walidacji dla żądania resetu
const resetPasswordRequestSchema = z.object({
  email: z.string()
    .min(1, "Adres email jest wymagany")
    .email("Nieprawidłowy format adresu email")
    .max(255, "Adres email jest za długi")
});

type ResetPasswordRequestData = z.infer<typeof resetPasswordRequestSchema>;

// Schemat walidacji dla potwierdzenia resetu
const resetPasswordConfirmSchema = z.object({
  password: z.string()
    .min(6, "Hasło musi mieć minimum 6 znaków")
    .max(255, "Hasło jest za długie"),
  confirmPassword: z.string()
    .min(1, "Potwierdzenie hasła jest wymagane")
}).refine(data => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"]
});

type ResetPasswordConfirmData = z.infer<typeof resetPasswordConfirmSchema>;

// Stan formularza
interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Odpowiedź Supabase Auth
interface AuthError {
  message: string;
  status?: number;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie lokalne w komponentach formularzy przy użyciu React hooks:

```typescript
// W ResetPasswordRequestForm
const [formState, setFormState] = useState<FormState>({
  isLoading: false,
  error: null,
  success: false
});

// React Hook Form
const form = useForm<ResetPasswordRequestData>({
  resolver: zodResolver(resetPasswordRequestSchema),
  defaultValues: {
    email: ""
  }
});

// W ResetPasswordConfirmForm
const [formState, setFormState] = useState<FormState>({
  isLoading: false,
  error: null,
  success: false
});

const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

Nie jest wymagany customowy hook ani globalne zarządzanie stanem (Zustand), ponieważ stan jest lokalny dla każdego formularza.

## 7. Integracja API

### Żądanie resetu hasła
```typescript
// Typ żądania
interface ResetPasswordRequest {
  email: string;
}

// Wywołanie Supabase Auth
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password/confirm`
});

// Obsługa odpowiedzi
if (error) {
  // Zawsze pokazuj ten sam komunikat sukcesu (bezpieczeństwo)
  setFormState({
    isLoading: false,
    error: null,
    success: true
  });
} else {
  setFormState({
    isLoading: false,
    error: null,
    success: true
  });
}
```

### Potwierdzenie resetu hasła
```typescript
// Typ żądania
interface UpdatePasswordRequest {
  password: string;
}

// Wywołanie Supabase Auth
const { error } = await supabase.auth.updateUser({
  password: data.password
});

// Obsługa odpowiedzi
if (error) {
  setFormState({
    isLoading: false,
    error: error.message,
    success: false
  });
} else {
  setFormState({
    isLoading: false,
    error: null,
    success: true
  });
  // Przekierowanie do /login po 2 sekundach
  setTimeout(() => window.location.href = '/login', 2000);
}
```

## 8. Interakcje użytkownika

### Przepływ żądania resetu:
1. Użytkownik klika link "Zapomniałem hasła" na stronie logowania
2. Zostaje przekierowany na `/reset-password`
3. Wprowadza swój adres email
4. Klika przycisk "Wyślij link resetujący"
5. Widzi komunikat o wysłaniu emaila (niezależnie od istnienia konta)
6. Może wrócić do strony logowania

### Przepływ potwierdzenia resetu:
1. Użytkownik klika link w emailu
2. Zostaje przekierowany na `/reset-password/confirm` z tokenem w URL
3. Wprowadza nowe hasło
4. Wprowadza potwierdzenie hasła
5. Może kliknąć ikony oka aby zobaczyć/ukryć hasła
6. Klika przycisk "Ustaw hasło"
7. Widzi komunikat sukcesu
8. Jest automatycznie przekierowany do `/login` po 2 sekundach

## 9. Warunki i walidacja

### Walidacja po stronie klienta:
- **Email (ResetPasswordRequestForm)**:
  - Format email sprawdzany przez Zod
  - Wyświetlanie błędów pod polem input
  - Blokowanie wysłania przy błędach

- **Hasło (ResetPasswordConfirmForm)**:
  - Minimalna długość 6 znaków
  - Zgodność hasła i potwierdzenia
  - Błędy wyświetlane pod każdym polem
  - Przycisk disabled gdy formularz niepoprawny

### Walidacja po stronie Supabase:
- Weryfikacja tokena z URL
- Sprawdzenie ważności tokena (wygasa po 24h)
- Wymogi dotyczące siły hasła (minimum 6 znaków)

### Wpływ na UI:
- Przyciski disabled podczas ładowania
- Spinner w przycisku podczas operacji
- Czerwone obramowanie pól z błędami
- Komunikaty błędów pod polami
- Alert z komunikatem sukcesu/błędu

## 10. Obsługa błędów

### Możliwe błędy i ich obsługa:

1. **Błąd sieci**:
   - Komunikat: "Wystąpił błąd połączenia. Spróbuj ponownie."
   - Przycisk retry nie jest automatyczny - użytkownik może ponowić akcję

2. **Token wygasł lub nieprawidłowy**:
   - Komunikat: "Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy."
   - Link do ponownego żądania resetu

3. **Hasło zbyt słabe**:
   - Komunikat z Supabase o wymaganiach hasła
   - Wskazówki dotyczące siły hasła

4. **Błąd Supabase Auth**:
   - Wyświetlenie ogólnego komunikatu błędu
   - Logowanie szczegółów do konsoli (development)

5. **Rate limiting**:
   - Komunikat: "Zbyt wiele prób. Spróbuj ponownie za chwilę."
   - Tymczasowe zablokowanie formularza

### Strategia komunikatów:
- Dla żądania resetu: ZAWSZE pokazuj sukces (zapobiega enumeracji użytkowników)
- Dla potwierdzenia: pokazuj rzeczywiste błędy (użytkownik już ma token)

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - Utwórz `/src/pages/reset-password.astro`
   - Utwórz `/src/pages/reset-password/confirm.astro`
   - Utwórz `/src/components/auth/ResetPasswordRequestForm.tsx`
   - Utwórz `/src/components/auth/ResetPasswordConfirmForm.tsx`
   - Utwórz `/src/components/ui/password-input.tsx`

2. **Implementacja komponentu PasswordInput**:
   - Stwórz reużywalny komponent input z toggle visibility
   - Dodaj ikony Eye/EyeOff z lucide-react
   - Przetestuj działanie toggle

3. **Implementacja ResetPasswordRequestForm**:
   - Skonfiguruj React Hook Form z Zod resolver
   - Dodaj schemat walidacji email
   - Zaimplementuj wywołanie `resetPasswordForEmail`
   - Dodaj obsługę stanów loading/success/error
   - Zawsze pokazuj komunikat sukcesu (bezpieczeństwo)

4. **Implementacja ResetPasswordConfirmForm**:
   - Skonfiguruj React Hook Form z Zod resolver
   - Dodaj schemat walidacji haseł
   - Zaimplementuj wywołanie `updateUser`
   - Dodaj obsługę stanów loading/success/error
   - Dodaj automatyczne przekierowanie po sukcesie

5. **Utworzenie stron Astro**:
   - Skonfiguruj strony z PublicLayout
   - Zaimportuj komponenty React z dyrektywą `client:load`
   - Dodaj meta tagi i tytuły stron

6. **Konfiguracja middleware**:
   - Upewnij się, że strony są dostępne publicznie
   - Dodaj przekierowanie dla zalogowanych użytkowników

7. **Dodanie linku na stronie logowania**:
   - Dodaj link "Zapomniałem hasła" prowadzący do `/reset-password`
   - Umieść go pod formularzem logowania

8. **Stylowanie komponentów**:
   - Zastosuj style Tailwind zgodne z designem
   - Zapewnij responsywność na urządzeniach mobilnych
   - Dodaj animacje loading i transitions

9. **Testowanie end-to-end**:
   - Test przepływu żądania resetu
   - Test przepływu potwierdzenia z tokenem
   - Test błędnych scenariuszy
   - Test na różnych urządzeniach

10. **Dodanie logowania i monitoringu**:
   - Loguj błędy do konsoli (development)
   - Przygotuj integrację z Sentry (production)
   - Monitoruj metryki sukcesu resetowania hasła