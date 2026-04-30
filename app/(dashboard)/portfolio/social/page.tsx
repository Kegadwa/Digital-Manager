"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Share2, Trash2, ExternalLink, Github, Linkedin, Instagram, Twitter, Globe, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { SortablePortfolioList } from "@/components/SortablePortfolioList";
import { toast } from "sonner";

const socialIcons: Record<string, any> = {
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  default: Globe
};

export default function SocialLinksPage() {
  const { social, addSocial, removeSocial, updateSocial, setSocial } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [draft, setDraft] = useState({
    name: "",
    url: "",
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setDraft({ name: "", url: "" });
    setOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditId(s.id);
    setDraft({ name: s.name, url: s.url });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name?.trim() || !draft.url?.trim()) { toast.error("Name and URL required"); return; }
    setIsSaving(true);
    try {
      if (editId) {
        updateSocial(editId, draft);
        toast.success("Social link updated");
      } else {
        addSocial(draft);
        toast.success("Social link added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSocialItem = (s: any) => {
    const Icon = socialIcons[s.name.toLowerCase()] || socialIcons.default;
    return (
      <Card className="shadow-ios border-border/40 w-full max-w-md">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{s.name}</p>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors truncate">
                View Profile <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(s)}>
              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              if (confirm(`Remove ${s.name} link?`)) {
                removeSocial(s.id);
                toast.error("Social link removed");
              }
            }}>
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Connections"
        description="Manage and reorder your professional social links."
        actions={
          <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Link</Button>
        }
      />

      <div className="max-w-4xl">
        {social.length === 0 ? (
          <div className="col-span-full border-dashed border-2 py-20 text-center text-muted-foreground rounded-2xl">
            <Share2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No social links added yet.</p>
          </div>
        ) : (
          <SortablePortfolioList 
            items={social} 
            onReorder={setSocial} 
            renderItem={renderSocialItem} 
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Social Link" : "Add Social Link"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Platform Name</label>
              <Input placeholder="e.g. GitHub" value={draft.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Profile URL</label>
              <Input placeholder="https://..." value={draft.url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, url: e.target.value })} />
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
