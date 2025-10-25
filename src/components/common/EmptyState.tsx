/**
 * Empty state component
 * Displays message when no data is available
 */

import type { ReactNode } from "react";

interface EmptyStateProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Description text
   */
  description: string;

  /**
   * Optional illustration SVG or icon component
   */
  illustration?: ReactNode;

  /**
   * Optional action buttons
   */
  actions?: ReactNode;
}

/**
 * Reusable empty state component
 * Used when no data is available or search returns no results
 */
export function EmptyState({ title, description, illustration, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {illustration && <div className="mb-4">{illustration}</div>}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}
