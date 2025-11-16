# Diagnoza problemów z Supabase

## 📊 Status: Supabase działa poprawnie ✅

**Data diagnozy**: 2025-11-15
**Wykonane testy**: 6/6 zaliczone

## ✅ Co działa poprawnie

### 1. **Połączenie z Supabase**
- ✅ URL Supabase jest prawidłowy i dostępny
- ✅ Klucz API (anon key) jest poprawny
- ✅ JWT token jest ważny do: **2035-10-25**
- ✅ Rola JWT: `anon` (prawidłowa)

### 2. **Baza danych**
- ✅ Połączenie z bazą danych działa
- ✅ Tabela `decks` istnieje i jest dostępna
- ✅ Zapytania do bazy wykonują się poprawnie

### 3. **Konfiguracja środowiska**
- ✅ Plik `.env` istnieje (nie `.env.local`)
- ✅ Wszystkie wymagane zmienne są ustawione:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`

### 4. **Aplikacja**
- ✅ Serwer deweloperski uruchamia się bez błędów
- ✅ API endpoint `/api/auth/session` odpowiada poprawnie
- ✅ Middleware Supabase jest skonfigurowany

## ⚠️ Wykryte ograniczenia

### 1. **Walidacja domen email**
**Problem**: Supabase odrzuca adresy email z domen testowych
- Błąd: `Email address "test@example.com" is invalid`
- Kod błędu: `email_address_invalid`

**Prawdopodobna przyczyna**:
W ustawieniach Supabase włączona jest lista dozwolonych domen lub blokada domen testowych.

**Rozwiązanie**:
1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Przejdź do: **Authentication → Settings**
3. Sprawdź sekcję **Email Settings**:
   - Wyłącz "Block disposable email domains" jeśli jest włączone
   - Sprawdź "Allowed email domains" - może być ograniczona lista
4. Dla testów lokalnych możesz:
   - Użyć prawdziwych adresów email
   - Tymczasowo wyłączyć walidację domen
   - Dodać domenę testową do dozwolonych

### 2. **Potwierdzanie email**
**Status**: Może być włączone lub wyłączone (zależnie od konfiguracji)

**Jak sprawdzić**:
1. Supabase Dashboard → Authentication → Settings
2. Szukaj "Enable email confirmations"

**Dla developmentu**: Można wyłączyć dla łatwiejszego testowania

## 🔍 Dlaczego "wcześniej działało"?

### Możliwe przyczyny, że przestało działać:
1. **Zmiana ustawień w Supabase Dashboard** - ktoś mógł włączyć walidację domen
2. **Aktualizacja polityki Supabase** - nowe domyślne ustawienia bezpieczeństwa
3. **Różne środowisko** - produkcja vs development mogą mieć różne ustawienia

### Token nie wygasł ❌
- JWT jest ważny do 2035 roku
- Połączenie z bazą danych działa
- API keys są prawidłowe

## 📝 Checklist naprawczy

### Krok 1: Weryfikacja w Supabase Dashboard
- [ ] Zaloguj się na https://app.supabase.com
- [ ] Sprawdź Authentication → Settings → Email Settings
- [ ] Wyłącz "Block disposable email domains" dla testów
- [ ] Sprawdź listę dozwolonych domen

### Krok 2: Test z prawdziwym emailem
```javascript
// Użyj prawdziwego adresu email do testów
const testEmail = 'twoj.prawdziwy.email@gmail.com';
const testPassword = 'TestPassword123!';
```

### Krok 3: Konfiguracja dla testów E2E
```typescript
// tests/e2e/fixtures/test-users.ts
export const testUsers = {
  // Użyj prawdziwych adresów lub skonfiguruj Supabase
  valid: {
    email: 'test.user@dozwolona-domena.com',
    password: 'SecurePass123!'
  }
};
```

## 🚀 Rekomendacje

### Dla środowiska deweloperskiego:
1. **Wyłącz walidację domen email** w Supabase Dashboard
2. **Wyłącz potwierdzanie email** (opcjonalnie)
3. **Stwórz dedykowanego użytkownika testowego** z prawdziwym emailem

### Dla testów E2E:
1. **Użyj seed data** - stwórz użytkowników testowych przed testami
2. **Mock Supabase** - dla testów jednostkowych użyj MSW
3. **Osobny projekt Supabase** - dla testów CI/CD

### Dla produkcji:
1. **Zachowaj walidację domen** - to dobra praktyka bezpieczeństwa
2. **Włącz potwierdzanie email** - zapobiega spamowi
3. **Skonfiguruj SMTP** - dla własnej domeny email

## 💡 Podsumowanie

**Supabase działa poprawnie** ✅
- Baza danych jest dostępna
- Autoryzacja jest skonfigurowana
- Token nie wygasł

**Problem tkwi w ustawieniach walidacji email** w Supabase Dashboard, które blokują testowe domeny email.

## 🛠️ Szybkie rozwiązanie

1. Zaloguj się do Supabase Dashboard
2. Authentication → Settings
3. Wyłącz "Block disposable email domains"
4. Lub użyj prawdziwych adresów email do testów

---

**Dodatkowe pliki diagnostyczne utworzone**:
- `test-supabase.js` - test połączenia
- `test-auth.js` - test procesu autoryzacji

Możesz je usunąć po zakończeniu diagnostyki.