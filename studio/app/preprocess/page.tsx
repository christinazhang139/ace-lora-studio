"use client";

import { useState, useCallback } from "react";
import { Button, Card, Input, Progress, StatusBanner, Spinner, Badge } from "@ace/ui";
import type { PreprocessStatus } from "@ace/ui";
import { usePolling } from "@ace/ui";
import { startPreprocess, getPreprocessStatus } from "../lib/api";

export default function PreprocessPage() {
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
      await startPreprocess({
        output_dir: outputDir || "",
        skip_existing: skipExisting,
      });
    } catch (e) {
      setRunning(false);
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  }, [outputDir, skipExisting]);

  const done = status?.status === "completed";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Preprocess</h2>
        <p className="text-sm text-gray-500 mt-1">Convert audio to training tensors</p>
      </div>

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      {!running && (
        <div
          className="rounded-lg border px-4 py-3 text-sm flex items-start gap-3"
          style={{
            backgroundColor: done ? "#f0fdf4" : "#eff6ff",
            borderColor: done ? "#bbf7d0" : "#bfdbfe",
          }}
        >
          <span className="text-lg leading-none mt-0.5">{done ? "✅" : "1️⃣"}</span>
          <div>
            {!done && (
              <p>
                <strong>Next step: Start Preprocessing</strong> — Click the button below to convert your
                labeled audio into training tensors. This usually takes a few minutes.
              </p>
            )}
            {done && (
              <p>
                <strong>Preprocessing complete!</strong> Go to <strong>3 Train</strong> in the sidebar
                to start LoRA training.
              </p>
            )}
          </div>
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <Button onClick={handleStart} disabled={running}>
            {running ? <Spinner size="sm" /> : "Start Preprocessing"}
          </Button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {showAdvanced ? "▾ Hide advanced options" : "▸ Advanced options"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <Input
                label="Output Directory"
                placeholder="Leave empty for default"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="rounded border-gray-300 accent-blue-600"
                />
                Skip already preprocessed samples
              </label>
            </div>
          )}
        </div>
      </Card>

      {status && (
        <Card title="Progress">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={status.status === "completed" ? "success" : status.status === "failed" ? "error" : "info"}>
                {status.status}
              </Badge>
            </div>
            {status.total > 0 && (
              <Progress value={status.current} max={status.total} label={`Processing samples${status.progress ? ` — ${status.progress}` : ""}`} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
