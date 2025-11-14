import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/schemas/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Call register API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 409) {
          toast.error(result.error || "Ten adres e-mail jest już zarejestrowany");
        } else if (response.status === 429) {
          toast.error(result.error || "Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę");
        } else if (response.status === 400) {
          toast.error(result.error || "Nieprawidłowe dane. Sprawdź formularz");
        } else {
          toast.error(result.error || "Wystąpił błąd podczas rejestracji. Spróbuj ponownie");
        }
        return;
      }

      // Check if email verification is required
      if (result.requiresEmailConfirmation) {
        // Email verification required - show info toast
        toast.info("Sprawdź swoją skrzynkę e-mail i potwierdź rejestrację. Link aktywny przez 24 godziny", {
          duration: 6000,
        });
        // Redirect to login after short delay
        setTimeout(() => {
          window.location.assign("/login");
        }, 2000);
        return;
      }

      // Success - auto-confirmed account (FTUE)
      toast.success("Konto zostało utworzone pomyślnie!");
      // Redirect to generator (First Time User Experience - US-027)
      setTimeout(() => {
        window.location.assign("/generate");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);

      // Check if network error
      if (!navigator.onLine) {
        toast.error("Brak połączenia z internetem");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Załóż konto</CardTitle>
        <CardDescription>Wprowadź swój e-mail i hasło, aby utworzyć konto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              autoComplete="email"
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
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
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
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
            aria-label={isSubmitting ? "Rejestrowanie w toku" : "Zarejestruj się"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Rejestrowanie...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </Button>

          {/* Footer Links */}
          <div className="text-center text-sm">
            <div className="text-muted-foreground">
              Masz już konto?{" "}
              <a
                href="/login"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                Zaloguj się
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
