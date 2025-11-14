import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);

      // Call login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 401) {
          setServerError(result.error || "Nieprawidłowy e-mail lub hasło");
        } else if (response.status === 403) {
          setServerError(result.error || "Potwierdź swój adres email przed zalogowaniem");
        } else if (response.status === 429) {
          setServerError(result.error || "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę");
        } else {
          setServerError(result.error || "Wystąpił błąd podczas logowania. Spróbuj ponownie");
        }
        return;
      }

      // Success - redirect to target page
      // Decode URL in case it was encoded by middleware
      const decodedRedirect = decodeURIComponent(redirectTo);
      window.location.href = decodedRedirect;
    } catch (error) {
      console.error("Login error:", error);

      // Check if network error
      if (!navigator.onLine) {
        setServerError("Brak połączenia z internetem");
      } else {
        setServerError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swój e-mail i hasło, aby się zalogować</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Server Error Alert */}
          {serverError && (
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
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register("password")}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>

          {/* Footer Links */}
          <div className="space-y-2 text-center text-sm">
            <div>
              <a href="/reset-password" className="text-primary hover:underline">
                Zapomniałeś hasła?
              </a>
            </div>
            <div className="text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/register" className="text-primary hover:underline">
                Zarejestruj się
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
