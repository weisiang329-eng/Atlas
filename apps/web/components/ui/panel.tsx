import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

/** Framed surface — the basic building block of the terminal workspace. */
export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-panel border border-border bg-surface shadow-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function PanelHeader({ title, eyebrow, action }: PanelHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h2 className="truncate font-sans text-sm font-semibold text-fg">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function PanelBody({ children, className }: PanelProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
