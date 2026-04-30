"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useTasks, useProjects } from "@/store/useAppStore";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

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

  const selectedTasks = tasksByDay[format(selected, "yyyy-MM-dd")] || [];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 shadow-card border-border/60 animate-in-up">
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
                return (
                  <button
                    key={k}
                    onClick={() => setSelected(d)}
                    className={cn(
                      "aspect-square sm:aspect-auto sm:min-h-[72px] p-1.5 sm:p-2 rounded-lg text-left transition-all border animate-in-up",
                      inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground/50",
                      isSelected ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-border",
                    )}
                    style={{ animationDelay: `${Math.min(idx * 8, 200)}ms` }}
                  >
                    <div className={cn(
                      "text-xs sm:text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                      today && "bg-primary text-primary-foreground"
                    )}>{format(d, "d")}</div>
                    <div className="mt-1 hidden sm:flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div key={t.id} className={cn(
                          "h-1.5 rounded-full w-full",
                          t.priority === "high" && "bg-destructive",
                          t.priority === "medium" && "bg-warning",
                          t.priority === "low" && "bg-success",
                        )} />
                      ))}
                      {dayTasks.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3}</span>}
                    </div>
                    {dayTasks.length > 0 && <div className="sm:hidden mt-1 w-1 h-1 rounded-full bg-primary mx-auto" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60 animate-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-base font-display">{format(selected, "EEEE, MMM d")}</CardTitle>
            <CardDescription>{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nothing scheduled</p>
            ) : (
              selectedTasks.map((t, i) => {
                const project = projectsList.find((p) => p.id === t.projectId);
                return (
                  <div key={t.id} className="p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors animate-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        t.priority === "high" && "bg-destructive",
                        t.priority === "medium" && "bg-warning",
                        t.priority === "low" && "bg-success",
                      )} />
                      <p className={cn("text-sm font-medium flex-1 truncate", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
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
