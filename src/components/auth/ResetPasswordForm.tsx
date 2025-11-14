/**
 * Reset Password Request Form
 * Allows users to request password reset link via email
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordRequestSchema, type ResetPasswordRequestData } from "@/schemas/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Form states for password reset flow
 */
type FormState = "input" | "success" | "error";

/**
 * Reset Password Form Component
 * Handles initial step of password reset - email input
 */
export default function ResetPasswordForm() {
  const [formState, setFormState] = useState<FormState>("input");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestData>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordRequestData) => {
    try {
      setServerError(null);

      // Create Supabase client
      const supabase = createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
      );

      // Request password reset
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) {
        // Handle specific error cases
        if (error.status === 429) {
          setServerError("Zbyt wiele prób. Spróbuj ponownie za chwilę.");
          setFormState("error");
        } else {
          setServerError("Wystąpił błąd. Spróbuj ponownie później.");
          setFormState("error");
        }
        return;
      }

      // Always show success message for security
      // (Don't reveal if email exists in database)
      setFormState("success");
    } catch (error) {
      console.error("Password reset error:", error);

      // Check if network error
      if (!navigator.onLine) {
        setServerError("Brak połączenia z internetem");
      } else {
        setServerError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      }
      setFormState("error");
    }
  };

  // Success state view
  if (formState === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sprawdź swoją skrzynkę</CardTitle>
          <CardDescription className="text-center">
            Jeśli podany adres e-mail jest zarejestrowany w systemie, wysłaliśmy na niego link do resetowania hasła.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Link do resetowania hasła jest ważny przez 60 minut. Jeśli nie widzisz wiadomości, sprawdź folder spam.
            </AlertDescription>
          </Alert>

          <div className="text-center text-sm space-y-2">
            <div>
              <a
                href="/login"
                className="inline-flex items-center text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Powrót do logowania
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Input form view
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Zresetuj hasło</CardTitle>
        <CardDescription>
          Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do zresetowania hasła.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Server Error Alert */}
          {serverError && formState === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              autoComplete="email"
              autoFocus
              disabled={isSubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-label={isSubmitting ? "Wysyłanie linku resetującego" : "Wyślij link"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij link do resetowania"
            )}
          </Button>

          {/* Footer Links */}
          <div className="text-center text-sm space-y-2">
            <div>
              <a
                href="/login"
                className="inline-flex items-center text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Powrót do logowania
              </a>
            </div>
            <div className="text-muted-foreground">
              Nie masz konta?{" "}
              <a
                href="/register"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                Zarejestruj się
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
