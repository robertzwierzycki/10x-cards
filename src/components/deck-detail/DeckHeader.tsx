/**
 * DeckHeader - Header component with breadcrumb, editable name, and stats
 */

import { ChevronRight } from "lucide-react";
import { EditableText } from "./EditableText";
import type { DeckDTO, StudyStatsDTO } from "@/types";

interface DeckHeaderProps {
  deck: DeckDTO;
  stats: StudyStatsDTO | null;
  onNameUpdate: (name: string) => Promise<void>;
}

export function DeckHeader({ deck, stats, onNameUpdate }: DeckHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <a href="/" className="hover:text-foreground transition-colors">
          Moje talie
        </a>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{deck.name}</span>
      </nav>

      {/* Editable deck name */}
      <EditableText value={deck.name} onSave={onNameUpdate} className="mb-4" />

      {/* Stats badges */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Wszystkich fiszek: {stats.total_cards}
          </div>

          {stats.cards_due_today > 0 && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              Do powtórki: {stats.cards_due_today}
            </div>
          )}

          {stats.cards_studied_today > 0 && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
              Powtórzono dzisiaj: {stats.cards_studied_today}
            </div>
          )}

          {stats.streak_days > 0 && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium">
              🔥 Passa: {stats.streak_days} {stats.streak_days === 1 ? "dzień" : "dni"}
            </div>
          )}

          {stats.retention_rate > 0 && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
              Skuteczność: {Math.round(stats.retention_rate * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
