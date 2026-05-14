"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Right-side slide drawer that keeps main content visible.
 * Wraps the existing Sheet component with a convenience API
 * and a semi-transparent overlay.
 */
export function SlideDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: SlideDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-[420px] sm:w-[480px] flex flex-col overflow-y-auto scrollbar-thin",
          className
        )}
        // Make the overlay semi-transparent so main content stays visible
        style={{ "--sheet-overlay-bg": "rgba(0,0,0,0.3)" } as React.CSSProperties}
      >
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="text-lg font-display">{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 py-4 space-y-4">{children}</div>
        {footer && (
          <SheetFooter className="pt-4 border-t border-border/50">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface DrawerFormProps {
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  children: React.ReactNode;
}

/**
 * Form wrapper for use inside SlideDrawer.
 * Supports Cmd+Enter / Ctrl+Enter to submit.
 */
export function DrawerForm({
  onSubmit,
  submitLabel = "Create",
  isSubmitting = false,
  onCancel,
  children,
}: DrawerFormProps) {
  const formRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }
    };

    const el = formRef.current;
    if (el) {
      el.addEventListener("keydown", handler);
      return () => el.removeEventListener("keydown", handler);
    }
  }, [onSubmit]);

  return (
    <div ref={formRef} className="flex flex-col h-full">
      <div className="flex-1 space-y-4">{children}</div>
      <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          ⌘ Enter to submit
        </span>
        <div className="flex gap-2 ml-auto">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} type="button">
              Cancel
            </Button>
          )}
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
