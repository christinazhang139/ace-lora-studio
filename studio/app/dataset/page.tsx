"use client";

import { useState, useCallback } from "react";
import { Button, Card, Input, Badge, Progress, Spinner, EmptyState, StatusBanner } from "@ace/ui";
import type { DatasetSample, AutoLabelStatus } from "@ace/ui";
import { usePolling } from "@ace/ui";
import { scanDirectory, loadDataset, saveDataset, getSamples, startAutoLabel, getAutoLabelStatus, updateSample } from "../lib/api";
import { SampleEditor } from "../components/SampleEditor";
import { DatasetUploader } from "../components/DatasetUploader";

type SourceTab = "upload" | "path" | "json";

export default function DatasetPage() {
  const [tab, setTab] = useState<SourceTab>("upload");
  const [datasetName, setDatasetName] = useState("my_dataset");
  const [scanDir, setScanDir] = useState("");
  const [jsonPath, setJsonPath] = useState("");
  const [samples, setSamples] = useState<DatasetSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [labelStatus, setLabelStatus] = useState<AutoLabelStatus | null>(null);
  const [labeling, setLabeling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  usePolling(
    async () => {
      if (!labeling) return;
      try {
        const res = await getAutoLabelStatus();
        setLabelStatus(res.data);
        if (res.data.status === "completed" || res.data.status === "failed") {
          setLabeling(false);
          if (res.data.status === "completed") {
            const s = await getSamples();
            setSamples(s.data.samples);
          } else {
            setError(res.data.error ?? "Auto-label failed");
          }
        }
      } catch {}
    },
    2000,
    labeling,
  );

  const doScan = useCallback(async (dir: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scanDirectory({ audio_dir: dir, dataset_name: datasetName });
      if (res.error) throw new Error(res.error);
      setSamples(res.data.samples);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [datasetName]);

  const handleScan = useCallback(() => {
    if (scanDir) doScan(scanDir);
  }, [scanDir, doScan]);

  const handleUploadDone = useCallback((dir: string) => {
    setScanDir(dir);
    doScan(dir);
  }, [doScan]);

  const handleLoad = useCallback(async () => {
    if (!jsonPath) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loadDataset(jsonPath);
      if (res.error) throw new Error(res.error);
      setSamples(res.data.samples);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [jsonPath]);

  const handleAutoLabel = useCallback(async () => {
    setLabeling(true);
    setError(null);
    try {
      await startAutoLabel({});
    } catch (e) {
      setLabeling(false);
      setError(e instanceof Error ? e.message : "Auto-label failed");
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveDataset(datasetName);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [datasetName]);

  const handleSampleUpdate = useCallback(
    async (idx: number, patch: Partial<DatasetSample>) => {
      try {
        await updateSample(idx, patch);
        setSamples((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
        setEditIdx(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    },
    [],
  );

  const allLabeled = samples.length > 0 && samples.every((s) => s.labeled);
  const noneLabeled = samples.length > 0 && samples.every((s) => !s.labeled);

  const tabClass = (id: SourceTab) =>
    `px-4 py-2.5 text-sm font-medium transition-colors -mb-px cursor-pointer ${
      tab === id
        ? "text-blue-600 border-b-2 border-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dataset</h2>
        <p className="text-sm text-gray-500 mt-1">Upload audio files to train your LoRA</p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">What to upload</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>Both <strong>vocal</strong> and <strong>instrumental</strong> music are supported</li>
          <li>Upload <strong>5-20 songs</strong> in a similar style for best results</li>
          <li>Each song should be at least <strong>30 seconds</strong> long</li>
          <li>Supported formats: <strong>WAV, MP3, FLAC</strong></li>
        </ul>
      </div>

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <Card>
        <div className="space-y-4">
          <Input
            label="Dataset Name"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="max-w-xs"
          />

          <div className="flex border-b border-gray-200">
            <div className={tabClass("upload")} onClick={() => setTab("upload")}>Upload Files</div>
            <div className={tabClass("path")} onClick={() => setTab("path")}>Server Path</div>
            <div className={tabClass("json")} onClick={() => setTab("json")}>Load JSON</div>
          </div>

          {tab === "upload" && (
            <DatasetUploader datasetName={datasetName} onUploaded={handleUploadDone} />
          )}

          {tab === "path" && (
            <div className="space-y-3">
              <Input
                label="Audio Directory"
                placeholder="/path/to/audio/files"
                value={scanDir}
                onChange={(e) => setScanDir(e.target.value)}
              />
              <Button onClick={handleScan} disabled={loading || !scanDir}>
                {loading ? <Spinner size="sm" /> : "Scan Directory"}
              </Button>
            </div>
          )}

          {tab === "json" && (
            <div className="space-y-3">
              <Input
                label="Dataset JSON Path"
                placeholder="/path/to/dataset.json"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
              />
              <Button onClick={handleLoad} disabled={loading || !jsonPath} variant="secondary">
                {loading ? <Spinner size="sm" /> : "Load"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {loading && samples.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-3 text-sm text-gray-500">Scanning audio files...</span>
        </div>
      )}

      {samples.length > 0 && (
        <Card
          title={`Samples (${samples.length})`}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleAutoLabel} disabled={labeling}>
                {labeling ? "Labeling..." : "Auto Label"}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="sm" /> : saved ? "Saved ✓" : "Save"}
              </Button>
            </div>
          }
        >
          {!labeling && (
            <div className="rounded-lg border px-4 py-3 mb-4 text-sm flex items-start gap-3"
              style={{
                backgroundColor: allLabeled && saved ? "#f0fdf4" : "#eff6ff",
                borderColor: allLabeled && saved ? "#bbf7d0" : "#bfdbfe",
              }}
            >
              <span className="text-lg leading-none mt-0.5">
                {noneLabeled ? "1️⃣" : allLabeled && !saved ? "2️⃣" : allLabeled && saved ? "✅" : "1️⃣"}
              </span>
              <div>
                {noneLabeled && (
                  <p>
                    <strong>Next step: Auto Label</strong> — Click <em>Auto Label</em> to automatically analyze each song
                    (caption, BPM, key, etc.). This metadata is needed for training.
                  </p>
                )}
                {!noneLabeled && !allLabeled && !labeling && (
                  <p>
                    <strong>Some samples are not labeled yet.</strong> Click <em>Auto Label</em> to label the remaining songs,
                    or click a row to edit metadata manually.
                  </p>
                )}
                {allLabeled && !saved && (
                  <p>
                    <strong>Next step: Save</strong> — All songs are labeled. Click <em>Save</em> to save the dataset,
                    then go to <strong>Preprocess</strong>.
                  </p>
                )}
                {allLabeled && saved && (
                  <p>
                    <strong>Dataset ready!</strong> Go to <strong>2 Preprocess</strong> in the sidebar to continue.
                  </p>
                )}
              </div>
            </div>
          )}

          {labeling && labelStatus && (
            <Progress
              value={labelStatus.current ?? 0}
              max={labelStatus.total || 100}
              label={`Auto-labeling${labelStatus.progress ? ` — ${labelStatus.progress}` : ""}`}
              className="mb-4"
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">File</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Caption</th>
                  <th className="pb-2 font-medium">BPM</th>
                  <th className="pb-2 font-medium">Key</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s, i) => (
                  <tr
                    key={i}
                    onClick={() => setEditIdx(i)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium truncate max-w-48">{s.filename ?? s.audio_path?.split("/").pop()}</td>
                    <td className="py-2 tabular-nums">{s.duration ? `${s.duration.toFixed(1)}s` : "—"}</td>
                    <td className="py-2 text-gray-600 truncate max-w-64">{s.caption || "—"}</td>
                    <td className="py-2 tabular-nums">{s.bpm ?? "—"}</td>
                    <td className="py-2">{s.keyscale ?? "—"}</td>
                    <td className="py-2">
                      <Badge variant={s.labeled ? "success" : "default"}>
                        {s.labeled ? "Labeled" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {samples.length === 0 && !loading && (
        <EmptyState
          title="No samples loaded"
          description="Upload audio files or provide a path to get started"
        />
      )}

      {editIdx !== null && samples[editIdx] && (
        <SampleEditor
          sample={samples[editIdx]}
          idx={editIdx}
          onSave={handleSampleUpdate}
          onClose={() => setEditIdx(null)}
        />
      )}
    </div>
  );
}
