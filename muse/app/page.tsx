"use client";

import { useState, useCallback } from "react";
import { Button, Card, Select, Slider, Textarea, Spinner, Progress, StatusBanner, AudioPlayer, Badge } from "@ace/ui";
import { VALID_KEYSCALES, BPM_MIN, BPM_MAX, audioUrl } from "@ace/ui";
import type { ParsedResult } from "@ace/ui";
import { usePolling } from "@ace/ui";
import { releaseTaskWithAudio, queryResult } from "./lib/api";
import { AudioUploader } from "./components/AudioUploader";

const TRACK_CLASSES = [
  "Vocals", "Drums", "Bass", "Guitar", "Piano", "Strings",
  "Synth", "Brass", "Woodwind", "Percussion",
];

interface HistoryEntry {
  id: string;
  result: ParsedResult;
  timestamp: number;
  prompt: string;
}

function saveToHistory(entry: HistoryEntry) {
  try {
    const stored = JSON.parse(localStorage.getItem("ace-muse-history") || "[]");
    stored.unshift(entry);
    if (stored.length > 50) stored.length = 50;
    localStorage.setItem("ace-muse-history", JSON.stringify(stored));
  } catch {}
}

export default function Home() {
  const [melodyFile, setMelodyFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [bpm, setBpm] = useState(120);
  const [autoBpm, setAutoBpm] = useState(true);
  const [keyscale, setKeyscale] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState(100);
  const [guidance, setGuidance] = useState(15);

  const [generating, setGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("");
  const [results, setResults] = useState<ParsedResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  usePolling(
    async () => {
      if (!taskId) return;
      try {
        const res = await queryResult([taskId]);
        const item = res.data[0];
        if (!item) return;
        if (item.progress_text) setProgressText(item.progress_text);
        if (item.status === 200) {
          try {
            const parsed: ParsedResult = JSON.parse(item.result);
            setResults((prev) => [parsed, ...prev]);
            saveToHistory({ id: taskId, result: parsed, timestamp: Date.now(), prompt });
          } catch {}
          setTaskId(null);
          setGenerating(false);
          setProgressText("");
        } else if (item.status === 500) {
          setError("Generation failed");
          setTaskId(null);
          setGenerating(false);
          setProgressText("");
        }
      } catch {}
    },
    3000,
    !!taskId,
  );

  const toggleTrack = useCallback((track: string) => {
    setSelectedTracks((prev) =>
      prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track],
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!melodyFile) return;
    setGenerating(true);
    setError(null);
    setProgressText("");

    try {
      const formData = new FormData();
      formData.append("src_audio", melodyFile);
      formData.append("task_type", "complete");
      if (prompt.trim()) formData.append("prompt", prompt.trim());
      formData.append("lyrics", "[Instrumental]");
      if (selectedTracks.length > 0) {
        formData.append("param_obj", JSON.stringify({ track_classes: selectedTracks }));
      }
      if (!autoBpm) formData.append("bpm", String(bpm));
      if (keyscale) formData.append("keyscale", keyscale);
      formData.append("infer_step", String(steps));
      formData.append("guidance_scale", String(guidance));

      const res = await releaseTaskWithAudio(formData);
      setTaskId(res.data.task_id);
    } catch (e) {
      setGenerating(false);
      setError(e instanceof Error ? e.message : "Failed to start generation");
    }
  }, [melodyFile, prompt, selectedTracks, autoBpm, bpm, keyscale, steps, guidance]);

  return (
    <div className="space-y-6">
      <Card title="1. Upload Your Music" description="The piece you want to continue">
        <AudioUploader file={melodyFile} onFileSelect={setMelodyFile} />
      </Card>

      <Card title="2. Continuation Style" description="Describe how you want the music to continue (optional)">
        <div className="space-y-4">
          <Textarea
            placeholder="e.g. Continue with a dramatic orchestral buildup, then resolve into a gentle piano melody..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <div>
            <p className="text-xs text-gray-500 mb-2">Include these instruments in the continuation:</p>
            <div className="flex flex-wrap gap-2">
              {TRACK_CLASSES.map((track) => (
                <button
                  key={track}
                  onClick={() => toggleTrack(track)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedTracks.includes(track)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="3. Settings">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={autoBpm}
                  onChange={(e) => setAutoBpm(e.target.checked)}
                  className="accent-blue-600"
                />
                Auto-detect BPM
              </label>
              {!autoBpm && (
                <Slider label="BPM" min={BPM_MIN} max={BPM_MAX} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
              )}
            </div>
            <Select
              label="Key"
              value={keyscale}
              onChange={(e) => setKeyscale(e.target.value)}
              options={[{ value: "", label: "Auto-detect" }, ...VALID_KEYSCALES.map((k) => ({ value: k, label: k }))]}
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>&#9656;</span>
            Advanced
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Steps" min={10} max={200} value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
              <Slider label="Guidance" min={1} max={30} step={0.5} value={guidance} onChange={(e) => setGuidance(Number(e.target.value))} />
            </div>
          )}
        </div>
      </Card>

      <Button onClick={handleGenerate} disabled={generating || !melodyFile} size="lg" className="w-full">
        {generating ? <Spinner size="sm" /> : "Continue Music"}
      </Button>

      {generating && (
        <Progress value={0} max={100} label={progressText || "Generating continuation..."} />
      )}

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Results</h3>
          {results.map((r, i) => {
            const paths = r.raw_audio_paths ?? [];
            return (
              <Card key={i}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.metas?.bpm && <Badge>{r.metas.bpm} BPM</Badge>}
                    {r.metas?.keyscale && <Badge>{r.metas.keyscale}</Badge>}
                    {r.metas?.duration && <Badge>{r.metas.duration}s</Badge>}
                  </div>
                  {paths.map((path, j) => (
                    <div key={j}>
                      <AudioPlayer src={audioUrl(path)} title={paths.length > 1 ? `Track ${j + 1}` : "Continuation"} />
                      <div className="flex justify-end mt-1">
                        <a href={audioUrl(path)} download className="text-xs text-gray-400 hover:text-gray-600">
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
