"use client";

import { Button, Card, Input, StatusBanner, Spinner, Badge, AudioPlayer } from "@ace/ui";
import { audioUrl } from "@ace/ui";
import type { useExportStep } from "../hooks/useExportStep";
import { SpectralCompare } from "./SpectralCompare";

type ExportStepProps = ReturnType<typeof useExportStep>;

export function ExportStepContent(props: ExportStepProps) {
  const {
    exportPath, setExportPath,
    exporting, exported, error,
    testPrompt, setTestPrompt,
    comparePhase, loraAudio, baseAudio, busy,
    handleExport, handleCompare,
  } = props;

  const phaseLabel: Record<string, string> = {
    "loading-lora": "Loading LoRA...",
    "gen-lora": "Generating with LoRA...",
    "gen-base": "Generating without LoRA...",
  };

  return (
    <div className="space-y-4">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <Card title="Export LoRA">
        <div className="space-y-4">
          <Input
            label="Export Path (optional)"
            placeholder="Leave empty for default location"
            value={exportPath}
            onChange={(e) => setExportPath(e.target.value)}
          />
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Spinner size="sm" /> : "Export"}
          </Button>
          {exported && (
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="success">Exported</Badge>
              <span className="text-gray-600 font-mono text-xs truncate">{exported}</span>
              <a
                href={`/api/download?path=${encodeURIComponent(exported)}`}
                download
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                </svg>
                Download
              </a>
            </div>
          )}
        </div>
      </Card>

      {exported && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="A/B Compare">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Generate the same prompt with and without LoRA to hear the difference.
                </p>
                <Input
                  label="Test Prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Describe the music to generate"
                />
                <Button onClick={handleCompare} disabled={busy} variant="secondary">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      {phaseLabel[comparePhase!] || "Processing..."}
                    </span>
                  ) : (
                    "Compare (LoRA vs Base)"
                  )}
                </Button>

                {(loraAudio || baseAudio) && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">With LoRA</Badge>
                        <span className="text-xs text-gray-500">Fine-tuned</span>
                      </div>
                      {loraAudio ? (
                        <AudioPlayer src={audioUrl(loraAudio)} title="LoRA Output" />
                      ) : (
                        <div className="text-sm text-gray-400">Generating...</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Base Model</Badge>
                        <span className="text-xs text-gray-500">No fine-tuning</span>
                      </div>
                      {baseAudio ? (
                        <AudioPlayer src={audioUrl(baseAudio)} title="Base Output" />
                      ) : (
                        <div className="text-sm text-gray-400">
                          {comparePhase === "gen-base" ? "Generating..." : "Waiting..."}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <SpectralCompare loraAudioPath={loraAudio} baseAudioPath={baseAudio} />
          </div>
        </>
      )}
    </div>
  );
}
