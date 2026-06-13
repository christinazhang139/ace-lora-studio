"use client";

import { useState, useCallback, useRef } from "react";
import { Button, Card, Input, StatusBanner, Spinner, Badge, AudioPlayer } from "@ace/ui";
import { audioUrl } from "@ace/ui";
import { exportLora, loadLora, getLoraStatus, toggleLora, releaseTask, queryResult } from "../lib/api";
import { usePolling } from "@ace/ui";
import { SpectralCompare } from "../workflow/components/SpectralCompare";

type ComparePhase = null | "loading-lora" | "gen-lora" | "gen-base" | "done";

function extractAudioPath(resultStr: string): string | null {
  try {
    const results = JSON.parse(resultStr);
    const first = Array.isArray(results) ? results[0] : results;
    if (!first?.file) return null;
    const fileUrl = new URL(first.file, "http://localhost");
    return fileUrl.searchParams.get("path") || first.file;
  } catch {
    return null;
  }
}

export default function ExportPage() {
  const [exportPath, setExportPath] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [testPrompt, setTestPrompt] = useState("A beautiful piano melody");
  const [comparePhase, setComparePhase] = useState<ComparePhase>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loraAudio, setLoraAudio] = useState<string | null>(null);
  const [baseAudio, setBaseAudio] = useState<string | null>(null);

  const promptRef = useRef(testPrompt);
  promptRef.current = testPrompt;

  const genParams = useCallback(() => ({
    prompt: promptRef.current,
    lyrics: "[Instrumental]",
    task_type: "text2music" as const,
    inference_steps: 50,
    guidance_scale: 7,
    audio_duration: 30,
  }), []);

  usePolling(
    async () => {
      if (!activeTaskId) return;
      try {
        const res = await queryResult([activeTaskId]);
        const item = res.data[0];

        if (item?.status === 1) {
          const path = extractAudioPath(item.result);

          if (comparePhase === "gen-lora") {
            setLoraAudio(path);
            setActiveTaskId(null);
            setComparePhase("gen-base");
            try {
              await toggleLora(false);
              const r = await releaseTask(genParams());
              setActiveTaskId(r.data.task_id);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Base generation failed");
              setComparePhase("done");
              await toggleLora(true).catch(() => {});
            }
          } else if (comparePhase === "gen-base") {
            setBaseAudio(path);
            setActiveTaskId(null);
            setComparePhase("done");
            await toggleLora(true).catch(() => {});
          }
        } else if (item?.status === 2) {
          setError(item.progress_text || "Generation failed");
          setActiveTaskId(null);
          setComparePhase("done");
          await toggleLora(true).catch(() => {});
        }
      } catch {}
    },
    3000,
    !!activeTaskId,
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await exportLora({ export_path: exportPath, lora_output_dir: "" });
      setExported(res.data.export_path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [exportPath]);

  const handleCompare = useCallback(async () => {
    if (!exported) return;
    setComparePhase("loading-lora");
    setLoraAudio(null);
    setBaseAudio(null);
    setError(null);
    try {
      const status = await getLoraStatus();
      if (!status.data.lora_loaded) {
        await loadLora(exported);
      }
      await toggleLora(true);
      setComparePhase("gen-lora");
      const res = await releaseTask(genParams());
      setActiveTaskId(res.data.task_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compare failed");
      setComparePhase(null);
    }
  }, [exported, genParams]);

  const busy = comparePhase !== null && comparePhase !== "done";

  const phaseLabel: Record<string, string> = {
    "loading-lora": "Loading LoRA...",
    "gen-lora": "Generating with LoRA...",
    "gen-base": "Generating without LoRA...",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Export</h2>
        <p className="text-sm text-gray-500 mt-1">Export trained weights and compare with base model</p>
      </div>

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
                ) : "Compare (LoRA vs Base)"}
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
      )}
    </div>
  );
}
