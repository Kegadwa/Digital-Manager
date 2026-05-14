"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  as?: "p" | "h3" | "span" | "h2";
  multiline?: boolean;
  placeholder?: string;
}

/**
 * Click-to-edit text component.
 * Renders text normally; on click, swaps to an input.
 * Enter saves, Escape cancels, blur auto-saves.
 */
export function InlineEdit({
  value,
  onSave,
  className,
  as: Tag = "p",
  multiline = false,
  placeholder = "Click to edit…",
}: InlineEditProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync external value changes
  React.useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  const startEditing = () => {
    setDraft(value);
    setIsEditing(true);
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = draft.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      save();
    } else if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (isEditing) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: save,
      className: cn(
        "bg-transparent border-primary/40 focus-visible:ring-primary/30",
        className
      ),
      placeholder,
    };

    if (multiline) {
      return (
        <Textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          rows={3}
          {...sharedProps}
        />
      );
    }

    return (
      <Input
        ref={inputRef as React.Ref<HTMLInputElement>}
        {...sharedProps}
      />
    );
  }

  return (
    <Tag
      onClick={startEditing}
      className={cn(
        "cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-muted/60",
        !value && "text-muted-foreground italic",
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startEditing();
        }
      }}
    >
      {value || placeholder}
    </Tag>
  );
}
