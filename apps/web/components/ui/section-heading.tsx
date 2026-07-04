import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Section-level heading (h2) used inside workspace layouts that already own the h1. */
export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-serif text-lg text-fg">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
