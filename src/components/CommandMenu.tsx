"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  Folder,
  Settings,
  Smile,
  User,
  Search,
  CheckSquare,
  StickyNote,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTasks, useNotes, useWorkspaceProjects } from "@/store/useAppStore";
import { useRouter } from "next/navigation";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const { tasks } = useTasks();
  const { notes } = useNotes();
  const { unifiedProjects } = useWorkspaceProjects();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <div 
        className="flex-1 max-w-xl relative hidden sm:block cursor-pointer group"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none group-hover:text-foreground transition-colors" />
        <div className="flex items-center w-full pl-10 pr-16 h-9 rounded-full bg-muted/50 border border-transparent group-hover:border-border/60 transition-all text-sm text-muted-foreground">
          Search across your workspace…
        </div>
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-background border border-border/60 rounded-md px-1.5 py-0.5">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Projects">
            {unifiedProjects.map((p) => (
              <CommandItem 
                key={p.id} 
                onSelect={() => runCommand(() => router.push(p.link))}
                className="flex items-center gap-2"
              >
                <Folder className="mr-2 h-4 w-4" style={{ color: p.color }} />
                <span>{p.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground uppercase">{p.type}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Tasks">
            {tasks.slice(0, 5).map((t) => (
              <CommandItem 
                key={t.id} 
                onSelect={() => runCommand(() => router.push("/tasks"))}
                className="flex items-center gap-2"
              >
                <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                <span>{t.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Notes">
            {notes.slice(0, 5).map((n) => (
              <CommandItem 
                key={n.id} 
                onSelect={() => runCommand(() => router.push("/notes"))}
                className="flex items-center gap-2"
              >
                <StickyNote className="mr-2 h-4 w-4 text-warning" />
                <span>{n.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
          
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push("/portfolio"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Portfolio Manager</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/finance"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Finance Dashboard</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
