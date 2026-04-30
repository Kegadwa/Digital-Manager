"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, Search, Calendar as CalIcon, ChevronRight, X, Folder } from "lucide-react";
import { useTasks, useProjects, taskProgress } from "@/store/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { format, isToday, isPast } from "date-fns";
import type { Priority, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TasksPage() {
  const { tasks, addTask, toggleTask, removeTask, addSubtask, toggleSubtask, removeSubtask, updateTask } = useTasks();
  const { projects, addActivity } = useProjects();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState({
    title: "", priority: "medium" as Priority, dueDate: "",
    category: "Work", projectId: "none", description: "",
  });
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  const filtered = (tasks || []).filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = async () => {
    if (!draft.title.trim()) { toast.error("Title is required"); return; }
    if (isAdding) return;
    setIsAdding(true);
    try {
      addTask({
        title: draft.title.trim(),
        priority: draft.priority,
        status: "todo",
        dueDate: draft.dueDate || undefined,
        category: draft.category,
        projectId: draft.projectId === "none" ? undefined : draft.projectId,
        description: draft.description || undefined,
      });
      if (draft.projectId !== "none") {
        addActivity(draft.projectId, { type: "task", message: `Added task: "${draft.title.trim()}"` });
      }
      toast.success("Task created");
      setDraft({ title: "", priority: "medium", dueDate: "", category: "Work", projectId: "none", description: "" });
      setOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSub = (taskId: string) => {
    const title = (newSub[taskId] || "").trim();
    if (!title) return;
    addSubtask(taskId, title);
    setNewSub({ ...newSub, [taskId]: "" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${(tasks || []).filter((t) => t.status !== "done").length} active · ${(tasks || []).filter((t) => t.status === "done").length} completed`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4" />New task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <Input placeholder="Task title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
                <Input placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={draft.priority} onValueChange={(v: Priority) => setDraft({ ...draft, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low priority</SelectItem>
                      <SelectItem value="medium">Medium priority</SelectItem>
                      <SelectItem value="high">High priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                  <Select value={draft.projectId} onValueChange={(v) => setDraft({ ...draft, projectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {(projects || []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={isAdding}>
                  {isAdding ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="todo">Todo</TabsTrigger>
            <TabsTrigger value="in_progress">Active</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="border-dashed border-border/60"><CardContent className="py-12 text-center text-muted-foreground">No tasks found</CardContent></Card>
        )}
        {filtered.map((task, i) => {
          const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done" && !isToday(new Date(task.dueDate));
          const progress = taskProgress(task);
          const project = (projects || []).find((p) => p.id === task.projectId);
          const isOpen = expanded.has(task.id);
          const subtasks = task.subtasks || [];
          return (
            <Collapsible
              key={task.id}
              open={isOpen}
              onOpenChange={() => toggleExpand(task.id)}
            >
              <Card
                className="border-border/60 shadow-card hover:shadow-elegant transition-all group animate-in-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={task.status === "done"}
                      onCheckedChange={() => { toggleTask(task.id); toast.success(task.status === "done" ? "Task reopened" : "Task completed"); }}
                      className="shrink-0"
                    />
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-90")} />
                          <p className={cn("font-medium text-sm truncate", task.status === "done" && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-5 flex-wrap">
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-1.5 h-5",
                            task.priority === "high" && "border-destructive/50 text-destructive",
                            task.priority === "medium" && "border-warning/50 text-warning",
                            task.priority === "low" && "border-success/50 text-success",
                          )}>{task.priority}</Badge>
                          {project && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: project.color }} />
                              {project.name}
                            </Badge>
                          )}
                          {task.category && <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{task.category}</Badge>}
                          {task.dueDate && (
                            <span className={cn("text-[11px] flex items-center gap-1", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                              <CalIcon className="w-3 h-3" />
                              {isToday(new Date(task.dueDate)) ? "Today" : format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}
                          {subtasks.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              {subtasks.filter((s) => s.done).length}/{subtasks.length}
                            </span>
                          )}
                        </div>
                        {(subtasks.length > 0 || task.status === "in_progress") && (
                          <div className="ml-5 mt-2 flex items-center gap-2">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right">{progress}%</span>
                          </div>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => { removeTask(task.id); toast.error("Task deleted"); }} aria-label="Delete task">
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>

                  <CollapsibleContent className="mt-3 ml-8 pl-3 border-l border-border space-y-2 animate-in-up">
                    {task.description && (
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    )}
                    {subtasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 group/sub">
                        <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(task.id, s.id)} />
                        <span className={cn("text-sm flex-1", s.done && "line-through text-muted-foreground")}>{s.title}</span>
                        <button onClick={() => removeSubtask(task.id, s.id)} className="opacity-0 group-hover/sub:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Add a subtask…"
                        className="h-8 text-sm"
                        value={newSub[task.id] || ""}
                        onChange={(e) => setNewSub({ ...newSub, [task.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSub(task.id)}
                      />
                      <Button size="sm" variant="outline" onClick={() => handleAddSub(task.id)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
