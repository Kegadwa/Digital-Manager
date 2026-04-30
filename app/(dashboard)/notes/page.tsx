"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pin, Trash2, Search } from "lucide-react";
import { useNotes } from "@/store/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { notes, addNote, removeNote, togglePin } = useNotes();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", tags: "" });

  const notesList = notes || [];

  const filtered = notesList.filter((n) =>
    (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.content || "").toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  const handleAdd = () => {
    if (!draft.title.trim()) return;
    addNote({
      title: draft.title.trim(),
      content: draft.content,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      pinned: false,
    });
    setDraft({ title: "", content: "", tags: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description={`${notesList.length} notes · ${notesList.filter((n) => n.pinned).length} pinned`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4" />New note</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create note</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <Input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
                <Textarea placeholder="Write something…" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={6} />
                <Input placeholder="Tags (comma separated)" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60"><CardContent className="py-16 text-center text-muted-foreground">No notes found</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((n) => (
            <Card key={n.id} className={cn("border-border/60 shadow-card hover:shadow-elegant transition-all group", n.pinned && "ring-1 ring-primary/30")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{n.title}</h3>
                  <button onClick={() => togglePin(n.id)} aria-label="Pin note" className={cn("shrink-0 transition-colors", n.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                    <Pin className={cn("w-4 h-4", n.pinned && "fill-current")} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{n.content}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {(n.tags || []).slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{format(new Date(n.updatedAt || new Date()), "MMM d")}</span>
                    <button onClick={() => removeNote(n.id)} aria-label="Delete" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
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
