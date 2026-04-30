"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Award, Trash2, Calendar, Landmark, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { SortablePortfolioList } from "@/components/SortablePortfolioList";
import { toast } from "sonner";
import type { Certification } from "@/types";

export default function CertificationsPage() {
  const { certifications, addCertification, removeCertification, updateCertification, setCertifications } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [draft, setDraft] = useState<Partial<Certification>>({
    title: "",
    institution: "",
    year: "",
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setDraft({ title: "", institution: "", year: "" });
    setOpen(true);
  };

  const handleOpenEdit = (cert: Certification) => {
    setEditId(cert.id);
    setDraft(cert);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title?.trim() || !draft.institution?.trim()) { toast.error("Title and Institution required"); return; }
    setIsSaving(true);
    try {
      if (editId) {
        updateCertification(editId, draft);
        toast.success("Certification updated");
      } else {
        addCertification(draft);
        toast.success("Certification added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCertificationItem = (cert: Certification) => (
    <Card className="shadow-ios border-border/40 w-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{cert.title}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Landmark className="w-3 h-3" />
                <span>{cert.institution}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{cert.year}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(cert)}>
              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              if (confirm("Delete this certification?")) {
                removeCertification(cert.id);
                toast.error("Certification removed");
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
        title="Certifications"
        description="Manage and reorder your professional achievements."
        actions={
          <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Certification</Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {certifications.length === 0 ? (
          <Card className="border-dashed py-20 text-center text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No certifications added yet.</p>
          </Card>
        ) : (
          <SortablePortfolioList 
            items={certifications} 
            onReorder={setCertifications} 
            renderItem={renderCertificationItem} 
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Certification" : "Add Certification"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
              <Input placeholder="e.g. AWS Certified Developer" value={draft.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Institution</label>
              <Input placeholder="e.g. Amazon Web Services" value={draft.institution} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, institution: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Year</label>
              <Input placeholder="e.g. 2023" value={draft.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, year: e.target.value })} />
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
