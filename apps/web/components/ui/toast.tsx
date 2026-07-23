"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n/use-locale";

export type ToastTone = "info" | "positive" | "warning" | "negative";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** Show a transient notification. Auto-dismisses after ~4s. */
  notify: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TONE_ACCENT: Record<ToastTone, string> = {
  info: "border-l-info",
  positive: "border-l-positive",
  warning: "border-l-warning",
  negative: "border-l-negative",
};

/**
 * App-wide notification system. Mount once near the root; call `useToast().notify`
 * from anywhere. Notifications stack bottom-right and are announced politely.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label={locale === "zh" ? "通知" : "Notifications"}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const { locale } = useLocale();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(true);
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role={toast.tone === "negative" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto rounded-panel border border-l-2 border-border bg-surface p-3 shadow-panel transition-all duration-200 motion-reduce:transition-none",
        TONE_ACCENT[toast.tone],
        shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={locale === "zh" ? "关闭通知" : "Dismiss notification"}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
