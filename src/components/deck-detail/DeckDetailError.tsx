/**
 * DeckDetailError - Error state component for deck detail view
 */

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorState {
  code: 403 | 404 | 500;
  message: string;
  retry?: () => void;
}

interface DeckDetailErrorProps {
  error: ErrorState;
}

export function DeckDetailError({ error }: DeckDetailErrorProps) {
  const getErrorDetails = () => {
    switch (error.code) {
      case 404:
        return {
          title: "Talia nie została znaleziona",
          description: "Talia, której szukasz, nie istnieje lub została usunięta.",
          showRetry: false,
          showBackButton: true,
        };
      case 403:
        return {
          title: "Brak dostępu",
          description: "Nie masz uprawnień do przeglądania tej talii.",
          showRetry: false,
          showBackButton: true,
        };
      case 500:
      default:
        return {
          title: "Wystąpił błąd",
          description: error.message || "Nie udało się załadować talii. Spróbuj ponownie.",
          showRetry: true,
          showBackButton: true,
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{details.title}</AlertTitle>
        <AlertDescription>{details.description}</AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-3 justify-center">
        {details.showRetry && error.retry && (
          <button
            onClick={error.retry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Spróbuj ponownie
          </button>
        )}

        {details.showBackButton && (
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Wróć do listy talii
          </a>
        )}
      </div>
    </div>
  );
}
