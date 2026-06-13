"use client";

import { useState } from "react";
import { apiGet } from "../lib/api-client";
import type { HealthStatus } from "../lib/types";
import { usePolling } from "./usePolling";

export function useApiHealth(intervalMs = 10000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [ok, setOk] = useState(false);

  usePolling(
    async () => {
      try {
        const res = await apiGet<HealthStatus>("/health");
        setHealth(res.data);
        setOk(res.data.status === "ok");
      } catch {
        setHealth(null);
        setOk(false);
      }
    },
    intervalMs,
    true,
  );

  return { health, ok };
}
