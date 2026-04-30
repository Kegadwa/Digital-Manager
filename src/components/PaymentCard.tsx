import { Wifi, Trash2, Banknote, Wallet, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, CardBrand } from "@/types";

interface PaymentCardProps {
  method: PaymentMethod;
  onDelete?: () => void;
  className?: string;
}

const BrandMark = ({ brand }: { brand?: CardBrand }) => {
  const inferred = brand;
  if (inferred === "visa") {
    return <span className="font-display italic font-bold text-lg tracking-tight">VISA</span>;
  }
  if (inferred === "mastercard") {
    return (
      <div className="flex items-center -space-x-2.5">
        <span className="w-6 h-6 rounded-full bg-[#eb001b]" />
        <span className="w-6 h-6 rounded-full bg-[#f79e1b] mix-blend-screen" />
      </div>
    );
  }
  if (inferred === "amex") {
    return <span className="font-display font-bold text-[10px] bg-white/15 px-2 py-1 rounded">AMERICAN EXPRESS</span>;
  }
  return <span className="font-display font-semibold text-xs uppercase tracking-widest opacity-80">CARD</span>;
};

const Chip = () => (
  <svg viewBox="0 0 40 32" className="w-9 h-7" aria-hidden>
    <defs>
      <linearGradient id="chipG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f4d27a" />
        <stop offset="50%" stopColor="#c79e3d" />
        <stop offset="100%" stopColor="#8c6a1c" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="30" rx="5" fill="url(#chipG)" />
    <path d="M1 11 H14 M1 21 H14 M26 11 H39 M26 21 H39 M14 1 V11 M14 21 V31 M26 1 V11 M26 21 V31 M14 11 H26 V21 H14 Z"
          stroke="hsl(0 0% 0% / 0.25)" strokeWidth="0.7" fill="none" />
  </svg>
);

export function PaymentCard({ method, onDelete, className }: PaymentCardProps) {
  const baseColor = method.color || "#1a1a1a";
  const isCard = method.type === "card";
  const isBank = method.type === "bank";
  const isWallet = method.type === "wallet";
  const isCash = method.type === "cash";

  const TypeIcon = isCash ? Banknote : isWallet ? Wallet : isBank ? Building2 : null;
  const last4 = method.last4 || "••••";
  const number = `•••• •••• •••• ${last4}`;

  return (
    <div
      className={cn(
        "group relative aspect-[1.586/1] w-full rounded-2xl overflow-hidden",
        "text-white select-none cursor-default",
        "transition-transform duration-500 ease-spring",
        "[transform-style:preserve-3d] hover:[transform:perspective(1200px)_rotateY(-6deg)_rotateX(4deg)_translateZ(0)]",
        "shadow-ios hover:shadow-float",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 50%, #000000 140%)`,
      }}
    >
      {/* Glossy sheen */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: "linear-gradient(115deg, transparent 35%, hsl(0 0% 100% / 0.22) 50%, transparent 65%)" }} />
      {/* Soft top highlight */}
      <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
           style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.12), transparent)" }} />
      {/* Decorative orbs */}
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-2xl opacity-30"
           style={{ background: "hsl(0 0% 100% / 0.4)" }} />

      <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {isCard ? <Chip /> : TypeIcon ? (
              <span className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <TypeIcon className="w-4.5 h-4.5" />
              </span>
            ) : null}
            {isCard && <Wifi className="w-4 h-4 rotate-90 opacity-80" />}
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              aria-label="Remove method"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white/10 hover:bg-white/25 backdrop-blur"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Middle: number or name */}
        {isCard ? (
          <p className="font-mono text-base sm:text-lg tracking-[0.18em] tabular-nums drop-shadow-sm">{number}</p>
        ) : isBank ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Account</p>
            <p className="font-mono text-sm tracking-widest">IBAN •••• 8821</p>
          </div>
        ) : isWallet ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Balance</p>
            <p className="font-display text-2xl font-bold tabular-nums">$1,240</p>
          </div>
        ) : (
          <p className="font-display text-2xl font-bold">{method.name}</p>
        )}

        {/* Bottom row */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-widest opacity-60 mb-0.5">
              {isCard ? "Card holder" : "Name"}
            </p>
            <p className="text-xs sm:text-sm font-medium uppercase tracking-wide truncate">
              {method.holder || method.name}
            </p>
          </div>
          {isCard && method.expiry && (
            <div className="text-right shrink-0">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-0.5">Valid thru</p>
              <p className="text-xs sm:text-sm font-medium font-mono tabular-nums">{method.expiry}</p>
            </div>
          )}
          <div className="shrink-0">
            <BrandMark brand={method.brand} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddCardTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-[1.586/1] w-full rounded-2xl",
        "border-2 border-dashed border-border/70 bg-muted/30",
        "flex flex-col items-center justify-center gap-2 text-muted-foreground",
        "transition-all duration-300 ease-spring",
        "hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-float",
        "active:scale-[0.98]"
      )}
    >
      <span className="w-10 h-10 rounded-full bg-background border border-border/60 flex items-center justify-center text-xl font-light shadow-sm">+</span>
      <span className="text-xs font-medium">Add payment method</span>
    </button>
  );
}
