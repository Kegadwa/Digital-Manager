import { cn } from "@/lib/utils";

interface FrostedTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
  className?: string;
}

export function FrostedTooltip({ active, payload, label, formatter, labelFormatter, className }: FrostedTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(
      "rounded-xl border border-border/60 bg-popover/85 backdrop-blur-2xl px-3 py-2 shadow-float",
      "animate-in zoom-in-95 fade-in-0 duration-200",
      className
    )}>
      {label && (
        <p className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ background: item.color || item.payload?.fill || item.fill }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold tabular-nums text-foreground ml-auto">
              {formatter ? formatter(item.value, item.name) : item.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
