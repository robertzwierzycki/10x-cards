/**
 * Dashboard header component
 * Contains title and create deck button
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  /**
   * Handler for create deck button click
   */
  onCreateClick: () => void;
}

/**
 * Header section of Dashboard view
 * Displays title and create new deck button
 */
export function DashboardHeader({ onCreateClick }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Moje talie</h1>
        <p className="text-muted-foreground mt-1">Zarządzaj swoimi zestawami fiszek</p>
      </div>

      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Stwórz nową talię
      </Button>
    </header>
  );
}
