"use client";

import { useState, useCallback } from "react";
import type { TrainingStatus } from "@ace/ui";
import { usePolling } from "@ace/ui";
import { startTraining, startLoKRTraining, getTrainingStatus, stopTraining } from "../../lib/api";

export function useTrainStep() {
  const [training, setTraining] = useState(false);
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePolling(
    async () => {
      if (!training) return;
      try {
        const res = await getTrainingStatus();
        setStatus(res.data);
        const failed = res.data.status?.startsWith("❌") || res.data.error;
        if (!res.data.is_training && (res.data.current_step > 0 || failed)) {
          setTraining(false);
          const errMsg = res.data.error || (res.data.status?.startsWith("❌") ? res.data.status : null);
          if (errMsg) setError(errMsg);
        }
      } catch {}
    },
    2000,
    training,
  );

  const handleStartLora = useCallback(async (config: Record<string, unknown>) => {
    setTraining(true);
    setError(null);
    try {
      await startTraining(config as never);
    } catch (e) {
      setTraining(false);
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  }, []);

  const handleStartLokr = useCallback(async (config: Record<string, unknown>) => {
    setTraining(true);
    setError(null);
    try {
      await startLoKRTraining(config as never);
    } catch (e) {
      setTraining(false);
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await stopTraining();
    } catch {}
  }, []);

  const done = status && !status.is_training && status.current_step > 0 && !error;
  const isComplete = !!done;
  const summary = isComplete
    ? `${status!.current_epoch} epochs, loss ${status!.current_loss?.toFixed(4) ?? "N/A"}`
    : "";

  return {
    training, status, error,
    isComplete, summary,
    handleStartLora, handleStartLokr, handleStop,
  };
}
