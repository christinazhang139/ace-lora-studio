"use client";

import { Button, Card, Input, Progress, StatusBanner, Spinner, Badge } from "@ace/ui";
import type { usePreprocessStep } from "../hooks/usePreprocessStep";

type PreprocessStepProps = ReturnType<typeof usePreprocessStep>;

export function PreprocessStepContent(props: PreprocessStepProps) {
  const {
    outputDir, setOutputDir,
    skipExisting, setSkipExisting,
    showAdvanced, setShowAdvanced,
    running, status, error,
    handleStart,
  } = props;

  return (
    <div className="space-y-4">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <Card>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Convert your labeled audio into training tensors. This usually takes a few minutes.
          </p>
          <Button onClick={handleStart} disabled={running}>
            {running ? <Spinner size="sm" /> : "Start Preprocessing"}
          </Button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {showAdvanced ? "Hide advanced options" : "Advanced options"}
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
              <Progress
                value={status.current}
                max={status.total}
                label={`Processing samples${status.progress ? ` — ${status.progress}` : ""}`}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
