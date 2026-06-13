"use client";

import { useState, useCallback, useRef } from "react";
import { usePolling } from "@ace/ui";
import { exportLora, loadLora, getLoraStatus, toggleLora, releaseTask, queryResult } from "../../lib/api";

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

export function useExportStep() {
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

  const genParams = useCallback(
    () => ({
      prompt: promptRef.current,
      lyrics: "[Instrumental]" as const,
      task_type: "text2music" as const,
      inference_steps: 50,
      guidance_scale: 7,
      audio_duration: 30,
    }),
    [],
  );

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
  const isComplete = false;
  const summary = exported ? `Exported to ${exported}` : "";

  return {
    exportPath, setExportPath,
    exporting, exported, error,
    testPrompt, setTestPrompt,
    comparePhase, loraAudio, baseAudio, busy,
    isComplete, summary,
    handleExport, handleCompare,
  };
}
