"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Folder, Globe, Trash2, Image as ImageIcon, ExternalLink, Code2, PlusCircle, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import type { PortfolioProject, PortfolioProjectMetric } from "@/types";

export default function PortfolioProjectsPage() {
  const { projects, addProject, updateProject, removeProject } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [draft, setDraft] = useState<Partial<PortfolioProject>>({
    title: "",
    shortLabel: "",
    year: new Date().getFullYear().toString(),
    category: "",
    url: "",
    image: "",
    summary: "",
    overview: "",
    challenge: "",
    solution: "",
    impact: "",
    stack: [],
    metrics: [],
    layout: "standard",
  });

  const [newTag, setNewTag] = useState("");
  const [newMetric, setNewMetric] = useState({ label: "", value: "" });

  const selected = projects.find((p) => p.id === (selectedId || projects[0]?.id)) || projects[0];

  const handleCreate = async () => {
    if (!draft.title?.trim()) { toast.error("Title required"); return; }
    setIsCreating(true);
    try {
      addProject(draft);
      toast.success("Portfolio project created");
      setOpen(false);
      setDraft({
        title: "",
        shortLabel: "",
        year: new Date().getFullYear().toString(),
        category: "",
        url: "",
        image: "",
        summary: "",
        overview: "",
        challenge: "",
        solution: "",
        impact: "",
        stack: [],
        metrics: [],
        layout: "standard",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addStackItem = () => {
    if (!newTag.trim()) return;
    setDraft({ ...draft, stack: [...(draft.stack || []), newTag.trim()] });
    setNewTag("");
  };

  const removeStackItem = (tag: string) => {
    setDraft({ ...draft, stack: (draft.stack || []).filter(t => t !== tag) });
  };

  const addMetricItem = () => {
    if (!newMetric.label.trim() || !newMetric.value.trim()) return;
    setDraft({ ...draft, metrics: [...(draft.metrics || []), { ...newMetric }] });
    setNewMetric({ label: "", value: "" });
  };

  const removeMetricItem = (index: number) => {
    setDraft({ ...draft, metrics: (draft.metrics || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Projects"
        description="Manage the projects displayed on your public portfolio website."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4" />Add Project</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Portfolio Project</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                    <Input placeholder="Project Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Short Label</label>
                    <Input placeholder="e.g. Featured Build" value={draft.shortLabel} onChange={(e) => setDraft({ ...draft, shortLabel: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Year</label>
                      <Input placeholder="2025" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                      <Input placeholder="Web App" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">URL</label>
                    <Input placeholder="https://..." value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Image URL</label>
                    <Input placeholder="https://images.unsplash.com/..." value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Layout</label>
                    <Select value={draft.layout} onValueChange={(v: "feature" | "standard") => setDraft({ ...draft, layout: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="feature">Feature (Large)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Summary</label>
                    <Textarea placeholder="Short hook..." value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Overview</label>
                    <Textarea placeholder="Detailed overview..." value={draft.overview} onChange={(e) => setDraft({ ...draft, overview: e.target.value })} rows={3} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Challenge</label>
                    <Textarea placeholder="The problem..." value={draft.challenge} onChange={(e) => setDraft({ ...draft, challenge: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Solution</label>
                    <Textarea placeholder="How you solved it..." value={draft.solution} onChange={(e) => setDraft({ ...draft, solution: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Impact</label>
                    <Textarea placeholder="Results..." value={draft.impact} onChange={(e) => setDraft({ ...draft, impact: e.target.value })} rows={2} />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Tech Stack</label>
                    <div className="flex gap-2">
                      <Input placeholder="Next.js" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStackItem()} />
                      <Button type="button" variant="outline" onClick={addStackItem}><PlusCircle className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {draft.stack?.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeStackItem(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Metrics</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Label (e.g. Speed)" value={newMetric.label} onChange={(e) => setNewMetric({ ...newMetric, label: e.target.value })} />
                      <div className="flex gap-2">
                        <Input placeholder="Value (e.g. 100%)" value={newMetric.value} onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })} />
                        <Button type="button" variant="outline" onClick={addMetricItem}><PlusCircle className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {draft.metrics?.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs">
                          <span><strong>{m.value}</strong> {m.label}</span>
                          <button onClick={() => removeMetricItem(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={isCreating}>{isCreating ? "Adding..." : "Add Project"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <Card className="lg:col-span-1 shadow-ios border-border/40">
          <CardHeader><CardTitle className="text-base font-display">Portfolio Works</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {projects.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No projects yet</p>}
            {projects.map((p, i) => (
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
                  {p.image ? (
                    <Image src={p.image} alt={p.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-5 h-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.category} · {p.year}</p>
                </div>
                {p.layout === "feature" && <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">FEATURE</Badge>}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Details / Edit */}
        {selected ? (
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-ios border-border/40 overflow-hidden">
              <div className="relative h-48 w-full bg-muted">
                {selected.image ? (
                  <Image src={selected.image} alt={selected.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-10 h-10" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <Badge className="mb-2 bg-primary/20 backdrop-blur-md border-primary/30 text-white">{selected.category}</Badge>
                    <h2 className="text-2xl font-black text-white">{selected.title}</h2>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20" asChild>
                    <a href={selected.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Live Link</a>
                  </Button>
                </div>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.summary}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">The Challenge</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.challenge}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">The Solution</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.solution}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selected.stack.map(tag => (
                          <Badge key={tag} variant="secondary" className="font-medium">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Impact & Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selected.metrics.map((m, i) => (
                          <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border/40">
                            <p className="text-lg font-black">{m.value}</p>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border/40">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setDraft(selected)}>Edit Project</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Edit Portfolio Project</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                              <Input placeholder="Project Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Short Label</label>
                              <Input placeholder="e.g. Featured Build" value={draft.shortLabel} onChange={(e) => setDraft({ ...draft, shortLabel: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Year</label>
                                <Input placeholder="2025" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                                <Input placeholder="Web App" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">URL</label>
                              <Input placeholder="https://..." value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Image URL</label>
                              <Input placeholder="https://images.unsplash.com/..." value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Layout</label>
                              <Select value={draft.layout} onValueChange={(v: "feature" | "standard") => setDraft({ ...draft, layout: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="feature">Feature (Large)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Summary</label>
                              <Textarea placeholder="Short hook..." value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={2} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Overview</label>
                              <Textarea placeholder="Detailed overview..." value={draft.overview} onChange={(e) => setDraft({ ...draft, overview: e.target.value })} rows={3} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Challenge</label>
                              <Textarea placeholder="The problem..." value={draft.challenge} onChange={(e) => setDraft({ ...draft, challenge: e.target.value })} rows={2} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Solution</label>
                              <Textarea placeholder="How you solved it..." value={draft.solution} onChange={(e) => setDraft({ ...draft, solution: e.target.value })} rows={2} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Impact</label>
                              <Textarea placeholder="Results..." value={draft.impact} onChange={(e) => setDraft({ ...draft, impact: e.target.value })} rows={2} />
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2 border-t pt-4 space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Tech Stack</label>
                              <div className="flex gap-2">
                                <Input placeholder="Next.js" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStackItem()} />
                                <Button type="button" variant="outline" onClick={addStackItem}><PlusCircle className="w-4 h-4" /></Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {draft.stack?.map(tag => (
                                  <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <button onClick={() => removeStackItem(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Metrics</label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Label (e.g. Speed)" value={newMetric.label} onChange={(e) => setNewMetric({ ...newMetric, label: e.target.value })} />
                                <div className="flex gap-2">
                                  <Input placeholder="Value (e.g. 100%)" value={newMetric.value} onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })} />
                                  <Button type="button" variant="outline" onClick={addMetricItem}><PlusCircle className="w-4 h-4" /></Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {draft.metrics?.map((m, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs">
                                    <span><strong>{m.value}</strong> {m.label}</span>
                                    <button onClick={() => removeMetricItem(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            updateProject(selected.id, draft);
                            toast.success("Project updated");
                          }}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Delete this portfolio project?")) {
                      removeProject(selected.id);
                      toast.error("Project removed");
                      setSelectedId(null);
                    }
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="lg:col-span-2 border-dashed border-2 flex items-center justify-center p-20 text-muted-foreground">
            <div className="text-center">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Select a project to view details or create a new one</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
