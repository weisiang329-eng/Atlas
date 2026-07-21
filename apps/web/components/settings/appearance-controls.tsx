"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/use-locale";
import { LOCALES, type Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

type Theme = "dark" | "light";
type Density = "comfortable" | "compact";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-fg">{label}</span>
      <div
        className="flex rounded border border-border bg-bg p-0.5"
        role="group"
        aria-label={label}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded px-3 py-1 text-2xs font-mono uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              value === o.value ? "bg-surface-2 text-fg" : "text-faint hover:text-fg",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Theme (dark/light) and density (comfortable/compact) controls. Applies to
 * <html> (`.light` class, `data-density` attribute) and persists to
 * localStorage; an inline script in the root layout restores it before paint.
 */
export function AppearanceControls() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [density, setDensity] = useState<Density>("comfortable");
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    setTheme(localStorage.getItem("atlas-theme") === "light" ? "light" : "dark");
    setDensity(
      localStorage.getItem("atlas-density") === "compact" ? "compact" : "comfortable",
    );
  }, []);

  function applyTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem("atlas-theme", t);
    document.documentElement.classList.toggle("light", t === "light");
  }

  function applyDensity(d: Density) {
    setDensity(d);
    localStorage.setItem("atlas-density", d);
    if (d === "compact")
      document.documentElement.setAttribute("data-density", "compact");
    else document.documentElement.removeAttribute("data-density");
  }

  return (
    <div className="flex flex-col gap-4">
      <Segmented<Locale>
        label={t("common.language")}
        value={locale}
        onChange={setLocale}
        options={LOCALES}
      />
      <Segmented
        label="Theme"
        value={theme}
        onChange={applyTheme}
        options={[
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
        ]}
      />
      <Segmented
        label="Density"
        value={density}
        onChange={applyDensity}
        options={[
          { value: "comfortable", label: "Comfortable" },
          { value: "compact", label: "Compact" },
        ]}
      />
    </div>
  );
}
