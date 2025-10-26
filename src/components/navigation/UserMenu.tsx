import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Loader2 } from "lucide-react";

interface UserMenuProps {
  userEmail: string;
}

/**
 * UserMenu Component
 *
 * Dropdown menu for authenticated users with:
 * - Avatar with user initials
 * - User email display
 * - Profile link (disabled/placeholder)
 * - Logout functionality
 */
export function UserMenu({ userEmail }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Generates user initials from email address
   * Examples:
   * - "jan.kowalski@example.com" → "JK"
   * - "john@example.com" → "JO"
   */
  const getInitials = (email: string): string => {
    const username = email.split("@")[0];
    const parts = username.split(".");

    if (parts.length >= 2) {
      // First letter of first name + first letter of last name
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    // If no dot separator, take first two letters
    return username.slice(0, 2).toUpperCase();
  };

  /**
   * Handles user logout
   * Uses client-side Supabase client to sign out
   * Redirects to login page after successful logout
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Create browser client for logout
      const supabase = createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
      );

      // Sign out user
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        // Still redirect even on error to clear client state
      }

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Unexpected logout error:", error);
      // Force redirect anyway
      window.location.href = "/login";
    }
  };

  const initials = getInitials(userEmail);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 overflow-hidden"
          aria-label="Menu użytkownika"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
            {initials}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User Email Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground">Zalogowany jako</p>
            <p className="text-sm font-medium leading-none truncate">{userEmail}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Profile Link - Disabled (placeholder for future feature) */}
        <DropdownMenuItem disabled className="cursor-not-allowed">
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
          <span className="ml-auto text-xs text-muted-foreground">Wkrótce</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout Button */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Wylogowywanie...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Wyloguj</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
