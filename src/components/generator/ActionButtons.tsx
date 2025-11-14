/**
 * ActionButtons component
 * Action buttons for save, cancel, and regenerate operations
 */

import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, X } from "lucide-react";
import type { ActionButtonsProps } from "@/types/generator.types";

export function ActionButtons({ onSave, onCancel, onRegenerate, canSave, isSaving }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
      {/* Secondary actions */}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onRegenerate} disabled={isSaving} type="button">
          <RotateCw className="mr-2 h-4 w-4" />
          Generuj ponownie
        </Button>

        <Button variant="outline" onClick={onCancel} disabled={isSaving} type="button">
          <X className="mr-2 h-4 w-4" />
          Anuluj
        </Button>
      </div>

      {/* Primary action */}
      <Button onClick={onSave} disabled={!canSave || isSaving} size="lg" type="button">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSaving ? "Zapisywanie..." : "Zapisz do talii"}
      </Button>
    </div>
  );
}
