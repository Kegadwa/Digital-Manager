"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SlideDrawer } from "@/components/ui/slide-drawer";
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  Folder, 
  File as FileIcon, 
  Star, 
  Trash2, 
  Search, 
  Upload, 
  LayoutGrid, 
  List, 
  Info,
  MoreVertical,
  Download,
  Share2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFiles } from "@/store/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  pdf: "text-red-500 bg-red-500/10",
  spreadsheet: "text-emerald-500 bg-emerald-500/10",
  image: "text-blue-500 bg-blue-500/10",
  doc: "text-indigo-500 bg-indigo-500/10",
  folder: "text-amber-500 bg-amber-500/10",
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filesList = files || [];

  const filtered = useMemo(() => 
    filesList
      .filter((f) => (f.name || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.starred) - Number(a.starred) || (b.modifiedAt || "").localeCompare(a.modifiedAt || "")),
    [filesList, search]
  );

  const selectedFile = useMemo(
    () => filesList.find(f => f.id === selectedFileId),
    [filesList, selectedFileId]
  );

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
    toast.success(`${list.length} file(s) uploaded`);
    e.target.value = "";
  };

  const handleFileClick = (id: string) => {
    setSelectedFileId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description={`${filesList.length} items · ${formatSize(filesList.reduce((s, f) => s + f.size, 0))}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/20">
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-7 w-7 rounded-md"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-7 w-7 rounded-md"
                onClick={() => setViewMode("list")}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <label>
              <input type="file" multiple onChange={handleUpload} className="hidden" />
              <Button asChild size="sm" className="cursor-pointer gap-1.5">
                <span><Upload className="w-4 h-4" />Upload</span>
              </Button>
            </label>
          </div>
        }
      />

      <SlideDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        title="File Details"
        description={selectedFile?.name}
      >
        {selectedFile && (
          <div className="space-y-6">
            <div className={cn("aspect-video rounded-xl flex items-center justify-center border border-border/40 bg-muted/20", colorMap[selectedFile.type])}>
              {(() => {
                const Icon = iconMap[selectedFile.type] || FileIcon;
                return <Icon className="w-16 h-16 opacity-50" />;
              })()}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border/40 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Type</p>
                  <p className="text-sm font-medium capitalize">{selectedFile.type}</p>
                </div>
                <div className="p-3 rounded-lg border border-border/40 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Size</p>
                  <p className="text-sm font-medium">{formatSize(selectedFile.size)}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Last Modified</p>
                <p className="text-sm font-medium">{format(new Date(selectedFile.modifiedAt), "MMMM d, yyyy · h:mm a")}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 gap-2"><Download className="w-4 h-4" /> Download</Button>
                <Button variant="outline" className="flex-1 gap-2"><Share2 className="w-4 h-4" /> Share</Button>
              </div>
              
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" onClick={() => { removeFile(selectedFile.id); setDrawerOpen(false); toast.error("File deleted"); }}>
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </Button>
            </div>
          </div>
        )}
      </SlideDrawer>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((f, i) => {
            const Icon = iconMap[f.type] || FileIcon;
            return (
              <Card 
                key={f.id} 
                className="group border-border/40 hover:border-border/60 hover:shadow-elegant transition-all cursor-pointer animate-in-up"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => handleFileClick(f.id)}
              >
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300", colorMap[f.type])}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStar(f.id); }} 
                      className={cn("p-1 transition-colors", f.starred ? "text-warning" : "text-muted-foreground/30 hover:text-muted-foreground")}
                    >
                      <Star className={cn("w-3.5 h-3.5", f.starred && "fill-current")} />
                    </button>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate pr-2">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(f.size)} · {format(new Date(f.modifiedAt), "MMM d")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modified</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((f) => {
                  const Icon = iconMap[f.type] || FileIcon;
                  return (
                    <tr 
                      key={f.id} 
                      className="group hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => handleFileClick(f.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", colorMap[f.type])}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{f.name}</span>
                          {f.starred && <Star className="w-3 h-3 text-warning fill-current" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{formatSize(f.size)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(f.modifiedAt), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleFileClick(f.id); }} className="gap-2">
                              <Info className="w-4 h-4" /> Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStar(f.id); }} className="gap-2">
                              <Star className="w-4 h-4" /> {f.starred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); removeFile(f.id); toast.error("File deleted"); }} className="text-destructive gap-2">
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length === 0 && (
        <Card className="border-dashed border-border/40"><CardContent className="py-16 text-center text-muted-foreground">No files found</CardContent></Card>
      )}
    </div>
  );
}
