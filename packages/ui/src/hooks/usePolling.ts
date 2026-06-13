"use client";

import { useEffect, useRef, useCallback } from "react";

export function usePolling(
  fn: () => Promise<void>,
  intervalMs: number,
  enabled: boolean,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const poll = useCallback(async () => {
    try {
      await fnRef.current();
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, poll]);
}
