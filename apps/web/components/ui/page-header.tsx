"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/use-locale";
import type { Dict } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  /**
   * Dictionary keys, preferred over the literal props above. Keys are plain
   * strings, so a server-component page can pass them without becoming a
   * client component — the translation happens here.
   */
  eyebrowKey?: keyof Dict;
  titleKey?: keyof Dict;
  descriptionKey?: keyof Dict;
  actions?: ReactNode;
  className?: string;
}

/** Consistent page/section header used across every workspace route. */
export function PageHeader({
  eyebrow,
  title,
  description,
  eyebrowKey,
  titleKey,
  descriptionKey,
  actions,
  className,
}: PageHeaderProps) {
  const t = useT();
  const eyebrowText = eyebrowKey ? t(eyebrowKey) : eyebrow;
  const titleText = titleKey ? t(titleKey) : (title ?? "");
  const descriptionText = descriptionKey ? t(descriptionKey) : description;

  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrowText ? <p className="eyebrow mb-2">{eyebrowText}</p> : null}
        <h1 className="font-serif text-2xl font-semibold text-fg">
          {titleText}
        </h1>
        {descriptionText ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {descriptionText}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}
