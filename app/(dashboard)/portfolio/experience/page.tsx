"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Briefcase, Trash2, Calendar, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { SortablePortfolioList } from "@/components/SortablePortfolioList";
import { toast } from "sonner";
import type { Experience } from "@/types";

export default function ExperiencePage() {
  const { experience, addExperience, removeExperience, updateExperience, setExperience } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [draft, setDraft] = useState<Partial<Experience>>({
    title: "",
    company: "",
    dates: "",
    description: "",
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setDraft({ title: "", company: "", dates: "", description: "" });
    setOpen(true);
  };

  const handleOpenEdit = (exp: Experience) => {
    setEditId(exp.id);
    setDraft(exp);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title?.trim() || !draft.company?.trim()) { toast.error("Title and Company required"); return; }
    setIsSaving(true);
    try {
      if (editId) {
        updateExperience(editId, draft);
        toast.success("Experience updated");
      } else {
        addExperience(draft);
        toast.success("Experience added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderExperienceItem = (exp: Experience) => (
    <Card className="shadow-ios border-border/40 w-full">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{exp.title}</h3>
              <p className="text-primary font-medium">{exp.company}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {exp.dates}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{exp.description}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 self-end md:self-start">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(exp)}>
              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {
              if (confirm("Delete this experience?")) {
                removeExperience(exp.id);
                toast.error("Experience removed");
              }
            }}>
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional Experience"
        description="Manage and reorder your career history."
        actions={
          <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Experience</Button>
        }
      />

      <div className="max-w-4xl">
        {experience.length === 0 ? (
          <Card className="border-dashed py-20 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No experience records yet.</p>
          </Card>
        ) : (
          <SortablePortfolioList 
            items={experience} 
            onReorder={setExperience} 
            renderItem={renderExperienceItem} 
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Experience" : "Add Experience"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Job Title</label>
              <Input placeholder="e.g. Senior Web Developer" value={draft.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Company</label>
              <Input placeholder="e.g. Acme Corp" value={draft.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, company: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Dates</label>
              <Input placeholder="e.g. 2022 — Present" value={draft.dates} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, dates: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
              <Textarea placeholder="What did you do?" value={draft.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, description: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : (editId ? "Update" : "Add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
