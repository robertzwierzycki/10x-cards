/**
 * New Password Form
 * Allows users to set new password after clicking reset link
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordConfirmSchema, type ResetPasswordConfirmData } from "@/schemas/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Form states for password update flow
 */
type FormState = "input" | "success" | "error";

/**
 * New Password Form Component
 * Handles setting new password after reset link click
 */
export default function NewPasswordForm() {
  const [formState, setFormState] = useState<FormState>("input");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordConfirmData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordConfirmData) => {
    try {
      setServerError(null);

      // Create Supabase client
      const supabase = createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
      );

      // Update user password
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes("session_not_found") || error.message.includes("invalid")) {
          setServerError("Link wygasł lub jest nieprawidłowy. Poproś o nowy link resetujący.");
          setFormState("error");
        } else if (error.status === 422) {
          setServerError("Hasło nie spełnia wymagań bezpieczeństwa.");
          setFormState("error");
        } else if (error.status === 429) {
          setServerError("Zbyt wiele prób. Spróbuj ponownie za chwilę.");
          setFormState("error");
        } else {
          setServerError("Wystąpił błąd podczas ustawiania hasła. Spróbuj ponownie.");
          setFormState("error");
        }
        return;
      }

      // Success - show confirmation and redirect
      setFormState("success");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Password update error:", error);

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
          <CardTitle className="text-2xl font-bold text-center">Hasło zostało zmienione</CardTitle>
          <CardDescription className="text-center">
            Twoje hasło zostało pomyślnie zaktualizowane. Za chwilę zostaniesz przekierowany do strony logowania.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center">Przekierowanie za 2 sekundy...</AlertDescription>
          </Alert>

          <div className="text-center">
            <a
              href="/login"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Zaloguj się teraz
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state with expired link
  if (formState === "error" && serverError?.includes("wygasł")) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Link wygasł</CardTitle>
          <CardDescription className="text-center">
            Link do resetowania hasła wygasł lub jest nieprawidłowy. Linki są ważne przez 60 minut.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>

          <Button asChild className="w-full">
            <a href="/reset-password">Poproś o nowy link</a>
          </Button>

          <div className="text-center text-sm">
            <a
              href="/login"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Powrót do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Input form view
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta. Hasło musi mieć co najmniej 8 znaków.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Server Error Alert */}
          {serverError && formState === "error" && !serverError.includes("wygasł") && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              autoFocus
              disabled={isSubmitting}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              {...register("confirmPassword")}
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-label={isSubmitting ? "Ustawianie hasła w toku" : "Ustaw nowe hasło"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Ustawianie...
              </>
            ) : (
              "Ustaw nowe hasło"
            )}
          </Button>

          {/* Footer Links */}
          <div className="text-center text-sm">
            <a
              href="/login"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Powrót do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
