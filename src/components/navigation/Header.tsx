import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userEmail: string;
  currentPath?: string;
}

/**
 * Header Component
 *
 * Main navigation header for authenticated users
 * Features:
 * - Logo with link to home
 * - Navigation links (Dashboard, Generator AI)
 * - UserMenu for account actions
 * - Active state highlighting for current page
 */
export function Header({ userEmail, currentPath = "/" }: HeaderProps) {
  /**
   * Navigation links configuration
   */
  const navigationLinks = [
    {
      label: "Dashboard",
      href: "/",
      isActive: currentPath === "/",
    },
    {
      label: "Generator AI",
      href: "/generate",
      isActive: currentPath === "/generate",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              <span className="text-2xl" aria-hidden="true">
                🎴
              </span>
              <span>10xCards</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Nawigacja główna">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm",
                    link.isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Mobile Navigation - Simple version for MVP */}
          <nav className="flex md:hidden items-center gap-4" aria-label="Nawigacja mobilna">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-medium transition-colors hover:text-primary",
                  link.isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            <UserMenu userEmail={userEmail} />
          </div>
        </div>
      </div>
    </header>
  );
}
