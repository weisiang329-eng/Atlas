import { cn } from "@/lib/cn";

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

/**
 * Read-only metric tile. Values are static placeholders in Sprint 000 —
 * no data fetching or scoring logic lives in the UI.
 */
export function Stat({ label, value, hint, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="eyebrow">{label}</span>
      <span className="font-mono text-xl font-medium tabular-nums text-fg">
        {value}
      </span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}
