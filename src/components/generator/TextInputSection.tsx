/**
 * TextInputSection component
 * Text input area with character counter and validation
 */

import { useCallback } from "react";
import { CharacterCounter } from "./CharacterCounter";
import { Label } from "@/components/ui/label";
import type { TextInputSectionProps } from "@/types/generator.types";

const MAX_CHARACTERS = 1000;

export function TextInputSection({ text, onTextChange, disabled }: TextInputSectionProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      // Auto-truncate at max length
      if (newText.length <= MAX_CHARACTERS) {
        onTextChange(newText);
      } else {
        onTextChange(newText.slice(0, MAX_CHARACTERS));
      }
    },
    [onTextChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData("text");
      const currentText = text;
      const selectionStart = e.currentTarget.selectionStart;
      const selectionEnd = e.currentTarget.selectionEnd;

      // Calculate new text after paste
      const newText = currentText.substring(0, selectionStart) + pastedText + currentText.substring(selectionEnd);

      // If pasted text would exceed limit, truncate
      if (newText.length > MAX_CHARACTERS) {
        e.preventDefault();
        onTextChange(newText.slice(0, MAX_CHARACTERS));
      }
    },
    [text, onTextChange]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="text-input" className="text-base">
        Wklej swoje notatki
      </Label>
      <p className="text-sm text-muted-foreground">AI wygeneruje fiszki z podanego tekstu (max 1000 znaków)</p>
      <textarea
        id="text-input"
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder="Wklej tutaj swoje notatki..."
        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
        aria-describedby="char-count"
      />
      <div className="flex justify-end">
        <div id="char-count">
          <CharacterCounter current={text.length} max={MAX_CHARACTERS} />
        </div>
      </div>
    </div>
  );
}
