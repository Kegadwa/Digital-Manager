"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Wallet, StickyNote, FileText, Plus, ArrowRight, Clock, Sparkles, Folder, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useTasks, useTransactions, useNotes, useFiles, useProjects, taskProgress } from "@/store/useAppStore";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { format, isToday, isThisMonth, subMonths, startOfMonth } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

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

  const upcomingTasks = useMemo(
    () => (tasks || []).filter((t) => t.status !== "done").slice(0, 5),
    [tasks]
  );

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Net income" value={`$${stats.net.toLocaleString()}`} icon={Wallet} accent={stats.net >= 0 ? "success" : "destructive"} delta={{ value: `${Math.abs(stats.expenseDelta).toFixed(0)}%`, positive: stats.expenseDelta < 0 }} />
        <StatCard label="Tasks done" value={`${stats.completionRate}%`} icon={CheckSquare} accent="primary" delta={{ value: `${stats.completed}`, positive: true }} />
        <StatCard label="Projects" value={`${(projects || []).filter((p) => p.status === "active").length}`} icon={Folder} accent="primary" />
        <StatCard label="Notes" value={`${(notes || []).length}`} icon={StickyNote} accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 chart-3d animate-in-up">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                Cashflow
                {trendIsUp ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              </CardTitle>
              <CardDescription>Income vs expenses, last 6 months</CardDescription>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex"><Sparkles className="w-3 h-3 mr-1" />Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] sm:h-[300px] -ml-2">
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
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#incomeG)" animationDuration={1100} />
                  <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2.5} fill="url(#expenseG)" animationDuration={1100} animationBegin={200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60 animate-in-up stagger-1">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-lg font-display">Today's tasks</CardTitle>
              <CardDescription>{upcomingTasks.length} pending</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/tasks">All</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
                <span className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <p className="text-sm">All caught up</p>
              </div>
            )}
            {upcomingTasks.map((task, i) => {
              const prog = taskProgress(task);
              return (
                <div
                  key={task.id}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group animate-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <button onClick={() => toggleTask(task.id)} aria-label="Toggle" className={cn(
                    "w-4 h-4 mt-0.5 rounded border-2 shrink-0 transition-colors",
                    task.status === "done" ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium truncate", task.status === "done" && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0 h-4",
                        task.priority === "high" && "border-destructive/40 text-destructive",
                        task.priority === "medium" && "border-warning/40 text-warning",
                        task.priority === "low" && "border-success/40 text-success",
                      )}>
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {isToday(new Date(task.dueDate)) ? "Today" : format(new Date(task.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>
                    {( (task.subtasks?.length || 0) > 0 || task.status === "in_progress") && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={prog} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{prog}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 shadow-card border-border/60 animate-in-up">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-lg font-display">Active projects</CardTitle>
              <CardDescription>Where momentum is building</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/projects">All</Link></Button>
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
                  className="block p-4 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all group animate-in-up"
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
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={prog} className="h-1.5 flex-1" />
                    <span className="text-xs font-semibold tabular-nums w-9 text-right">{prog}%</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60 animate-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-lg font-display">Monthly goals</CardTitle>
            <CardDescription>Your progress this month</CardDescription>
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
