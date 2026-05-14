"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlideDrawer } from "@/components/ui/slide-drawer";
import { ChevronLeft, ChevronRight, Folder, CalendarDays, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useTasks, useProjects } from "@/store/useAppStore";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

const priorityColor = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
};

export default function CalendarPage() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);

  const tasksList = tasks || [];
  const projectsList = projects || [];

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasksList> = {};
    tasksList.forEach((t) => {
      if (!t.dueDate) return;
      const k = format(new Date(t.dueDate), "yyyy-MM-dd");
      (map[k] ||= []).push(t);
    });
    return map;
  }, [tasksList]);

  // Heatmap intensity for the month
  const maxTasks = useMemo(
    () => Math.max(...Object.values(tasksByDay).map((t) => t.length), 1),
    [tasksByDay]
  );

  const selectedTasks = tasksByDay[format(selected, "yyyy-MM-dd")] || [];
  const drawerTasks = drawerDate ? tasksByDay[format(drawerDate, "yyyy-MM-dd")] || [] : [];

  const handleDayClick = (d: Date) => {
    setSelected(d);
    const k = format(d, "yyyy-MM-dd");
    const dayTasks = tasksByDay[k] || [];
    if (dayTasks.length > 0) {
      setDrawerDate(d);
      setDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="All tasks and project deadlines in one view."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Previous"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-display font-semibold text-sm sm:text-base min-w-[120px] text-center">{format(cursor, "MMMM yyyy")}</span>
            <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next"><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { setCursor(new Date()); setSelected(new Date()); }}>Today</Button>
          </div>
        }
      />

      {/* ── Day Detail Drawer ── */}
      <SlideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={drawerDate ? format(drawerDate, "EEEE, MMMM d") : ""}
        description={`${drawerTasks.length} task${drawerTasks.length !== 1 ? "s" : ""} scheduled`}
      >
        <div className="space-y-3">
          {drawerTasks.map((t, i) => {
            const project = projectsList.find((p) => p.id === t.projectId);
            return (
              <div key={t.id} className="p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors animate-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", priorityColor[t.priority as keyof typeof priorityColor] || "bg-muted")} />
                  <p className={cn("text-sm font-medium flex-1", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
                  <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
                </div>
                {(project || t.category) && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-4">
                    {project && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Folder className="w-2.5 h-2.5" style={{ color: project.color }} />
                        {project.name}
                      </Badge>
                    )}
                    {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SlideDrawer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* ── Calendar Grid ── */}
        <Card className="lg:col-span-2 border-border/40 animate-in-up">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-[10px] sm:text-xs font-semibold text-muted-foreground text-center py-2 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, idx) => {
                const k = format(d, "yyyy-MM-dd");
                const dayTasks = tasksByDay[k] || [];
                const inMonth = isSameMonth(d, cursor);
                const today = isToday(d);
                const isSelected = isSameDay(d, selected);
                const intensity = dayTasks.length / maxTasks;
                return (
                  <button
                    key={k}
                    onClick={() => handleDayClick(d)}
                    className={cn(
                      "aspect-square sm:aspect-auto sm:min-h-[72px] p-1.5 sm:p-2 rounded-lg text-left transition-all border animate-in-up relative",
                      inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground/40",
                      isSelected ? "border-primary ring-1 ring-primary/50" : "border-transparent hover:border-border/60",
                    )}
                    style={{ animationDelay: `${Math.min(idx * 8, 200)}ms` }}
                  >
                    {/* Heatmap background */}
                    {dayTasks.length > 0 && inMonth && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{ background: `hsl(var(--primary) / ${0.04 + intensity * 0.12})` }}
                      />
                    )}
                    <div className={cn(
                      "text-xs sm:text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full relative",
                      today && "bg-primary text-primary-foreground"
                    )}>{format(d, "d")}</div>
                    {/* Desktop: priority-colored dots */}
                    <div className="mt-1 hidden sm:flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div key={t.id} className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          priorityColor[t.priority as keyof typeof priorityColor] || "bg-muted-foreground",
                        )} />
                      ))}
                      {dayTasks.length > 3 && <span className="text-[9px] text-muted-foreground leading-none ml-0.5">+{dayTasks.length - 3}</span>}
                    </div>
                    {/* Mobile: single dot indicator */}
                    {dayTasks.length > 0 && <div className="sm:hidden mt-1 w-1.5 h-1.5 rounded-full bg-primary mx-auto" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Sidebar: day detail ── */}
        <Card className="border-border/40 animate-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {format(selected, "EEEE, MMM d")}
            </CardTitle>
            <CardDescription>{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedTasks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Nothing scheduled</p>
              </div>
            ) : (
              selectedTasks.map((t, i) => {
                const project = projectsList.find((p) => p.id === t.projectId);
                return (
                  <div key={t.id} className="p-3 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0 animate-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", priorityColor[t.priority as keyof typeof priorityColor] || "bg-muted")} />
                      <p className={cn("text-sm font-medium flex-1 truncate", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2 ml-4">
                      {project && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Folder className="w-2.5 h-2.5" style={{ color: project.color }} />
                          {project.name}
                        </Badge>
                      )}
                      {t.category && <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
