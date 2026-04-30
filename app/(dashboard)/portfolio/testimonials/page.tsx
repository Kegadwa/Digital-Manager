"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Quote, Trash2, User, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { SortablePortfolioList } from "@/components/SortablePortfolioList";
import { toast } from "sonner";

export default function TestimonialsPage() {
  const { testimonials, addTestimonial, removeTestimonial, updateTestimonial, setTestimonials } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [draft, setDraft] = useState({
    quote: "",
    author: "",
    role: "",
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setDraft({ quote: "", author: "", role: "" });
    setOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditId(t.id);
    setDraft({ quote: t.quote, author: t.author, role: t.role });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.quote?.trim() || !draft.author?.trim()) { toast.error("Quote and Author required"); return; }
    setIsSaving(true);
    try {
      if (editId) {
        updateTestimonial(editId, draft);
        toast.success("Testimonial updated");
      } else {
        addTestimonial(draft);
        toast.success("Testimonial added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderTestimonialItem = (t: any) => (
    <Card className="shadow-ios border-border/40 w-full max-w-2xl">
      <CardContent className="p-6">
        <Quote className="w-8 h-8 text-primary/20 mb-4" />
        <p className="text-sm italic leading-relaxed text-foreground/80 mb-6">"{t.quote}"</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{t.author}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.role}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(t)}>
              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              if (confirm("Delete this testimonial?")) {
                removeTestimonial(t.id);
                toast.error("Testimonial removed");
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
        title="Testimonials"
        description="Manage and reorder your recommendations."
        actions={
          <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Testimonial</Button>
        }
      />

      <div className="max-w-4xl">
        {testimonials.length === 0 ? (
          <div className="col-span-full border-dashed border-2 py-20 text-center text-muted-foreground rounded-2xl">
            <Quote className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No testimonials added yet.</p>
          </div>
        ) : (
          <SortablePortfolioList 
            items={testimonials} 
            onReorder={setTestimonials} 
            renderItem={renderTestimonialItem} 
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Quote</label>
              <Textarea placeholder="What did they say?" value={draft.quote} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, quote: e.target.value })} rows={4} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Author Name</label>
              <Input placeholder="e.g. John Doe" value={draft.author} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, author: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Role / Company</label>
              <Input placeholder="e.g. CEO at TechCorp" value={draft.role} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, role: e.target.value })} />
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
