import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon: LucideIcon;
  accent?: "primary" | "success" | "destructive" | "warning" | "mono";
}

const accents = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  destructive: "text-destructive bg-destructive/10",
  warning: "text-warning bg-warning/10",
  mono: "text-foreground bg-muted",
};

export function StatCard({ label, value, delta, icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <Card className="group animate-in-up [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(4deg)_rotateY(-2deg)_translateY(-4px)]">
      <CardContent className="p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold font-display tracking-tight truncate group-hover:text-foreground transition-colors">
              {value}
            </p>
            {delta && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                delta.positive ? "text-success" : "text-destructive"
              )}>
                {delta.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{delta.value}</span>
                <span className="text-muted-foreground font-normal">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-2.5 rounded-2xl shrink-0 transition-all duration-500 ease-spring",
            "group-hover:scale-110 group-hover:rotate-[-6deg] group-hover:shadow-md",
            accents[accent]
          )}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
