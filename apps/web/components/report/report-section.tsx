import type { ReactNode } from "react";

/**
 * A titled, anchorable report section. Every core section is wrapped in one so
 * the document has consistent rhythm and the table of contents can link to it.
 */
export function ReportSection({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border pt-7">
      <div className="mb-4">
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h2 className="font-serif text-xl text-fg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** Simple bulleted list used for assumptions / open questions / opportunities. */
export function ReportList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
          <span
            aria-hidden
            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-faint"
          />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
