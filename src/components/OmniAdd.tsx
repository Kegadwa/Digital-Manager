"use client";

import * as React from "react";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { useTasks, useProjects } from "@/store/useAppStore";
import { parseOmniInput, matchProject } from "@/utils/parseOmniInput";
import { Badge } from "@/components/ui/badge";
import { Zap, Calendar as CalIcon, Folder, Flag, Tag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * OmniAdd — A global quick-create command bar.
 * Press "C" (when no input focused) to open.
 * Type natural language to create tasks instantly.
 *
 * Example: "Fix login bug tomorrow #webapp !high @design"
 */
export function OmniAdd() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const { addTask } = useTasks();
  const { projects, addActivity } = useProjects();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const parsed = React.useMemo(() => parseOmniInput(value), [value]);
  const matchedProjectId = React.useMemo(
    () => matchProject(parsed.projectTag || "", projects || []),
    [parsed.projectTag, projects]
  );
  const matchedProject = (projects || []).find((p) => p.id === matchedProjectId);

  // Global "C" shortcut — only when no input/textarea is focused
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[role='dialog']") ||
        target.closest("[cmdk-input]");

      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey && !isInput) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!parsed.title.trim()) {
      toast.error("Type a task title first");
      return;
    }

    addTask({
      title: parsed.title,
      priority: parsed.priority,
      status: "todo",
      dueDate: parsed.dueDate,
      projectId: matchedProjectId,
      category: parsed.category,
    });

    if (matchedProjectId) {
      addActivity(matchedProjectId, {
        type: "task",
        message: `Quick-added task: "${parsed.title}"`,
      });
    }

    toast.success("Task created", {
      description: parsed.title,
    });

    setValue("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setOpen(false);
      setValue("");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => {
          setOpen(false);
          setValue("");
        }}
      />

      {/* Centered command bar */}
      <div className="fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90vw] max-w-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
        <div className="rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Quick Create
            </span>
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
              Esc
            </kbd>
          </div>

          {/* Input */}
          <div className="px-4 py-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Finish UI review tomorrow #project-x !high"'
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Live preview of parsed tokens */}
          {value.trim() && (
            <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5 border-t border-border/30 pt-2">
              {parsed.title && (
                <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                  <span className="font-normal text-muted-foreground">→</span>
                  {parsed.title}
                </Badge>
              )}
              {parsed.dueDate && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 h-5 border-primary/40 text-primary"
                >
                  <CalIcon className="w-2.5 h-2.5" />
                  {format(new Date(parsed.dueDate), "MMM d")}
                </Badge>
              )}
              {matchedProject && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 h-5 border-success/40 text-success"
                >
                  <Folder className="w-2.5 h-2.5" />
                  {matchedProject.name}
                </Badge>
              )}
              {parsed.projectTag && !matchedProject && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 h-5 border-destructive/40 text-destructive"
                >
                  <Folder className="w-2.5 h-2.5" />
                  {parsed.projectTag} (not found)
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] gap-1 h-5",
                  parsed.priority === "high" &&
                    "border-destructive/40 text-destructive",
                  parsed.priority === "medium" &&
                    "border-warning/40 text-warning",
                  parsed.priority === "low" && "border-success/40 text-success"
                )}
              >
                <Flag className="w-2.5 h-2.5" />
                {parsed.priority}
              </Badge>
              {parsed.category && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 h-5"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {parsed.category}
                </Badge>
              )}
            </div>
          )}

          {/* Hint */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              <code className="bg-muted px-1 rounded">#project</code>{" "}
              <code className="bg-muted px-1 rounded">!priority</code>{" "}
              <code className="bg-muted px-1 rounded">@category</code>{" "}
              <code className="bg-muted px-1 rounded">tomorrow</code>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Enter to create
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
