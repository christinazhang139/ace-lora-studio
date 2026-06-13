"use client";

import { useState, useCallback } from "react";
import type { PreprocessStatus } from "@ace/ui";
import { usePolling } from "@ace/ui";
import { startPreprocess, getPreprocessStatus } from "../../lib/api";

export function usePreprocessStep() {
  const [outputDir, setOutputDir] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<PreprocessStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePolling(
    async () => {
      if (!running) return;
      try {
        const res = await getPreprocessStatus();
        setStatus(res.data);
        if (res.data.status === "completed" || res.data.status === "failed") {
          setRunning(false);
          if (res.data.status === "failed") {
            setError(res.data.error ?? "Preprocessing failed");
          }
        }
      } catch {}
    },
    2000,
    running,
  );

  const handleStart = useCallback(async () => {
    setRunning(true);
    setError(null);
    setStatus(null);
    try {
      await startPreprocess({ output_dir: outputDir || "", skip_existing: skipExisting });
    } catch (e) {
      setRunning(false);
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  }, [outputDir, skipExisting]);

  const isComplete = status?.status === "completed";
  const summary = isComplete ? `${status?.total ?? 0} samples encoded` : "";

  return {
    outputDir, setOutputDir,
    skipExisting, setSkipExisting,
    showAdvanced, setShowAdvanced,
    running, status, error,
    isComplete, summary,
    handleStart,
  };
}
