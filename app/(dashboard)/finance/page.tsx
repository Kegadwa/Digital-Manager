"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowDownRight, ArrowUpRight, Wallet, PiggyBank, Download, CreditCard, Tag, Search, HandCoins, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { PaymentCard, AddCardTile } from "@/components/PaymentCard";
import { FrostedTooltip } from "@/components/ChartTooltip";
import { useTransactions, useCategories, usePaymentMethods, useLoans } from "@/store/useAppStore";
import { format, isThisMonth, subMonths, startOfMonth } from "date-fns";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Sector } from "recharts";
import type { TransactionType, CardBrand, Loan } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";

const renderActivePie = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
              startAngle={startAngle} endAngle={endAngle} fill={fill}
              style={{ filter: `drop-shadow(0 6px 12px ${fill}55)` }} />
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground font-display font-bold" style={{ fontSize: 18 }}>
        ${payload.value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
        {payload.name}
      </text>
    </g>
  );
};

export default function FinancePage() {
  const { transactions, addTransaction, removeTransaction } = useTransactions();
  const { categories, addCategory, removeCategory } = useCategories();
  const { methods, addMethod, removeMethod } = usePaymentMethods();
  const { loans, addLoan, removeLoan, repayLoan } = useLoans();
  const loansList = loans || [];

  const transactionsList = transactions || [];
  const categoriesList = categories || [];
  const methodsList = methods || [];

  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [activePie, setActivePie] = useState(0);
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month" | "year">("month");
  const [loanOpen, setLoanOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txOpen, setTxOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);

  const [draft, setDraft] = useState({
    type: "expense" as TransactionType,
    amount: "",
    categoryId: "",
    methodId: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const [catDraft, setCatDraft] = useState({ name: "", type: "expense" as TransactionType, color: "#45B1E8" });
  const [methodDraft, setMethodDraft] = useState({
    name: "", type: "card" as "cash" | "card" | "bank" | "wallet",
    color: "#0b1f3a", holder: "", expiry: "", brand: "visa" as CardBrand,
    balance: "", cardNumber: "", cvc: ""
  });
  const [loanDraft, setLoanDraft] = useState({ lender: "", principal: "", totalRepayable: "", date: format(new Date(), "yyyy-MM-dd") });
  const [repayDraft, setRepayDraft] = useState({ amount: "", methodId: "", categoryId: "" });

  const timeframeData = useMemo(() => {
    const now = new Date();
    let currentTx = transactionsList;
    let lastTx = transactionsList;

    if (timeframe === "today") {
      currentTx = transactionsList.filter(t => new Date(t.date).toDateString() === now.toDateString());
      lastTx = transactionsList.filter(t => new Date(t.date).toDateString() === new Date(now.getTime() - 86400000).toDateString());
    } else if (timeframe === "week") {
      currentTx = transactionsList.filter(t => now.getTime() - new Date(t.date).getTime() < 7 * 86400000);
      lastTx = transactionsList.filter(t => {
        const diff = now.getTime() - new Date(t.date).getTime();
        return diff >= 7 * 86400000 && diff < 14 * 86400000;
      });
    } else if (timeframe === "year") {
      currentTx = transactionsList.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
      lastTx = transactionsList.filter(t => new Date(t.date).getFullYear() === now.getFullYear() - 1);
    } else {
      currentTx = transactionsList.filter((t) => isThisMonth(new Date(t.date)));
      lastTx = transactionsList.filter((t) => {
        const d = new Date(t.date);
        const last = subMonths(now, 1);
        return d >= startOfMonth(last) && d < startOfMonth(now);
      });
    }

    const income = currentTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = currentTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const lastIncome = lastTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const lastExpense = lastTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return {
      income, expense, savings: income - expense,
      incomeDelta: lastIncome ? ((income - lastIncome) / lastIncome) * 100 : (income > 0 ? 100 : 0),
      expenseDelta: lastExpense ? ((expense - lastExpense) / lastExpense) * 100 : (expense > 0 ? 100 : 0),
    };
  }, [transactionsList, timeframe]);

  const expenseByCat = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    transactionsList.filter((t) => {
      if (t.type !== "expense") return false;
      const d = new Date(t.date);
      const now = new Date();
      if (timeframe === "today") return d.toDateString() === now.toDateString();
      if (timeframe === "week") return now.getTime() - d.getTime() < 7 * 86400000;
      if (timeframe === "year") return d.getFullYear() === now.getFullYear();
      return isThisMonth(d);
    }).forEach((t) => {
      const cat = categoriesList.find((c) => c.id === t.categoryId);
      const name = cat?.name || "Other";
      if (!map[name]) map[name] = { name, value: 0, color: cat?.color || "#94a3b8" };
      map[name].value += t.amount;
    });
    return Object.values(map);
  }, [transactionsList, categoriesList, timeframe]);

  const trendData = useMemo(() => {
    const buckets: Record<string, { month: string; income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const k = format(d, "MMM");
      buckets[k] = { month: k, income: 0, expense: 0 };
    }
    transactionsList.forEach((t) => {
      const k = format(new Date(t.date), "MMM");
      if (buckets[k]) buckets[k][t.type] += t.amount;
    });
    return Object.values(buckets);
  }, [transactionsList]);

  const filtered = useMemo(() => {
    return transactionsList.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (filterCategory !== "all" && t.categoryId !== filterCategory) return false;
      if (filterMethod !== "all" && t.methodId !== filterMethod) return false;
      if (search) {
        const cat = categoriesList.find((c) => c.id === t.categoryId);
        const hay = `${t.description || ""} ${cat?.name || ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [transactionsList, filter, filterCategory, filterMethod, search, categoriesList]);

  const handleAdd = () => {
    const amt = parseFloat(draft.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!draft.categoryId) { toast.error("Pick a category"); return; }
    addTransaction({
      type: draft.type, amount: amt, categoryId: draft.categoryId,
      methodId: draft.methodId || undefined, description: draft.description,
      date: new Date(draft.date).toISOString(),
    });
    toast.success(`${draft.type === "income" ? "Income" : "Expense"} added`);
    setDraft({ type: "expense", amount: "", categoryId: "", methodId: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
    setOpen(false);
  };

  const handleAddCategory = () => {
    if (!catDraft.name.trim()) { toast.error("Name required"); return; }
    addCategory(catDraft);
    toast.success("Category added");
    setCatDraft({ name: "", type: "expense", color: "#45B1E8" });
  };

  const handleAddMethod = () => {
    if (!methodDraft.name.trim()) { toast.error("Name required"); return; }
    addMethod({
      name: methodDraft.name, type: methodDraft.type,
      color: methodDraft.color,
      holder: methodDraft.holder || undefined,
      expiry: methodDraft.expiry || undefined,
      brand: methodDraft.type === "card" ? methodDraft.brand : undefined,
      balance: parseFloat(methodDraft.balance) || 0,
      cardNumber: methodDraft.cardNumber,
      cvc: methodDraft.cvc,
    });
    toast.success("Payment method added");
    setMethodDraft({ name: "", type: "card", color: "#0b1f3a", holder: "", expiry: "", brand: "visa", balance: "", cardNumber: "", cvc: "" });
    setMethodOpen(false);
  };

  const handleAddLoan = () => {
    const prin = parseFloat(loanDraft.principal);
    const rep = parseFloat(loanDraft.totalRepayable);
    if (!prin || !rep || !loanDraft.lender) { toast.error("Fill required fields"); return; }
    addLoan({
      lender: loanDraft.lender,
      principal: prin,
      totalRepayable: rep,
      date: new Date(loanDraft.date).toISOString()
    });
    toast.success("Loan added");
    setLoanOpen(false);
    setLoanDraft({ lender: "", principal: "", totalRepayable: "", date: format(new Date(), "yyyy-MM-dd") });
  };

  const handleRepay = () => {
    if (!selectedLoan) return;
    const amt = parseFloat(repayDraft.amount);
    if (!amt || amt <= 0) { toast.error("Valid amount required"); return; }
    if (!repayDraft.categoryId || !repayDraft.methodId) { toast.error("Pick category and method"); return; }
    repayLoan(selectedLoan.id, amt, repayDraft.methodId, repayDraft.categoryId);
    toast.success("Repayment recorded");
    setRepayOpen(false);
  };

  const exportExcel = () => {
    const rows = filtered.map((t) => {
      const cat = categoriesList.find((c) => c.id === t.categoryId);
      const m = methodsList.find((mm) => mm.id === t.methodId);
      return {
        Date: format(new Date(t.date), "yyyy-MM-dd"),
        Type: t.type, Amount: t.amount,
        Category: cat?.name || "—", Method: m?.name || "—",
        Description: t.description || "",
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    const summary = [
      { Metric: "Income (this month)", Value: timeframeData.income },
      { Metric: "Expenses (this month)", Value: timeframeData.expense },
      { Metric: "Net savings", Value: timeframeData.savings },
      { Metric: "Income Δ vs last month", Value: `${timeframeData.incomeDelta.toFixed(1)}%` },
      { Metric: "Expense Δ vs last month", Value: `${timeframeData.expenseDelta.toFixed(1)}%` },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summary);
    ws2["!cols"] = [{ wch: 30 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    const byCat = expenseByCat.map((e) => ({ Category: e.name, Total: e.value }));
    const ws3 = XLSX.utils.json_to_sheet(byCat);
    ws3["!cols"] = [{ wch: 22 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, "By Category");

    XLSX.writeFile(wb, `digital-hub-finance-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel report downloaded");
  };

  const incomeCats = categoriesList.filter((c) => c.type === "income");
  const expenseCats = categoriesList.filter((c) => c.type === "expense");
  const draftCats = draft.type === "income" ? incomeCats : expenseCats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Track income, expenses, and manage payment methods."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportExcel}><Download className="w-4 h-4" />Excel</Button>
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Tag className="w-4 h-4" />Categories</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Manage categories</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <Input className="col-span-5" placeholder="Name" value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} />
                    <Select value={catDraft.type} onValueChange={(v: TransactionType) => setCatDraft({ ...catDraft, type: v })}>
                      <SelectTrigger className="col-span-4"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="color" className="col-span-2 p-1 h-9" value={catDraft.color} onChange={(e) => setCatDraft({ ...catDraft, color: e.target.value })} />
                    <Button className="col-span-1" size="icon" onClick={handleAddCategory}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-1 max-h-72 overflow-auto scrollbar-thin">
                    {categoriesList.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group animate-in-up transition-colors">
                        <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                        <span className="text-sm flex-1">{c.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { removeCategory(c.id); toast.error("Removed"); }}>
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4" />Add</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>New transaction</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <Tabs value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as TransactionType, categoryId: "" })}>
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="expense">Expense</TabsTrigger>
                      <TabsTrigger value="income">Income</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Input type="number" placeholder="Amount" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} autoFocus />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={draft.categoryId} onValueChange={(v) => setDraft({ ...draft, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {draftCats.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />{c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={draft.methodId} onValueChange={(v) => setDraft({ ...draft, methodId: v })}>
                      <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                      <SelectContent>
                        {methodsList.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Income" value={`$${timeframeData.income.toLocaleString()}`} icon={ArrowUpRight} accent="success" delta={{ value: `${Math.abs(timeframeData.incomeDelta).toFixed(0)}%`, positive: timeframeData.incomeDelta >= 0 }} />
        <StatCard label="Expenses" value={`$${timeframeData.expense.toLocaleString()}`} icon={ArrowDownRight} accent="destructive" delta={{ value: `${Math.abs(timeframeData.expenseDelta).toFixed(0)}%`, positive: timeframeData.expenseDelta < 0 }} />
        <StatCard label="Savings" value={`$${timeframeData.savings.toLocaleString()}`} icon={PiggyBank} accent={timeframeData.savings >= 0 ? "success" : "destructive"} />
        <StatCard label="Methods" value={`${methodsList.length}`} icon={Wallet} accent="primary" />
      </div>

      <Card className="animate-in-up">
        <CardHeader className="flex-row items-end justify-between space-y-0 gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-4 h-4" />My cards</CardTitle>
            <CardDescription>Cards, accounts, and wallets</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 sm:-space-x-12 hover:sm:space-x-4 transition-all duration-500 ease-spring px-4 overflow-x-auto py-8">
            {methodsList.map((m, i) => (
              <div key={m.id} className="relative group/card w-full sm:w-[320px] shrink-0 transition-transform duration-500 hover:-translate-y-4 hover:z-50 focus-within:z-50" style={{ zIndex: i }}>
                <PaymentCard method={m} onDelete={() => { removeMethod(m.id); toast.error("Method removed"); }} />
              </div>
            ))}
            <Dialog open={methodOpen} onOpenChange={setMethodOpen}>
              <DialogTrigger asChild>
                <div className="w-full sm:w-[320px] shrink-0 relative z-0 mt-4 sm:mt-0 hover:z-50 transition-all duration-500 hover:-translate-y-4"><AddCardTile onClick={() => setMethodOpen(true)} /></div>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-lg">
                <DialogHeader><DialogTitle>Add payment method</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="max-w-sm mx-auto">
                    <PaymentCard method={{
                      id: "preview", name: methodDraft.name || "Card name",
                      type: methodDraft.type, cardNumber: methodDraft.cardNumber,
                      cvc: methodDraft.cvc, balance: parseFloat(methodDraft.balance) || 0,
                      color: methodDraft.color, holder: methodDraft.holder || "CARDHOLDER",
                      expiry: methodDraft.expiry, brand: methodDraft.brand,
                    }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input className="col-span-2" placeholder="Display name" value={methodDraft.name} onChange={(e) => setMethodDraft({ ...methodDraft, name: e.target.value })} />
                    <Select value={methodDraft.type} onValueChange={(v: any) => setMethodDraft({ ...methodDraft, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank account</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input type="number" placeholder="Starting Balance" value={methodDraft.balance} onChange={(e) => setMethodDraft({ ...methodDraft, balance: e.target.value })} />
                  {methodDraft.type === "card" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Cardholder name" value={methodDraft.holder} onChange={(e) => setMethodDraft({ ...methodDraft, holder: e.target.value.toUpperCase() })} />
                        <Select value={methodDraft.brand} onValueChange={(v: CardBrand) => setMethodDraft({ ...methodDraft, brand: v })}>
                          <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visa">Visa</SelectItem>
                            <SelectItem value="mastercard">Mastercard</SelectItem>
                            <SelectItem value="amex">American Express</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-12 gap-3">
                        <Input className="col-span-5" placeholder="Card Number" maxLength={16} value={methodDraft.cardNumber} onChange={(e) => setMethodDraft({ ...methodDraft, cardNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })} />
                        <Input className="col-span-3" placeholder="MM/YY" maxLength={5} value={methodDraft.expiry} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                          setMethodDraft({ ...methodDraft, expiry: v });
                        }} />
                        <Input className="col-span-2" placeholder="CVC" maxLength={4} value={methodDraft.cvc} onChange={(e) => setMethodDraft({ ...methodDraft, cvc: e.target.value.replace(/\D/g, "") })} />
                        <Input className="col-span-2 p-1 h-10" type="color" value={methodDraft.color} onChange={(e) => setMethodDraft({ ...methodDraft, color: e.target.value })} />
                      </div>
                    </>
                  )}
                  {methodDraft.type !== "card" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Account holder" value={methodDraft.holder} onChange={(e) => setMethodDraft({ ...methodDraft, holder: e.target.value })} />
                      <Input type="color" className="p-1 h-10" value={methodDraft.color} onChange={(e) => setMethodDraft({ ...methodDraft, color: e.target.value })} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setMethodOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMethod}>Add method</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        <Card className="lg:col-span-3 chart-3d animate-in-up">
          <CardHeader>
            <CardTitle className="text-lg">Income vs expenses</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <defs>
                    <linearGradient id="incBG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="expBG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<FrostedTooltip formatter={(v) => `$${v.toLocaleString()}`} />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
                  <Bar dataKey="income" fill="url(#incBG)" radius={[8, 8, 0, 0]} animationDuration={1100} />
                  <Bar dataKey="expense" fill="url(#expBG)" radius={[8, 8, 0, 0]} animationDuration={1100} animationBegin={200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 chart-3d animate-in-up stagger-1">
          <CardHeader>
            <CardTitle className="text-lg">Spending breakdown</CardTitle>
            <CardDescription>This month by category</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCat.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No expenses yet</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      {...({
                        data: expenseByCat, dataKey: "value", nameKey: "name",
                        cx: "50%", cy: "50%", innerRadius: 58, outerRadius: 92, paddingAngle: 3,
                        activeIndex: activePie, activeShape: renderActivePie,
                        onMouseEnter: (_: any, i: number) => setActivePie(i),
                        animationDuration: 1100,
                      } as any)}
                    >
                      {expenseByCat.map((e, i) => <Cell key={i} fill={e.color} stroke="hsl(var(--background))" strokeWidth={2} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
      {/* LOANS SECTION */}
      <Card className="animate-in-up">
        <CardHeader className="flex-row items-end justify-between space-y-0 gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><HandCoins className="w-4 h-4" />Loans & Debts</CardTitle>
            <CardDescription>Manage borrowed money</CardDescription>
          </div>
          <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4" />Add Loan</Button></DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Record New Loan</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <Input placeholder="Lender (Person/Bank)" value={loanDraft.lender} onChange={(e) => setLoanDraft({ ...loanDraft, lender: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Principal Amount" value={loanDraft.principal} onChange={(e) => setLoanDraft({ ...loanDraft, principal: e.target.value })} />
                  <Input type="number" placeholder="Total Repayable" value={loanDraft.totalRepayable} onChange={(e) => setLoanDraft({ ...loanDraft, totalRepayable: e.target.value })} />
                </div>
                {loanDraft.principal && loanDraft.totalRepayable && (
                  <p className="text-xs text-muted-foreground tabular-nums">Effective Interest Rate: {(((parseFloat(loanDraft.totalRepayable) - parseFloat(loanDraft.principal)) / parseFloat(loanDraft.principal)) * 100).toFixed(1)}%</p>
                )}
                <Input type="date" value={loanDraft.date} onChange={(e) => setLoanDraft({ ...loanDraft, date: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setLoanOpen(false)}>Cancel</Button>
                <Button onClick={handleAddLoan}>Add Loan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loansList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No active loans.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loansList.map(loan => (
                <div key={loan.id} className="p-4 rounded-2xl border border-border/50 bg-muted/20 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{loan.lender}</h4>
                      <p className="text-xs text-muted-foreground">{format(new Date(loan.date), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant={loan.status === "paid" ? "secondary" : "outline"} className={loan.status === "paid" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}>
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid: ${loan.amountPaid.toLocaleString()}</span>
                      <span className="font-medium">${loan.totalRepayable.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-border/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min((loan.amountPaid / loan.totalRepayable) * 100, 100)}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">Principal: ${loan.principal.toLocaleString()}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {loan.status === "active" && (
                      <Button size="sm" className="w-full text-xs" onClick={() => { setSelectedLoan(loan); setRepayOpen(true); }}>Repay</Button>
                    )}
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeLoan(loan.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Repay Loan: {selectedLoan?.lender}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground mb-4">Remaining: ${(selectedLoan ? selectedLoan.totalRepayable - selectedLoan.amountPaid : 0).toLocaleString()}</p>
            <Input type="number" placeholder="Repayment Amount" value={repayDraft.amount} onChange={(e) => setRepayDraft({ ...repayDraft, amount: e.target.value })} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <Select value={repayDraft.methodId} onValueChange={(v) => setRepayDraft({ ...repayDraft, methodId: v })}>
                <SelectTrigger><SelectValue placeholder="Pay from..." /></SelectTrigger>
                <SelectContent>
                  {methodsList.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={repayDraft.categoryId} onValueChange={(v) => setRepayDraft({ ...repayDraft, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {expenseCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRepayOpen(false)}>Cancel</Button>
            <Button onClick={handleRepay}>Confirm Repayment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg">Transactions</CardTitle>
            <CardDescription>{filtered.length} entries</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full sm:w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cats</SelectItem>
                {categoriesList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {methodsList.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="income">In</TabsTrigger>
                <TabsTrigger value="expense">Out</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No transactions match your filters</div>}
            {filtered.slice(0, 50).map((t, i) => {
              const cat = categoriesList.find((c) => c.id === t.categoryId);
              const m = methodsList.find((mm) => mm.id === t.methodId);
              return (
                <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors group animate-in-up cursor-pointer" onClick={() => { setSelectedTx(t); setTxOpen(true); }} style={{ animationDelay: `${Math.min(i, 10) * 20}ms` }}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    t.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.description || cat?.name || "Transaction"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {cat && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />{cat.name}</span>}
                      {m && <span>· {m.name}</span>}
                      <span>· {format(new Date(t.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <p className={cn("font-semibold text-sm tabular-nums", t.type === "income" ? "text-success" : "text-destructive")}>
                    {t.type === "income" ? "+" : "−"}${t.amount.toLocaleString()}
                  </p>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8" onClick={(e) => { e.stopPropagation(); removeTransaction(t.id); toast.error("Deleted"); }} aria-label="Delete">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Info className="w-5 h-5 text-primary"/> Transaction Details</DialogTitle></DialogHeader>
          {selectedTx && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">{format(new Date(selectedTx.date), "EEEE, MMM d, yyyy")}</p>
                <p className={cn("text-4xl font-display font-bold mt-2", selectedTx.type === "income" ? "text-success" : "text-destructive")}>
                  {selectedTx.type === "income" ? "+" : "−"}${selectedTx.amount.toLocaleString()}
                </p>
                <p className="text-lg font-medium mt-1">{selectedTx.description || categoriesList.find(c => c.id === selectedTx.categoryId)?.name || "Transaction"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: categoriesList.find(c => c.id === selectedTx.categoryId)?.color || "#000" }} />
                    <p className="text-sm font-medium">{categoriesList.find(c => c.id === selectedTx.categoryId)?.name || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Method</p>
                  <p className="text-sm font-medium">{methodsList.find(m => m.id === selectedTx.methodId)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <Badge variant={selectedTx.type === "income" ? "outline" : "secondary"} className={selectedTx.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>{selectedTx.type}</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
