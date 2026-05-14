"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlideDrawer, DrawerForm } from "@/components/ui/slide-drawer";
import { InlineEdit } from "@/components/InlineEdit";
import { Plus, Folder, Calendar, CheckSquare, MessageSquare, Trash2, Activity, Milestone, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useProjects, useTasks, taskProgress, useWorkspaceProjects } from "@/store/useAppStore";
import { format, formatDistanceToNow } from "date-fns";
import type { ProjectStatus, Priority } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<ProjectStatus, string> = {
  planning: "bg-muted text-foreground",
  active: "bg-primary/15 text-primary",
  on_hold: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
};

const activityIcon = {
  note: MessageSquare,
  task: CheckSquare,
  status: Activity,
  milestone: Milestone,
};

const activityDotColor: Record<string, string> = {
  note: "bg-blue-500",
  task: "bg-green-500",
  status: "bg-orange-500",
  milestone: "bg-purple-500",
};

export default function ProjectsPage() {
  const { projects, addProject, updateProject, removeProject, addActivity } = useProjects();
  const { tasks, addTask } = useTasks();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", color: "#45B1E8", status: "active" as ProjectStatus, dueDate: "" });
  const [noteDraft, setNoteDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState({ title: "", priority: "medium" as Priority, dueDate: "" });
  const [isCreating, setIsCreating] = useState(false);

  const { unifiedProjects } = useWorkspaceProjects();
  const projectsList = projects || [];
  const tasksList = tasks || [];
  
  const selected = projectsList.find((p) => p.id === (selectedId || projectsList[0]?.id)) || projectsList[0];
  const selectedUnified = unifiedProjects.find(p => p.id === selectedId);
  const isExternal = selectedUnified?.type === "portfolio" || selectedUnified?.type === "design";

  const projectTasks = useMemo(
    () => (selected ? tasksList.filter((t) => t.projectId === selected.id) : []),
    [tasksList, selected]
  );

  const projectProgress = useMemo(() => {
    if (!projectTasks.length) return 0;
    const total = projectTasks.reduce((s, t) => s + taskProgress(t), 0);
    return Math.round(total / projectTasks.length);
  }, [projectTasks]);

  const handleCreate = async () => {
    if (!draft.name.trim()) { toast.error("Name required"); return; }
    if (isCreating) return;
    setIsCreating(true);
    try {
      addProject({
        name: draft.name.trim(),
        description: draft.description,
        color: draft.color,
        status: draft.status,
        dueDate: draft.dueDate || undefined,
      });
      toast.success("Project created");
      setDraft({ name: "", description: "", color: "#45B1E8", status: "active", dueDate: "" });
      setDrawerOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddNote = () => {
    if (!selected || !noteDraft.trim()) return;
    addActivity(selected.id, { type: "note", message: noteDraft.trim() });
    setNoteDraft("");
    toast.success("Note added to project");
  };

  const handleAddTask = () => {
    if (!selected || !taskDraft.title.trim()) { toast.error("Title required"); return; }
    addTask({
      title: taskDraft.title.trim(),
      priority: taskDraft.priority,
      status: "todo",
      dueDate: taskDraft.dueDate || undefined,
      projectId: selected.id,
      category: selected.name,
    });
    addActivity(selected.id, { type: "task", message: `Added task: "${taskDraft.title.trim()}"` });
    toast.success("Task added & linked to project");
    setTaskDraft({ title: "", priority: "medium", dueDate: "" });
    setTaskDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Plan, track activity, and link tasks across your work."
        actions={
          <Button size="sm" onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4" />New project
          </Button>
        }
      />

      {/* ── Create Project Drawer ── */}
      <SlideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Create project" description="Set up a new project workspace.">
        <DrawerForm onSubmit={handleCreate} submitLabel="Create" isSubmitting={isCreating} onCancel={() => setDrawerOpen(false)}>
          <Input placeholder="Project name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
          <Textarea placeholder="Description" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Select value={draft.status} onValueChange={(v: ProjectStatus) => setDraft({ ...draft, status: v })}>
              <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="color" className="p-1 h-9" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
          </div>
          <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
        </DrawerForm>
      </SlideDrawer>

      {/* ── Add Task to Project Drawer ── */}
      <SlideDrawer open={taskDrawerOpen} onOpenChange={setTaskDrawerOpen} title={`Add task to ${selected?.name || "project"}`}>
        <DrawerForm onSubmit={handleAddTask} submitLabel="Add task" onCancel={() => setTaskDrawerOpen(false)}>
          <Input placeholder="Task title" value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <Select value={taskDraft.priority} onValueChange={(v: Priority) => setTaskDraft({ ...taskDraft, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={taskDraft.dueDate} onChange={(e) => setTaskDraft({ ...taskDraft, dueDate: e.target.value })} />
          </div>
        </DrawerForm>
      </SlideDrawer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* ── Project List Sidebar ── */}
        <Card className="lg:col-span-1 border-border/40">
          <CardHeader><CardTitle className="text-base font-display">All projects</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {unifiedProjects.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No projects yet</p>}
            {unifiedProjects.map((p, i) => {
              const tCount = tasksList.filter((t) => t.projectId === p.id).length;
              const isExt = p.type !== "workspace";
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border animate-in-up",
                    (selectedId === p.id || (!selectedId && i === 0)) ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-muted/40"
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${p.color}22`, color: p.color }}>
                    <Folder className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isExt ? `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} Project` : `${tCount} task${tCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={cn("text-[10px]", isExt ? "bg-indigo-500/10 text-indigo-500" : statusColors[p.status as ProjectStatus])}>
                    {isExt ? "Public" : p.status.replace("_", " ")}
                  </Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Project Detail ── */}
        {selected ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Header card */}
            <Card className="border-border/40 animate-in-up overflow-hidden">
              <div className="h-2" style={{ background: selected.color }} />
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <InlineEdit
                      value={selectedUnified?.name || selected.name}
                      onSave={(val) => { updateProject(selected.id, { name: val }); toast.success("Name updated"); }}
                      className="text-xl font-display font-bold"
                      as="h2"
                    />
                    {(selectedUnified?.description || selected.description) && <CardDescription className="mt-1">{selectedUnified?.description || selected.description}</CardDescription>}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Badge variant="secondary" className={cn(isExternal ? "bg-indigo-500/10 text-indigo-500" : statusColors[selected.status])}>
                        {isExternal ? "Public Portfolio" : selected.status.replace("_", " ")}
                      </Badge>
                      {(selectedUnified?.createdAt || selected.dueDate) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {isExternal ? `Year ${new Date(selectedUnified!.createdAt).getFullYear()}` : `Due ${format(new Date(selected.dueDate!), "MMM d, yyyy")}`}
                        </span>
                      )}
                      {!isExternal && <span>· Created {formatDistanceToNow(new Date(selected.createdAt))} ago</span>}
                    </div>
                  </div>
                  {isExternal ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedUnified.link} target="_blank" rel="noopener noreferrer">View in Portfolio</a>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete project "${selected.name}"?`)) { removeProject(selected.id); toast.error("Project deleted"); } }}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              {!isExternal && (
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{projectProgress}%</span>
                    </div>
                    <Progress value={projectProgress} className="h-2" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={selected.status} onValueChange={(v: ProjectStatus) => { updateProject(selected.id, { status: v }); addActivity(selected.id, { type: "status", message: `Status changed to ${v.replace("_", " ")}` }); toast.success("Status updated"); }}>
                      <SelectTrigger className="w-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setTaskDrawerOpen(true)}>
                      <Plus className="w-4 h-4" />Add task
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* ── Tabbed Detail View: Tasks | Activity ── */}
            {!isExternal && (
              <Tabs defaultValue="tasks" className="animate-in-up stagger-1">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="tasks" className="gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />Tasks ({projectTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-1.5">
                    <Activity className="w-3.5 h-3.5" />Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4">
                  <Card className="border-border/40">
                    <CardContent className="p-4 space-y-2">
                      {projectTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No tasks linked yet</p>}
                      {projectTasks.map((t) => {
                        const prog = taskProgress(t);
                        return (
                          <div key={t.id} className="p-3 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0 animate-in-up">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full",
                                t.priority === "high" && "bg-destructive",
                                t.priority === "medium" && "bg-warning",
                                t.priority === "low" && "bg-success",
                              )} />
                              <p className={cn("text-sm font-medium flex-1 truncate", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
                              <span className="text-xs text-muted-foreground tabular-nums">{prog}%</span>
                            </div>
                            <Progress value={prog} className="h-1 mt-2" />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <Card className="border-border/40">
                    <CardContent className="p-4 space-y-4">
                      {/* Add note input */}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="What changed? (e.g. 'Reviewed design with team')"
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleAddNote(); } }}
                          className="text-sm"
                        />
                        <Button onClick={handleAddNote} className="self-stretch"><FileText className="w-4 h-4" />Log</Button>
                      </div>

                      {/* Enhanced timeline */}
                      <div className="relative space-y-0 pt-2">
                        {(selected.activities || []).map((a, i) => {
                          const Icon = activityIcon[a.type as keyof typeof activityIcon] || Activity;
                          const dotColor = activityDotColor[a.type] || "bg-muted-foreground";
                          const isLatest = i === 0;
                          return (
                            <div key={a.id} className="flex gap-3 animate-in-up group" style={{ animationDelay: `${i * 40}ms` }}>
                              <div className="flex flex-col items-center">
                                <span className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                                  isLatest
                                    ? `${dotColor} border-transparent`
                                    : "bg-muted border-border/40"
                                )}>
                                  <Icon className={cn("w-3.5 h-3.5", isLatest ? "text-white" : "text-muted-foreground")} />
                                </span>
                                {i < selected.activities.length - 1 && <span className="w-px flex-1 bg-border/40 my-1" />}
                              </div>
                              <div className="flex-1 pb-4 hover:bg-muted/20 rounded-lg px-2 py-1 -mx-2 transition-colors">
                                <p className="text-sm">{a.message}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                                  <span className="mx-1.5 text-border">·</span>
                                  {format(new Date(a.createdAt), "MMM d, h:mm a")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {(selected.activities || []).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">No activity yet — add a note above.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
            {isExternal && (
               <Card className="border-border/40 animate-in-up py-12 text-center">
                  <CardContent>
                    <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground max-w-xs mx-auto">This project is managed in your Portfolio. Workspace tracking (tasks/activity) is only available for local projects.</p>
                  </CardContent>
               </Card>
            )}
          </div>
        ) : (
          <Card className="lg:col-span-2 border-border/40 border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">Create a project to get started</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
