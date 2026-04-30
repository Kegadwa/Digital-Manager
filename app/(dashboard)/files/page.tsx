"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, FileImage, Folder, File as FileIcon, Star, Trash2, Search, Upload } from "lucide-react";
import { useFiles } from "@/store/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types";

const iconMap = {
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  image: FileImage,
  doc: FileText,
  folder: Folder,
  other: FileIcon,
};

const colorMap = {
  pdf: "text-destructive bg-destructive/10",
  spreadsheet: "text-success bg-success/10",
  image: "text-primary bg-primary/10",
  doc: "text-primary bg-primary/10",
  folder: "text-warning bg-warning/10",
  other: "text-muted-foreground bg-muted",
};

const formatSize = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function FilesPage() {
  const { files, addFile, removeFile, toggleStar } = useFiles();
  const [search, setSearch] = useState("");

  const filesList = files || [];

  const filtered = filesList.filter((f) => (f.name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(b.starred) - Number(a.starred) || (b.modifiedAt || "").localeCompare(a.modifiedAt || ""));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    Array.from(list).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      let type: FileItem["type"] = "other";
      if (["pdf"].includes(ext)) type = "pdf";
      else if (["xls", "xlsx", "csv"].includes(ext)) type = "spreadsheet";
      else if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) type = "image";
      else if (["doc", "docx", "txt", "md"].includes(ext)) type = "doc";
      addFile({ name: f.name, type, size: f.size, starred: false });
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description={`${filesList.length} items · ${formatSize(filesList.reduce((s, f) => s + f.size, 0))}`}
        actions={
          <label>
            <input type="file" multiple onChange={handleUpload} className="hidden" />
            <Button asChild size="sm" className="cursor-pointer">
              <span><Upload className="w-4 h-4" />Upload</span>
            </Button>
          </label>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((f) => {
          const Icon = iconMap[f.type as keyof typeof iconMap] || FileIcon;
          return (
            <Card key={f.id} className="border-border/60 shadow-card hover:shadow-elegant transition-all group cursor-pointer">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[f.type as keyof typeof colorMap])}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <button onClick={() => toggleStar(f.id)} aria-label="Star" className={cn("transition-colors", f.starred ? "text-warning" : "text-muted-foreground/40 hover:text-muted-foreground")}>
                    <Star className={cn("w-4 h-4", f.starred && "fill-current")} />
                  </button>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatSize(f.size)} · {format(new Date(f.modifiedAt || new Date()), "MMM d")}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">{f.type}</Badge>
                  <button onClick={() => removeFile(f.id)} aria-label="Delete" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed border-border/60"><CardContent className="py-16 text-center text-muted-foreground">No files yet</CardContent></Card>
      )}
    </div>
  );
}
