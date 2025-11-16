# 📧 Jak zmienić ustawienia walidacji email w Supabase

## 🚀 Szybkie rozwiązanie dla testów lokalnych

### Krok 1: Zaloguj się do Supabase Dashboard
1. Otwórz przeglądarkę i przejdź do: **https://app.supabase.com**
2. Zaloguj się na swoje konto
3. Wybierz projekt **10x-cards** (lub odpowiedni projekt)

### Krok 2: Przejdź do ustawień autentykacji
1. W lewym menu kliknij **Authentication** (ikona kłódki)
2. Następnie wybierz **Configuration** lub **Settings**
3. Przejdź do zakładki **Email** lub **Providers → Email**

## ⚙️ Opcje konfiguracji email

### A. Podstawowe ustawienia email

W sekcji **Email Settings** znajdziesz następujące opcje:

1. **Enable Email Signup** - włącza/wyłącza rejestrację przez email
2. **Confirm Email** - wymaga potwierdzenia adresu email przed pierwszym logowaniem
3. **Auto-confirm Email** - automatycznie potwierdza email (dobre dla developmentu)

### B. Blokowanie domen jednorazowych (problem który masz)

Supabase **domyślnie nie ma prostego przełącznika** do wyłączenia blokowania domen jednorazowych w dashboardzie. Musisz użyć jednej z poniższych metod:

## 🔧 Metoda 1: Wyłączenie walidacji dla developmentu

### Opcja A: Auto-potwierdzanie emaili (najszybsza)
1. W **Authentication → Configuration → Email**
2. Włącz opcję **"Auto-confirm users"** lub **"Skip email confirmation"**
3. To pozwoli na rejestrację z dowolnym emailem bez weryfikacji

### Opcja B: Użyj prawdziwych emaili
Zamiast `test@example.com` użyj:
- Gmail: `twoj.test+1@gmail.com`, `twoj.test+2@gmail.com` (Gmail ignoruje wszystko po +)
- Prawdziwe adresy email które kontrolujesz
- Tymczasowe emaile z dozwolonych domen

## 🛡️ Metoda 2: Konfiguracja Auth Hooks (zaawansowana)

### Krok 1: Stwórz funkcję w SQL Editor
1. W Supabase Dashboard przejdź do **SQL Editor**
2. Wykonaj poniższy skrypt:

```sql
-- Funkcja która pozwala na wszystkie emaile (dla testów)
CREATE OR REPLACE FUNCTION public.allow_all_emails(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    -- Zawsze pozwalaj na rejestrację
    RETURN jsonb_build_object();
END;
$$;

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION public.allow_all_emails TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.allow_all_emails FROM authenticated, anon, public;
```

### Krok 2: Aktywuj Hook
1. Przejdź do **Authentication → Hooks**
2. W sekcji **Before User Created**:
   - Wybierz **Type**: SQL Function
   - Wybierz funkcję: `public.allow_all_emails`
   - Kliknij **Enable Hook**

## 🔄 Metoda 3: Konfiguracja SMTP (opcjonalna)

Jeśli chcesz mieć pełną kontrolę nad emailami:

1. **Authentication → Configuration → SMTP Settings**
2. Kliknij **Enable Custom SMTP**
3. Wypełnij dane swojego serwera SMTP:
   - **Host**: np. smtp.gmail.com
   - **Port**: 587 (dla TLS) lub 465 (dla SSL)
   - **Username**: twój email
   - **Password**: hasło aplikacji (nie zwykłe hasło!)
   - **Sender email**: adres nadawcy
   - **Sender name**: nazwa nadawcy

## 🧪 Dla testów lokalnych - najprostsze rozwiązanie

### Opcja 1: Zmień email w testach
W pliku `test-auth.js` zmień:
```javascript
// Zamiast:
const testEmail = `test_${Date.now()}@example.com`;

// Użyj:
const testEmail = `test_${Date.now()}@gmail.com`; // Gmail dozwolony
// lub
const testEmail = `twoj.prawdziwy.email+test${Date.now()}@gmail.com`;
```

### Opcja 2: Wyłącz walidację email w ustawieniach projektu
1. **Authentication → Settings**
2. Szukaj opcji związanych z:
   - **Email verification**
   - **Email confirmation**
   - **Auto-confirm users**
3. Ustaw na **disabled** lub **auto-confirm**

## 🔍 Jak sprawdzić aktualne ustawienia?

Wykonaj w SQL Editor:
```sql
-- Sprawdź konfigurację auth
SELECT * FROM auth.config WHERE key LIKE '%email%';

-- Sprawdź czy są aktywne hooki
SELECT * FROM supabase_functions.hooks
WHERE hook_name = 'before-user-created';
```

## ⚠️ Ważne uwagi

1. **Dla produkcji**: Zostaw walidację włączoną - to zabezpieczenie przed spamem
2. **Dla developmentu**: Użyj auto-potwierdzania lub prawdziwych emaili
3. **Limity**: Domyślnie 2 emaile/godzinę bez własnego SMTP
4. **Gmail trick**: Używaj `+cokolwiek` w adresie Gmail dla wielu kont testowych

## 🎯 Rekomendacja dla Ciebie

**Najszybsze rozwiązanie:**
1. Zaloguj się do Supabase Dashboard
2. Authentication → Configuration → Email
3. Włącz **"Auto-confirm users"** (dla developmentu)
4. Lub użyj prawdziwych adresów email w testach

To rozwiąże problem z błędem "Email address is invalid" bez konieczności instalowania dodatkowych rozszerzeń.

## 📝 Podsumowanie

Problem z "invalid email" wynika z tego, że Supabase może mieć włączoną wewnętrzną walidację domen. Najprostsze rozwiązanie to:
- Użycie prawdziwych emaili (Gmail, Outlook itp.)
- Włączenie auto-potwierdzania dla środowiska deweloperskiego
- Konfiguracja Auth Hooks jeśli potrzebujesz większej kontroli

---

**Ostatnia aktualizacja**: Listopad 2024
**Źródła**: Oficjalna dokumentacja Supabase, GitHub Discussions, blog.mansueli.com