"use client";

import { cn } from "@/lib/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/** Styled search field primitive used by FilterBar and inline list search. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded border border-border-soft bg-surface-3 px-2.5 focus-within:border-accent-dim",
        className,
      )}
    >
      <span aria-hidden className="font-mono text-sm text-faint">
        &#9906;
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full bg-transparent py-1.5 text-sm text-fg placeholder:text-faint focus:outline-none"
      />
    </div>
  );
}
