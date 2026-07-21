"use client";

/**
 * Language switch, in the top bar.
 *
 * It used to live only in Settings — four clicks and a scroll from anywhere,
 * for a control a bilingual user reaches for constantly. A two-state toggle is
 * cheap enough in space to earn a permanent home in the chrome.
 */
import { useLocale } from "@/lib/i18n/use-locale";
import { LOCALES } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

export function LocaleSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className="flex rounded-pill border border-border bg-surface-3 p-0.5"
    >
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          aria-pressed={locale === l.value}
          onClick={() => setLocale(l.value)}
          className={cn(
            "rounded-pill px-2 py-0.5 text-2xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
            locale === l.value
              ? "bg-surface text-fg shadow-panel"
              : "text-faint hover:text-muted",
          )}
        >
          {l.value === "zh" ? "中" : "EN"}
        </button>
      ))}
    </div>
  );
}
