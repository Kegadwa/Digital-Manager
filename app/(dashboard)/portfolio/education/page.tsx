"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, GraduationCap, Trash2, Calendar, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { SortablePortfolioList } from "@/components/SortablePortfolioList";
import { toast } from "sonner";
import type { Education } from "@/types";

export default function EducationPage() {
  const { education, addEducation, removeEducation, updateEducation, setEducation } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [draft, setDraft] = useState<Partial<Education>>({
    period: "",
    institution: "",
    detail: "",
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setDraft({ period: "", institution: "", detail: "" });
    setOpen(true);
  };

  const handleOpenEdit = (edu: Education) => {
    setEditId(edu.id);
    setDraft(edu);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.institution?.trim()) { toast.error("Institution required"); return; }
    setIsSaving(true);
    try {
      if (editId) {
        updateEducation(editId, draft);
        toast.success("Education updated");
      } else {
        addEducation(draft);
        toast.success("Education added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderEducationItem = (edu: Education) => (
    <Card className="shadow-ios border-border/40 w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">{edu.institution}</h3>
              <p className="text-sm text-primary font-medium">{edu.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {edu.period}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(edu)}>
              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              if (confirm("Delete this record?")) {
                removeEducation(edu.id);
                toast.error("Record removed");
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
        title="Education"
        description="Manage and reorder your academic background."
        actions={
          <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Education</Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {education.length === 0 ? (
          <Card className="border-dashed py-20 text-center text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No education records yet.</p>
          </Card>
        ) : (
          <SortablePortfolioList 
            items={education} 
            onReorder={setEducation} 
            renderItem={renderEducationItem} 
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Education" : "Add Education"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Period</label>
              <Input placeholder="e.g. 2021 — 2025" value={draft.period} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, period: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Institution</label>
              <Input placeholder="e.g. Kabarak University" value={draft.institution} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, institution: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Detail / Course</label>
              <Input placeholder="e.g. Bachelor of Business IT" value={draft.detail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, detail: e.target.value })} />
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
