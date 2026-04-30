import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8 animate-in-up">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && <div className="flex items-center gap-2">{eyebrow}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
