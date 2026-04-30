"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeProvider";
import { PageHeader } from "@/components/PageHeader";
import { Moon, Sun, Monitor, Bell, Shield, Database, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, collection, getDocs, query } from "firebase/firestore";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  const clearAll = async () => {
    if (!confirm("Reset all data? This will clear your tasks, projects, transactions, notes and files from the cloud.")) return;
    try {
      // Clear data collection
      const dataQuery = query(collection(db, "data"));
      const dataSnap = await getDocs(dataQuery);
      const dataDeletions = dataSnap.docs.map(d => deleteDoc(d.ref));
      
      // Clear meta document
      const metaDeletion = deleteDoc(doc(db, "meta", "seeded"));
      
      await Promise.all([...dataDeletions, metaDeletion]);
      
      toast.success("Workspace cleared. Reloading…");
      setTimeout(() => location.reload(), 600);
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear data");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Customize your workspace." />

      <Card className="shadow-card border-border/60 animate-in-up">
        <CardHeader>
          <CardTitle className="text-lg font-display">Appearance</CardTitle>
          <CardDescription>Choose how Digital Hub looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); toast.success(`Theme: ${t.label}`); }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  theme === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <t.icon className={cn("w-5 h-5", theme === t.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60 animate-in-up stagger-1">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</CardTitle>
          <CardDescription>Configure how you stay informed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "deadline", label: "Task deadlines", desc: "Alerts before tasks are due" },
            { id: "budget", label: "Budget alerts", desc: "Notify when nearing budget limits" },
            { id: "weekly", label: "Weekly summary", desc: "Recap of your activity each week" },
          ].map((n) => (
            <div key={n.id} className="flex items-center justify-between">
              <div>
                <Label htmlFor={n.id} className="text-sm font-medium">{n.label}</Label>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch id={n.id} defaultChecked onCheckedChange={(v) => toast.success(`${n.label} ${v ? "enabled" : "disabled"}`)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60 animate-in-up stagger-2">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2"><Shield className="w-5 h-5" />Privacy & security</CardTitle>
          <CardDescription>Your data is stored in Firebase Cloud Firestore.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label className="text-sm font-medium">Biometric lock</Label><p className="text-xs text-muted-foreground">Require face or fingerprint to open</p></div>
            <Switch onCheckedChange={(v) => toast.success(`Biometric ${v ? "on" : "off"}`)} />
          </div>
          <div className="flex items-center justify-between">
            <div><Label className="text-sm font-medium">Analytics</Label><p className="text-xs text-muted-foreground">Help improve Digital Hub anonymously</p></div>
            <Switch defaultChecked onCheckedChange={(v) => toast.success(`Analytics ${v ? "on" : "off"}`)} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60 border-destructive/30 animate-in-up stagger-3">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2 text-destructive"><Database className="w-5 h-5" />Data</CardTitle>
          <CardDescription>Manage your cloud workspace data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={clearAll}><Trash2 className="w-4 h-4" />Reset all data</Button>
        </CardContent>
      </Card>
    </div>
  );
}
