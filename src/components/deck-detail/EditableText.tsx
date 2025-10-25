/**
 * EditableText - Inline editable text component for deck name
 */

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { deckNameFormSchema } from "@/schemas/deck.schema";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}

export function EditableText({ value, onSave, className }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    // Validate
    const result = deckNameFormSchema.safeParse({ name: editValue });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    const trimmedValue = result.data.name;

    // No change
    if (trimmedValue === value) {
      handleCancel();
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Wystąpił błąd podczas zapisywania");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className={cn("group inline-flex items-center gap-2", className)}>
        <h1 className="text-3xl font-bold">{value}</h1>
        <button
          onClick={handleStartEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
          aria-label="Edytuj nazwę talii"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className={cn(
            "text-3xl font-bold border-b-2 bg-transparent focus:outline-none transition-colors px-1",
            error ? "border-destructive" : "border-primary focus:border-primary"
          )}
          maxLength={255}
        />

        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded hover:bg-accent text-green-600 disabled:opacity-50"
            aria-label="Zapisz"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded hover:bg-accent text-destructive disabled:opacity-50"
            aria-label="Anuluj"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">{editValue.length}/255 znaków</p>
    </div>
  );
}
