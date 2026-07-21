"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  type Dict,
  type Locale,
} from "@/lib/i18n/dictionary";

/**
 * Locale state for the app.
 *
 * The site is a static export, so there is no server-side locale negotiation
 * and no per-locale route: every page ships once, renders in the default
 * locale (Chinese), and swaps strings on the client. This keeps the build at
 * 254 pages instead of doubling it, and makes switching instant with no
 * navigation.
 *
 * The choice persists in localStorage and is applied before paint by the
 * inline script in `app/layout.tsx`, so there is no flash of the wrong
 * language on reload.
 */

const STORAGE_KEY = "atlas-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key. Unknown keys return the key itself, which is loud on purpose. */
  t: (key: keyof Dict) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStored(): Locale | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "zh" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Adopt the persisted choice after mount. The pre-paint script has already
  // set <html lang>, so this only syncs React state.
  useEffect(() => {
    const stored = readStored();
    if (stored && stored !== locale) setLocaleState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable — the choice simply does not persist */
    }
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  const t = useCallback(
    (key: keyof Dict) => DICTIONARIES[locale][key] ?? (key as string),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside <LocaleProvider>");
  }
  return ctx;
}

/** Shorthand for components that only need the translate function. */
export function useT(): (key: keyof Dict) => string {
  return useLocale().t;
}
