"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Palette, Trash2, Image as ImageIcon, ExternalLink, PlusCircle, X, Edit2, Link as LinkIcon, User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { FileUploader } from "@/components/FileUploader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import type { DesignProject } from "@/types";

export default function DesignProjectsPage() {
  const { designProjects, addDesignProject, updateDesignProject, removeDesignProject } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [draft, setDraft] = useState<Partial<DesignProject>>({
    title: "",
    tagline: "",
    summary: "",
    category: "Brand Design",
    year: new Date().getFullYear().toString(),
    client: "",
    coverImage: "",
    images: [],
    tools: [],
    tags: [],
    credits: [],
    url: "",
    isDesign: true,
  });

  const [newTag, setNewTag] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCredit, setNewCredit] = useState({ role: "", name: "" });

  const selected = designProjects.find((p) => p.id === (selectedId || designProjects[0]?.id)) || designProjects[0];

  const handleOpenAdd = () => {
    setEditMode(false);
    setDraft({
      title: "",
      tagline: "",
      summary: "",
      category: "Brand Design",
      year: new Date().getFullYear().toString(),
      client: "",
      coverImage: "",
      images: [],
      tools: [],
      tags: [],
      credits: [],
      url: "",
      isDesign: true,
    });
    setOpen(true);
  };

  const handleOpenEdit = (project: DesignProject) => {
    setEditMode(true);
    setDraft(project);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title?.trim()) { toast.error("Title required"); return; }
    if (!draft.coverImage?.trim()) { toast.error("Cover Image required"); return; }
    
    setIsSaving(true);
    try {
      if (editMode && draft.id) {
        updateDesignProject(draft.id, draft);
        toast.success("Design project updated");
      } else {
        // Ensure coverImage is first in images array if not already there
        const finalImages = draft.images || [];
        if (!finalImages.includes(draft.coverImage!)) {
            draft.images = [draft.coverImage!, ...finalImages];
        }
        addDesignProject(draft);
        toast.success("Design project added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (field: keyof DesignProject, value: string) => {
    if (!value.trim()) return;
    setDraft(prev => {
      const current = (prev[field] as string[]) || [];
      if (current.includes(value.trim())) return prev;
      return { ...prev, [field]: [...current, value.trim()] };
    });
  };

  const removeItem = (field: keyof DesignProject, value: string) => {
    const current = (draft[field] as string[]) || [];
    setDraft({ ...draft, [field]: current.filter(t => t !== value) });
  };

  const addCredit = () => {
    if (!newCredit.role.trim() || !newCredit.name.trim()) return;
    setDraft({ ...draft, credits: [...(draft.credits || []), { ...newCredit }] });
    setNewCredit({ role: "", name: "" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Portfolio"
        description="Manage your graphic design, branding, and visual projects."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Design Project</Button>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Design Project" : "Add Design Project"}</DialogTitle>
                <DialogDescription className="sr-only">Enter the details and gallery images for your design project.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                    <Input placeholder="Project Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Tagline</label>
                    <Input placeholder="Short one-liner hook..." value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                      <Input placeholder="e.g. Brand Design" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Year</label>
                      <Input placeholder="2025" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Client</label>
                    <Input placeholder="Client name (optional)" value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })} />
                  </div>
                  
                  <FileUploader 
                    label="Cover Image"
                    currentImage={draft.coverImage}
                    onUploadComplete={(url) => setDraft({ ...draft, coverImage: url })}
                    path={`Portforlio/designprojects/${draft.title?.replace(/\s+/g, '-').toLowerCase() || 'unnamed'}`}
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">External URL</label>
                    <Input placeholder="Behance / Dribbble link" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Summary</label>
                    <Textarea placeholder="2-3 sentence description..." value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={4} />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Gallery */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
                        Gallery Images
                        <span className="text-[9px] lowercase font-normal opacity-70">Upload one or more images</span>
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <FileUploader 
                        onUploadComplete={(url) => url && addItem("images", url)}
                        multiple={true}
                        path={`Portforlio/designprojects/${draft.title?.replace(/\s+/g, '-').toLowerCase() || 'unnamed'}/additional`}
                        label=""
                        className="min-h-[100px]"
                      />
                      <div className="flex flex-col gap-2">
                        <Input 
                          placeholder="Or paste URL..." 
                          value={newImageUrl} 
                          onChange={(e) => setNewImageUrl(e.target.value)} 
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("images", newImageUrl), setNewImageUrl(""))} 
                          className="text-xs"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => { addItem("images", newImageUrl); setNewImageUrl(""); }} className="h-8">Add URL</Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {draft.images?.filter(img => !!img).map((img, i) => (
                        <div key={i} className="aspect-square relative rounded-lg overflow-hidden border group">
                          <Image src={img} alt="Thumb" fill className="object-cover" unoptimized={true} />
                          <button 
                            type="button"
                            onClick={() => setDraft({ ...draft, images: draft.images?.filter((_, idx) => idx !== i) })}
                            className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tools & Tags */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Tools</label>
                      <div className="flex gap-1">
                        <Input placeholder="Figma" value={newTool} onChange={(e) => setNewTool(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("tools", newTool), setNewTool(""))} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {draft.tools?.map(t => <Badge key={t} variant="secondary" className="text-[10px] gap-1 px-1.5">{t}<X className="w-2.5 h-2.5 cursor-pointer" onClick={() => removeItem("tools", t)}/></Badge>)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Tags</label>
                      <div className="flex gap-1">
                        <Input placeholder="Print" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("tags", newTag), setNewTag(""))} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {draft.tags?.map(t => <Badge key={t} className="text-[10px] gap-1 px-1.5">{t}<X className="w-2.5 h-2.5 cursor-pointer" onClick={() => removeItem("tags", t)}/></Badge>)}
                      </div>
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="space-y-3 p-4 rounded-2xl bg-muted/50 border border-border/40">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><User className="w-3 h-3" /> Credits</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Role (e.g. Photography)" value={newCredit.role} onChange={(e) => setNewCredit({ ...newCredit, role: e.target.value })} />
                      <div className="flex gap-2">
                        <Input placeholder="Name" value={newCredit.name} onChange={(e) => setNewCredit({ ...newCredit, name: e.target.value })} />
                        <Button type="button" variant="outline" size="icon" onClick={addCredit}><PlusCircle className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {draft.credits?.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background text-[11px] border border-border/40">
                          <span><span className="opacity-60">{c.role}:</span> <strong>{c.name}</strong></span>
                          <X className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => setDraft({ ...draft, credits: draft.credits?.filter((_, idx) => idx !== i) })} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t pt-4 mt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : (editMode ? "Save Changes" : "Add Project")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <Card className="lg:col-span-1 shadow-ios border-border/40">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />Design Works</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {designProjects.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No design projects yet</p>}
            {designProjects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border animate-in-up",
                  selected?.id === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-transparent hover:bg-muted/50"
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {p.coverImage ? (
                    <Image src={p.coverImage} alt={p.title} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-5 h-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.category} · {p.year}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Details / Preview */}
        {selected ? (
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-ios border-border/40 overflow-hidden">
              <div className="relative h-64 w-full bg-muted">
                {selected.coverImage ? (
                  <Image src={selected.coverImage} alt={selected.title} fill sizes="(max-width: 768px) 100vw, 800px" priority className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-10 h-10" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <Badge className="bg-primary/20 backdrop-blur-md border-primary/30 text-white uppercase tracking-widest text-[10px]">{selected.category}</Badge>
                    <h2 className="text-3xl font-black text-white">{selected.title}</h2>
                    {selected.tagline && <p className="text-white/70 text-sm italic">"{selected.tagline}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20" onClick={() => handleOpenEdit(selected)}>
                      <Edit2 className="w-4 h-4 mr-2" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-destructive/80 hover:text-white" onClick={() => {
                        if (confirm(`Delete ${selected.title}?`)) {
                            removeDesignProject(selected.id);
                            toast.error("Project removed");
                            setSelectedId(null);
                        }
                    }}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.summary}</p>
                    </div>
                    {selected.client && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Client</h4>
                            <p className="text-sm font-medium">{selected.client}</p>
                        </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Credits</h4>
                      <div className="space-y-2">
                        {selected.credits?.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground min-w-[80px]">{c.role}:</span>
                            <span className="font-bold">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Tools Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {selected.tools?.map(tool => (
                          <Badge key={tool} variant="secondary" className="font-medium bg-muted text-foreground">{tool}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selected.tags?.map(tag => (
                          <Badge key={tag} className="font-medium bg-primary/5 text-primary border-primary/10">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    {selected.url && (
                        <Button variant="outline" className="w-full justify-between group" asChild>
                            <a href={selected.url} target="_blank" rel="noopener noreferrer">
                                <span>View on External Platform</span>
                                <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </a>
                        </Button>
                    )}
                  </div>
                </div>

                {/* Gallery Preview */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Gallery ({selected.images?.length || 0})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selected.images?.filter(img => !!img).map((img, i) => (
                      <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-muted group/img">
                        <Image src={img} alt={`Gallery ${i}`} fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover transition-transform group-hover/img:scale-110" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="lg:col-span-2 border-dashed border-2 flex items-center justify-center p-20 text-muted-foreground">
            <div className="text-center">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Select a design project to view details or create a new one</p>
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}

