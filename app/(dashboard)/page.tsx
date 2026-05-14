"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckSquare, Wallet, StickyNote, FileText, Plus, ArrowRight, Clock, Sparkles,
  Folder, TrendingUp, TrendingDown, Zap, Target, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useTasks, useTransactions, useNotes, useFiles, useProjects, taskProgress } from "@/store/useAppStore";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { format, isToday, isThisMonth, subMonths, startOfMonth } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { parseOmniInput, matchProject } from "@/utils/parseOmniInput";
import { toast } from "sonner";

/* ─── Quick Capture Widget ─── */
function QuickCapture() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const { addTask } = useTasks();
  const { addNote } = useNotes();
  const { projects, addActivity } = useProjects();

  const handleSubmit = () => {
    const input = value.trim();
    if (!input) return;

    // If starts with // → create a note
    if (input.startsWith("//")) {
      addNote({ title: input.slice(2).trim(), content: "", tags: [], pinned: false });
      toast.success("Note captured");
    } else {
      // Parse as task with NLP
      const parsed = parseOmniInput(input);
      const projectId = matchProject(parsed.projectTag || "", projects || []);
      addTask({
        title: parsed.title,
        priority: parsed.priority,
        status: "todo",
        dueDate: parsed.dueDate,
        projectId,
        category: parsed.category,
      });
      if (projectId) {
        addActivity(projectId, { type: "task", message: `Quick-added: "${parsed.title}"` });
      }
      toast.success("Task captured");
    }

    setValue("");
  };

  return (
    <Card className={cn(
      "bg-gradient-to-br from-white/[0.04] to-transparent border-border/40 transition-all duration-300",
      focused && "border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb,59,130,246),0.08)]"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Capture</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
          focused ? "border-primary/40 bg-primary/5" : "border-border/40 bg-muted/20 hover:border-border/60"
        )}>
          <Plus className={cn("w-4 h-4 shrink-0 transition-colors", focused ? "text-primary" : "text-muted-foreground/50")} />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Add task, or // for notes…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground/40"
          />
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2">
          Press <kbd className="bg-muted px-1 rounded text-[9px]">C</kbd> anywhere for OmniAdd
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Today's Focus Widget ─── */
function TodaysFocus() {
  const { tasks, toggleTask } = useTasks();
  const { projects } = useProjects();
  const focusTasks = useMemo(
    () => (tasks || []).filter((t) => t.status !== "done").slice(0, 4),
    [tasks]
  );

  return (
    <Card className="border-border/40 h-full">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Today&apos;s Focus
          </CardTitle>
          <CardDescription className="text-xs">{focusTasks.length} items to tackle</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
          <Link href="/tasks">All <ChevronRight className="w-3 h-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {focusTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
            <span className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </span>
            <p className="text-sm">All caught up!</p>
          </div>
        )}
        {focusTasks.map((task, i) => {
          const prog = taskProgress(task);
          const project = (projects || []).find((p) => p.id === task.projectId);
          const subtaskCount = task.subtasks?.length || 0;
          const subtaskDone = task.subtasks?.filter((s) => s.done).length || 0;

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group animate-in-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={() => { toggleTask(task.id); toast.success("Done!"); }}
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className={cn(
                    "text-[9px] px-1 h-4",
                    task.priority === "high" && "border-destructive/40 text-destructive",
                    task.priority === "medium" && "border-warning/40 text-warning",
                    task.priority === "low" && "border-success/40 text-success",
                  )}>
                    {task.priority}
                  </Badge>
                  {project && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: project.color }} />
                      {project.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {isToday(new Date(task.dueDate)) ? "Today" : format(new Date(task.dueDate), "MMM d")}
                    </span>
                  )}
                </div>
                {(subtaskCount > 0 || task.status === "in_progress") && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={prog} className="h-1 flex-1" />
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {subtaskCount > 0 ? `${subtaskDone}/${subtaskCount}` : `${prog}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const { tasks, toggleTask } = useTasks();
  const { transactions } = useTransactions();
  const { notes } = useNotes();
  const { files } = useFiles();
  const { projects } = useProjects();

  const stats = useMemo(() => {
    const txList = transactions || [];
    const taskList = tasks || [];
    
    const monthTx = txList.filter((t) => isThisMonth(new Date(t.date)));
    const lastMonthTx = txList.filter((t) => {
      const d = new Date(t.date);
      const last = subMonths(new Date(), 1);
      return d >= startOfMonth(last) && d < startOfMonth(new Date());
    });
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const lastExpense = lastMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const expenseDelta = lastExpense ? ((expense - lastExpense) / lastExpense) * 100 : 0;

    const completed = taskList.filter((t) => t.status === "done").length;
    const completionRate = taskList.length ? Math.round((completed / taskList.length) * 100) : 0;

    return { income, expense, expenseDelta, completionRate, completed, net: income - expense };
  }, [transactions, tasks]);

  const cashflowData = useMemo(() => {
    const txList = transactions || [];
    const buckets: Record<string, { month: string; income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "MMM");
      buckets[key] = { month: key, income: 0, expense: 0 };
    }
    txList.forEach((t) => {
      const key = format(new Date(t.date), "MMM");
      if (buckets[key]) buckets[key][t.type] += t.amount;
    });
    return Object.values(buckets);
  }, [transactions]);

  const trendIsUp = useMemo(() => {
    const last = cashflowData[cashflowData.length - 1];
    const prev = cashflowData[cashflowData.length - 2];
    if (!last || !prev) return true;
    return (last.income - last.expense) >= (prev.income - prev.expense);
  }, [cashflowData]);

  const activeProjects = useMemo(() => (projects || []).filter((p) => p.status === "active").slice(0, 4), [projects]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 backdrop-blur px-2.5 py-1 rounded-full border border-border/60">
            <Sparkles className="w-3 h-3 text-primary" /> Today
          </span>
        }
        title="Welcome back, Keith Kiptum"
        description="Here's what's happening across your workspace."
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/projects">View projects <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/tasks"><Plus className="w-4 h-4" />Quick add</Link>
            </Button>
          </>
        }
      />

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Net income" value={`$${stats.net.toLocaleString()}`} icon={Wallet} accent={stats.net >= 0 ? "success" : "destructive"} delta={{ value: `${Math.abs(stats.expenseDelta).toFixed(0)}%`, positive: stats.expenseDelta < 0 }} />
        <StatCard label="Tasks done" value={`${stats.completionRate}%`} icon={CheckSquare} accent="primary" delta={{ value: `${stats.completed}`, positive: true }} />
        <StatCard label="Projects" value={`${(projects || []).filter((p) => p.status === "active").length}`} icon={Folder} accent="primary" />
        <StatCard label="Notes" value={`${(notes || []).length}`} icon={StickyNote} accent="warning" />
      </div>

      {/* ── Bento Grid: Row 1 — Cashflow + Quick Capture + Today's Focus ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Cashflow chart — spans 2 cols */}
        <Card className="lg:col-span-2 chart-3d animate-in-up border-border/40">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-display flex items-center gap-2">
                Cashflow
                {trendIsUp ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              </CardTitle>
              <CardDescription className="text-xs">Income vs expenses, last 6 months</CardDescription>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px]"><Sparkles className="w-3 h-3 mr-1" />Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={45} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#incomeG)" animationDuration={1100} />
                  <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#expenseG)" animationDuration={1100} animationBegin={200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Capture + Today's Focus — stacked in 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-5">
          <QuickCapture />
          <TodaysFocus />
        </div>
      </div>

      {/* ── Bento Grid: Row 2 — Active Projects + Monthly Goals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Card className="lg:col-span-2 border-border/40 animate-in-up">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-display">Active projects</CardTitle>
              <CardDescription className="text-xs">Where momentum is building</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs"><Link href="/projects">All</Link></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeProjects.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center sm:col-span-2">No active projects yet</p>}
            {activeProjects.map((p, i) => {
              const linked = (tasks || []).filter((t) => t.projectId === p.id);
              const prog = linked.length ? Math.round(linked.reduce((s, t) => s + taskProgress(t), 0) / linked.length) : 0;
              return (
                <Link
                  key={p.id}
                  href="/projects"
                  className="block p-3.5 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all group animate-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${p.color}22`, color: p.color }}>
                      <Folder className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{linked.length} task{linked.length !== 1 && "s"}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Progress value={prog} className="h-1.5 flex-1" />
                    <span className="text-xs font-semibold tabular-nums w-9 text-right">{prog}%</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/40 animate-in-up stagger-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Monthly goals</CardTitle>
            <CardDescription className="text-xs">Your progress this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Tasks completed</span><span className="font-semibold">{stats.completionRate}%</span></div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Budget used</span><span className="font-semibold">${stats.expense.toFixed(0)}</span></div>
              <Progress value={Math.min(100, (stats.expense / 3500) * 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Notes captured</span><span className="font-semibold">{(notes || []).length}</span></div>
              <Progress value={Math.min(100, (notes || []).length * 10)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
