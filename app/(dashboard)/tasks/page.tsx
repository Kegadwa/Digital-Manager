"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SlideDrawer, DrawerForm } from "@/components/ui/slide-drawer";
import { InlineEdit } from "@/components/InlineEdit";
import {
  Plus, Trash2, Search, Calendar as CalIcon, ChevronRight, X, Folder,
  LayoutList, Kanban as KanbanIcon, GripVertical,
} from "lucide-react";
import { useTasks, useProjects, taskProgress } from "@/store/useAppStore";
import { PageHeader } from "@/components/PageHeader";
import { format, isToday, isPast } from "date-fns";
import type { Priority, TaskStatus, Task } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

/* ─── Kanban Column ─── */
function KanbanColumn({
  title,
  status,
  tasks: columnTasks,
  projects,
  onToggle,
  onRemove,
}: {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  projects: any[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[320px] rounded-xl p-3 transition-colors border border-border/30",
        isOver ? "bg-primary/5 border-primary/30" : "bg-muted/20"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
          {columnTasks.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {columnTasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            projects={projects}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Kanban Card (draggable) ─── */
function KanbanCard({
  task,
  projects,
  onToggle,
  onRemove,
}: {
  task: Task;
  projects: any[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const project = projects.find((p: any) => p.id === task.projectId);
  const progress = taskProgress(task);
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-lg bg-card border border-border/40 hover:border-border/60 transition-all group cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg scale-[1.02]"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.status === "done"}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium truncate",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 h-4",
                task.priority === "high" && "border-destructive/50 text-destructive",
                task.priority === "medium" && "border-warning/50 text-warning",
                task.priority === "low" && "border-success/50 text-success"
              )}
            >
              {task.priority}
            </Badge>
            {project && (
              <Badge variant="secondary" className="text-[9px] px-1 h-4 gap-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: project.color }}
                />
                {project.name}
              </Badge>
            )}
          </div>
          {progress > 0 && progress < 100 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Progress value={progress} className="h-1 flex-1" />
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {progress}%
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(task.id);
            toast.error("Task deleted");
          }}
        >
          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TasksPage() {
  const { tasks, addTask, toggleTask, removeTask, addSubtask, toggleSubtask, removeSubtask, updateTask } = useTasks();
  const { projects, addActivity } = useProjects();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState({
    title: "", priority: "medium" as Priority, dueDate: "",
    category: "Work", projectId: "none", description: "",
  });
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Inline add state
  const [inlineValue, setInlineValue] = useState("");
  const [inlineFocused, setInlineFocused] = useState(false);

  // Kanban drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filtered = (tasks || []).filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Kanban columns
  const todoTasks = filtered.filter((t) => t.status === "todo");
  const activeTasks = filtered.filter((t) => t.status === "in_progress");
  const doneTasks = filtered.filter((t) => t.status === "done");

  const handleDrawerAdd = async () => {
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
      setDrawerOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleInlineAdd = () => {
    const title = inlineValue.trim();
    if (!title) return;
    addTask({ title, priority: "medium", status: "todo" });
    toast.success("Task created");
    setInlineValue("");
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

  // Kanban drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (["todo", "in_progress", "done"].includes(newStatus)) {
      const task = (tasks || []).find((t) => t.id === taskId);
      if (task && task.status !== newStatus) {
        updateTask(taskId, { status: newStatus });
        toast.success(`Moved to ${newStatus === "in_progress" ? "Active" : newStatus === "todo" ? "Todo" : "Done"}`);
      }
    }
  };

  const activeTask = activeId ? (tasks || []).find((t) => t.id === activeId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${(tasks || []).filter((t) => t.status !== "done").length} active · ${(tasks || []).filter((t) => t.status === "done").length} completed`}
        actions={
          <Button size="sm" onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4" />New task
          </Button>
        }
      />

      {/* ── Slide Drawer for New Task ── */}
      <SlideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Create task"
        description="Add a new task to your workspace."
      >
        <DrawerForm
          onSubmit={handleDrawerAdd}
          submitLabel="Create"
          isSubmitting={isAdding}
          onCancel={() => setDrawerOpen(false)}
        >
          <Input
            placeholder="Task title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            autoFocus
          />
          <Input
            placeholder="Description (optional)"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
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
        </DrawerForm>
      </SlideDrawer>

      {/* ── Filters + View Toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="todo">Todo</TabsTrigger>
            <TabsTrigger value="in_progress">Active</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
          {/* View Toggle */}
          <div className="flex items-center border border-border/60 rounded-lg p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("board")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                view === "board" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Board view"
            >
              <KanbanIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="space-y-0">
          {/* Inline Add Row */}
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed transition-all mb-1",
              inlineFocused
                ? "border-primary/40 bg-primary/5"
                : "border-border/30 hover:border-border/50 hover:bg-muted/20"
            )}
          >
            <Plus className={cn("w-4 h-4 shrink-0 transition-colors", inlineFocused ? "text-primary" : "text-muted-foreground")} />
            <Input
              placeholder="Add new task…"
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value)}
              onFocus={() => setInlineFocused(true)}
              onBlur={() => setInlineFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleInlineAdd()}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0 text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">No tasks found</div>
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
                <div
                  className="rounded-lg hover:bg-muted/40 transition-all group animate-in-up border-b border-border/20 last:border-b-0"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Checkbox
                      checked={task.status === "done"}
                      onCheckedChange={() => { toggleTask(task.id); toast.success(task.status === "done" ? "Task reopened" : "Task completed"); }}
                      className="shrink-0"
                    />
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-90")} />
                          <InlineEdit
                            value={task.title}
                            onSave={(val) => updateTask(task.id, { title: val })}
                            className={cn("font-medium text-sm", task.status === "done" && "line-through text-muted-foreground")}
                            as="span"
                          />
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

                  <CollapsibleContent className="px-4 pb-3 ml-8 pl-3 border-l border-border space-y-2 animate-in-up">
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
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* ── BOARD (KANBAN) VIEW ── */}
      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KanbanColumn
              title="Todo"
              status="todo"
              tasks={todoTasks}
              projects={projects || []}
              onToggle={toggleTask}
              onRemove={removeTask}
            />
            <KanbanColumn
              title="Active"
              status="in_progress"
              tasks={activeTasks}
              projects={projects || []}
              onToggle={toggleTask}
              onRemove={removeTask}
            />
            <KanbanColumn
              title="Done"
              status="done"
              tasks={doneTasks}
              projects={projects || []}
              onToggle={toggleTask}
              onRemove={removeTask}
            />
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="p-3 rounded-lg bg-card border border-primary/30 shadow-xl w-64 opacity-90">
                <p className="text-sm font-medium truncate">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
