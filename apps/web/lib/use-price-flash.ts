"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Price-flash hook — NEW in Visual Refresh v0.2 (feeds P027 quote cells and
 * any live-updating numeric cell). Watches a numeric value; when it changes,
 * returns "flash-up" / "flash-down" for one animation cycle (600ms, defined in
 * globals.css, reduced-motion safe), then clears.
 *
 * Usage:
 *   const flash = usePriceFlash(quote.last);
 *   <td className={cn("num text-right", flash)}>{quote.last.toFixed(2)}</td>
 */
export function usePriceFlash(value: number, duration = 650): string {
  const prev = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cls, setCls] = useState("");

  useEffect(() => {
    if (value !== prev.current) {
      const dir = value > prev.current ? "flash-up" : "flash-down";
      prev.current = value;
      // Re-trigger the CSS animation even for same-direction repeats.
      setCls("");
      const raf = requestAnimationFrame(() => setCls(dir));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCls(""), duration);
      return () => cancelAnimationFrame(raf);
    }
  }, [value, duration]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return cls;
}
