"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SlideDrawer, DrawerForm } from "@/components/ui/slide-drawer";
import { InlineEdit } from "@/components/InlineEdit";
import { 
  Plus, 
  Pin, 
  Trash2, 
  Search, 
  X, 
  ArrowLeft, 
  Link as LinkIcon, 
  Calendar, 
  CheckCircle2, 
  Folder 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useNotes, useTasks, useProjects } from "@/store/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotesPage() {
  const { notes, addNote, removeNote, togglePin, updateNote } = useNotes();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", tags: "" });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const notesList = notes || [];
  const tasksList = tasks || [];
  const projectsList = projects || [];

  const filtered = useMemo(() =>
    notesList
      .filter((n) =>
        (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.updatedAt || "").localeCompare(a.updatedAt || "")),
    [notesList, search]
  );

  const selectedNote = useMemo(
    () => notesList.find((n) => n.id === selectedNoteId),
    [notesList, selectedNoteId]
  );

  const handleAdd = () => {
    if (!draft.title.trim()) { toast.error("Title required"); return; }
    addNote({
      title: draft.title.trim(),
      content: draft.content,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      pinned: false,
    });
    toast.success("Note created");
    setDraft({ title: "", content: "", tags: "" });
    setDrawerOpen(false);
  };

  const handleEditorChange = useCallback(
    (field: "title" | "content" | "tags", value: string) => {
      if (!selectedNoteId) return;
      if (field === "tags") {
        updateNote(selectedNoteId, {
          tags: value.split(",").map((t) => t.trim()).filter(Boolean),
        });
      } else {
        updateNote(selectedNoteId, { [field]: value });
      }
    },
    [selectedNoteId, updateNote]
  );

  const insertLink = (type: "Task" | "Project", name: string) => {
    if (!editorRef.current || !selectedNoteId) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = editorRef.current.value;
    const link = `[[${type}: ${name}]]`;
    const newText = text.substring(0, start) + link + text.substring(end);
    
    updateNote(selectedNoteId, { content: newText });
    
    // Set cursor after the inserted link
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.selectionStart = editorRef.current.selectionEnd = start + link.length;
        editorRef.current.focus();
      }
    }, 0);
    
    toast.success(`Linked ${type}`);
  };

  useEffect(() => {
    if (selectedNote && editorRef.current) {
      editorRef.current.focus();
    }
  }, [selectedNoteId]);

  if (selectedNote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNoteId(null)}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Press <kbd className="bg-muted px-1 rounded text-[10px]">Esc</kbd> to close
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <LinkIcon className="w-3.5 h-3.5" /> Link
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Projects</DropdownMenuLabel>
                {projectsList.map(p => (
                  <DropdownMenuItem key={p.id} onClick={() => insertLink("Project", p.name)} className="gap-2">
                    <Folder className="w-3.5 h-3.5" style={{ color: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Recent Tasks</DropdownMenuLabel>
                {tasksList.slice(0, 5).map(t => (
                  <DropdownMenuItem key={t.id} onClick={() => insertLink("Task", t.title)} className="gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{t.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", selectedNote.pinned && "text-primary")}
              onClick={() => togglePin(selectedNote.id)}
            >
              <Pin className={cn("w-4 h-4", selectedNote.pinned && "fill-current")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => { removeNote(selectedNote.id); setSelectedNoteId(null); toast.error("Note deleted"); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 min-h-[calc(100vh-220px)]">
          <div className="hidden lg:block space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none pr-1">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNoteId(n.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all border",
                  n.id === selectedNoteId
                    ? "bg-primary/5 border-primary/20 shadow-sm"
                    : "hover:bg-muted/40 border-transparent"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {n.pinned && <Pin className="w-3 h-3 text-primary fill-current shrink-0" />}
                  <p className="text-sm font-semibold truncate">{n.title || "Untitled"}</p>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-1 opacity-70">
                  {n.content?.slice(0, 60) || "No content"}
                </p>
              </button>
            ))}
          </div>

          <Card className="border-border/40 shadow-elegant overflow-hidden">
            <CardContent className="p-6 flex flex-col h-full space-y-4">
              <InlineEdit
                value={selectedNote.title}
                onSave={(val) => updateNote(selectedNote.id, { title: val })}
                className="text-2xl font-display font-bold tracking-tight"
                as="h2"
              />
              
              <Textarea
                ref={editorRef}
                value={selectedNote.content}
                key={selectedNote.id}
                onChange={(e) => handleEditorChange("content", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setSelectedNoteId(null); } }}
                placeholder="Start writing your thoughts…"
                className="flex-1 min-h-[400px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-base leading-relaxed p-0 placeholder:text-muted-foreground/30"
              />

              <div className="border-t border-border/30 pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                  <Badge variant="outline" className="text-[10px] shrink-0 border-primary/20 bg-primary/5 text-primary">Tags</Badge>
                  <InlineEdit
                    value={(selectedNote.tags || []).join(", ")}
                    onSave={(val) => updateNote(selectedNote.id, { tags: val.split(",").map((t) => t.trim()).filter(Boolean) })}
                    className="text-xs text-muted-foreground min-w-[100px]"
                    as="span"
                    placeholder="Add tags…"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Updated {format(new Date(selectedNote.updatedAt || new Date()), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description={`${notesList.length} notes · Personal workspace`}
        actions={
          <Button onClick={() => setDrawerOpen(true)} className="gap-2 shadow-glow">
            <Plus className="w-4 h-4" /> New note
          </Button>
        }
      />

      <SlideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Quick Note">
        <DrawerForm onSubmit={handleAdd} submitLabel="Create Note" onCancel={() => setDrawerOpen(false)}>
          <Input placeholder="Note Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus className="text-lg font-semibold" />
          <Textarea placeholder="Start typing…" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={10} className="resize-none" />
          <Input placeholder="Tags (work, personal, etc.)" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
        </DrawerForm>
      </SlideDrawer>

      <div className="relative max-w-md animate-in-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input placeholder="Search your thoughts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 rounded-xl bg-muted/20 border-border/40 focus:bg-background transition-all shadow-sm" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/40 bg-muted/5 animate-in-up">
          <CardContent className="py-20 text-center space-y-2">
            <Search className="w-10 h-10 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">No notes matching your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filtered.map((n, i) => (
            <Card
              key={n.id}
              className={cn(
                "break-inside-avoid border-border/40 hover:border-border/60 hover:shadow-elegant transition-all group cursor-pointer animate-in-up",
                n.pinned && "ring-1 ring-primary/20 bg-primary/5"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => setSelectedNoteId(n.id)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 flex-1 group-hover:text-primary transition-colors">{n.title || "Untitled"}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}
                    className={cn("shrink-0 transition-colors p-1 rounded-md hover:bg-muted", n.pinned ? "text-primary" : "text-muted-foreground/20")}
                  >
                    <Pin className={cn("w-3.5 h-3.5", n.pinned && "fill-current")} />
                  </button>
                </div>
                {n.content && (
                  <p className="text-xs text-muted-foreground line-clamp-5 whitespace-pre-wrap leading-relaxed opacity-80">{n.content}</p>
                )}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex gap-1 flex-wrap">
                    {(n.tags || []).slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-muted/50 font-normal">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-border/20 pt-3">
                    <span className="text-[10px] text-muted-foreground/50">{format(new Date(n.updatedAt || new Date()), "MMM d, yyyy")}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNote(n.id); toast.error("Note deleted"); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
