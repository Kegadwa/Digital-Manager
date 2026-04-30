"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Code2, Trash2, Link as LinkIcon, Box, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { SortablePortfolioList } from "@/components/SortablePortfolioList";
import { toast } from "sonner";
import Image from "next/image";
import type { Tool } from "@/types";

export default function ToolsPage() {
  const { tools, addTool, removeTool, updateTool, setTools } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [draft, setDraft] = useState<Partial<Tool>>({
    name: "",
    logo: "",
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setDraft({ name: "", logo: "" });
    setOpen(true);
  };

  const handleOpenEdit = (tool: Tool) => {
    setEditId(tool.id);
    setDraft(tool);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name?.trim()) { toast.error("Name required"); return; }
    setIsSaving(true);
    try {
      if (editId) {
        updateTool(editId, draft);
        toast.success("Tool updated");
      } else {
        addTool(draft);
        toast.success("Tool added");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderToolItem = (tool: Tool) => (
    <Card className="group shadow-ios border-border/40 hover:border-primary/30 transition-all w-full max-w-sm">
      <CardContent className="p-4 flex items-center gap-4 relative">
        <div className="w-10 h-10 relative flex items-center justify-center bg-muted rounded-lg p-1.5 shrink-0">
          {tool.logo ? (
            <Image src={tool.logo} alt={tool.name} width={40} height={40} className="object-contain" />
          ) : (
            <Code2 className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>
        <span className="text-sm font-bold tracking-tight truncate flex-1">{tool.name}</span>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(tool)}>
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            if (confirm(`Delete ${tool.name}?`)) {
              removeTool(tool.id);
              toast.error(`${tool.name} removed`);
            }
          }}>
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tech Stack & Tools"
        description="Manage and reorder your tech stack icons."
        actions={
          <Button size="sm" onClick={handleOpenAdd}><Plus className="w-4 h-4" />Add Tool</Button>
        }
      />

      <div className="max-w-4xl">
        {tools.length === 0 ? (
          <div className="col-span-full border-dashed border-2 py-20 text-center text-muted-foreground rounded-2xl">
            <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No tools added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <SortablePortfolioList 
              items={tools} 
              onReorder={setTools} 
              renderItem={renderToolItem} 
            />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Tool" : "Add Tool"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Tool Name</label>
              <Input placeholder="e.g. Next.js" value={draft.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Logo URL (SVG/PNG)</label>
              <Input placeholder="https://cdn.jsdelivr.net..." value={draft.logo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, logo: e.target.value })} />
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
