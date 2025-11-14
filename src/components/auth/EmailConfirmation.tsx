/**
 * Email Confirmation Component
 * Handles email verification after registration
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Verification states
 */
type VerificationState = "verifying" | "success" | "error" | "already_confirmed";

/**
 * Email Confirmation Component
 * Automatically verifies email on mount using Supabase callback
 */
export default function EmailConfirmation() {
  const [state, setState] = useState<VerificationState>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Create Supabase client
        const supabase = createBrowserClient(
          import.meta.env.PUBLIC_SUPABASE_URL,
          import.meta.env.PUBLIC_SUPABASE_ANON_KEY
        );

        // Get the session - Supabase automatically handles the token from URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Verification error:", error);

          // Handle specific errors
          if (error.message.includes("expired") || error.message.includes("invalid")) {
            setErrorMessage("Link weryfikacyjny wygasł lub jest nieprawidłowy.");
          } else {
            setErrorMessage("Wystąpił błąd podczas weryfikacji. Spróbuj ponownie.");
          }
          setState("error");
          return;
        }

        // Check if user is authenticated
        if (data.session?.user) {
          // Check if email was just confirmed
          const user = data.session.user;

          if (user.email_confirmed_at) {
            setState("success");

            // Start countdown for redirect
            const interval = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(interval);
                  // Redirect to generate page (FTUE)
                  window.location.href = "/generate";
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            return () => clearInterval(interval);
          } else {
            setState("error");
            setErrorMessage("Email nie został jeszcze potwierdzony.");
          }
        } else {
          setState("error");
          setErrorMessage("Brak aktywnej sesji. Zaloguj się ponownie.");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setState("error");
        setErrorMessage("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      }
    };

    verifyEmail();
  }, []);

  // Verifying state
  if (state === "verifying") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Weryfikacja emaila</CardTitle>
          <CardDescription className="text-center">Trwa potwierdzanie Twojego adresu e-mail...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Proszę czekać...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Email potwierdzony!</CardTitle>
          <CardDescription className="text-center">
            Twój adres e-mail został pomyślnie zweryfikowany. Możesz teraz w pełni korzystać z 10xCards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center">
              Przekierowanie do generatora za {countdown} {countdown === 1 ? "sekundę" : "sekundy"}...
            </AlertDescription>
          </Alert>

          <Button asChild className="w-full">
            <a href="/generate">
              Przejdź do generatora
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>

          <div className="text-center text-sm">
            <a
              href="/"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Przejdź do dashboardu
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-destructive" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Błąd weryfikacji</CardTitle>
        <CardDescription className="text-center">Nie udało się potwierdzić Twojego adresu e-mail.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Link weryfikacyjny mógł wygasnąć. Linki są ważne przez 24 godziny.
          </p>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <a href="/register">Zarejestruj się ponownie</a>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <a href="/login">Zaloguj się</a>
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Jeśli problem się powtarza, skontaktuj się z pomocą techniczną.
        </div>
      </CardContent>
    </Card>
  );
}
