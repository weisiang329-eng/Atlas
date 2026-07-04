interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Optional retry handler. When provided, a "Try again" button is shown. */
  onRetry?: () => void;
}

/**
 * Consistent error surface. Messages are plain-language — no status codes or
 * stack traces. Retry is optional so the component works in static contexts.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "This section could not be loaded. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-negative/40 px-6 py-12 text-center"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full border border-negative/50 font-mono text-sm text-negative">
        !
      </span>
      <h3 className="font-serif text-lg text-fg">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
