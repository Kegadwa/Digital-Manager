"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useTasks, useTransactions, useProjects, taskProgress } from "@/store/useAppStore";
import { Activity, Target, Zap, TrendingUp, TrendingDown, Folder } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Sector } from "recharts";
import { format, subDays, eachDayOfInterval, isThisMonth, subMonths, startOfMonth } from "date-fns";
import { FrostedTooltip } from "@/components/ChartTooltip";

const renderActivePie = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10}
              startAngle={startAngle} endAngle={endAngle} fill={fill}
              style={{ filter: `drop-shadow(0 6px 12px ${fill}66)` }} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 14}
              startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground font-display font-bold" style={{ fontSize: 22 }}>
        {payload.value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
        {payload.name}
      </text>
    </g>
  );
};

export default function AnalyticsPage() {
  const { tasks } = useTasks();
  const { transactions } = useTransactions();
  const { projects } = useProjects();
  const [activePie, setActivePie] = useState(0);

  const tasksList = tasks || [];
  const transactionsList = transactions || [];
  const projectsList = projects || [];

  const productivityData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map((d) => {
      const k = format(d, "yyyy-MM-dd");
      const completed = tasksList.filter((t) => t.status === "done" && t.dueDate?.startsWith(k)).length;
      const created = tasksList.filter((t) => (t.createdAt || "").startsWith(k)).length;
      return { day: format(d, "MMM d"), completed, created, score: Math.min(100, completed * 18 + created * 6) };
    });
  }, [tasksList]);

  const completionRate = tasksList.length ? Math.round((tasksList.filter((t) => t.status === "done").length / tasksList.length) * 100) : 0;
  const radialData = [{ name: "Completion", value: completionRate, fill: "hsl(var(--primary))" }];

  const priorityDist = useMemo(() => [
    { name: "High", value: tasksList.filter((t) => t.priority === "high").length, fill: "hsl(var(--destructive))" },
    { name: "Medium", value: tasksList.filter((t) => t.priority === "medium").length, fill: "hsl(var(--warning))" },
    { name: "Low", value: tasksList.filter((t) => t.priority === "low").length, fill: "hsl(var(--success))" },
  ].filter(d => d.value > 0), [tasksList]);

  const projectProgress = useMemo(() => {
    return projectsList.map((p) => {
      const linked = tasksList.filter((t) => t.projectId === p.id);
      const avg = linked.length ? Math.round(linked.reduce((s, t) => s + taskProgress(t), 0) / linked.length) : 0;
      return { name: p.name, value: avg, color: p.color };
    });
  }, [projectsList, tasksList]);

  const cashflowDelta = useMemo(() => {
    const monthExpense = transactionsList.filter((t) => t.type === "expense" && isThisMonth(new Date(t.date))).reduce((s, t) => s + t.amount, 0);
    const lastExpense = transactionsList.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d >= startOfMonth(subMonths(new Date(), 1)) && d < startOfMonth(new Date());
    }).reduce((s, t) => s + t.amount, 0);
    return lastExpense ? ((monthExpense - lastExpense) / lastExpense) * 100 : 0;
  }, [transactionsList]);

  const expenseUp = cashflowDelta > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Insights across productivity, projects, and money." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Productivity" value={`${completionRate}%`} icon={Zap} accent="primary" />
        <StatCard label="Active streak" value="7 days" icon={Activity} accent="success" />
        <StatCard label="Goals hit" value={`${tasksList.filter((t) => t.status === "done").length}`} icon={Target} accent="warning" />
        <StatCard
          label="Spend trend"
          value={`${expenseUp ? "+" : ""}${cashflowDelta.toFixed(0)}%`}
          icon={expenseUp ? TrendingUp : TrendingDown}
          accent={expenseUp ? "destructive" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 chart-3d animate-in-up">
          <CardHeader>
            <CardTitle className="text-lg">Productivity score</CardTitle>
            <CardDescription>Daily focus over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="prodG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                      <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<FrostedTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#prodG)" animationDuration={1400} filter="url(#glow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-3d animate-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-lg">Completion</CardTitle>
            <CardDescription>Overall task progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="62%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                  <defs>
                    <linearGradient id="radG" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                    </linearGradient>
                  </defs>
                  <RadialBar dataKey="value" cornerRadius={20} fill="url(#radG)" background={{ fill: "hsl(var(--muted))" }} animationDuration={1600} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-display font-bold" style={{ fontSize: "32px" }}>
                    {completionRate}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="chart-3d animate-in-up">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Folder className="w-4 h-4" />Project progress</CardTitle>
            <CardDescription>Average completion across linked tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {projectProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No projects yet</p>
            ) : (
              <div className="h-[260px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectProgress} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<FrostedTooltip formatter={(v) => `${v}%`} />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1300}>
                      {projectProgress.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="chart-3d animate-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-lg">Priority breakdown</CardTitle>
            <CardDescription>How you prioritize work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {priorityDist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No tasks yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      {...({
                        data: priorityDist, dataKey: "value", nameKey: "name",
                        cx: "50%", cy: "50%", innerRadius: 62, outerRadius: 92, paddingAngle: 3,
                        activeIndex: activePie, activeShape: renderActivePie,
                        onMouseEnter: (_: any, i: number) => setActivePie(i),
                        animationDuration: 1300,
                      } as any)}
                    >
                      {priorityDist.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
