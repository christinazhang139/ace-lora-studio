"use client";

import { Button, Card, Input, Badge, Progress, Spinner, EmptyState, StatusBanner } from "@ace/ui";
import { SampleEditor } from "../../components/SampleEditor";
import { DatasetUploader } from "../../components/DatasetUploader";
import type { useDatasetStep } from "../hooks/useDatasetStep";

type DatasetStepProps = ReturnType<typeof useDatasetStep>;

export function DatasetStepContent(props: DatasetStepProps) {
  const {
    tab, setTab,
    datasetName, setDatasetName,
    scanDir, setScanDir,
    jsonPath, setJsonPath,
    samples, loading, error,
    editIdx, setEditIdx,
    labelStatus, labeling,
    saving, saved,
    allLabeled,
    handleScan, handleUploadDone, handleLoad,
    handleAutoLabel, handleSave, handleSampleUpdate,
  } = props;

  const noneLabeled = samples.length > 0 && samples.every((s) => !s.labeled);

  const tabClass = (id: typeof tab) =>
    `px-4 py-2.5 text-sm font-medium transition-colors -mb-px cursor-pointer ${
      tab === id
        ? "text-blue-600 border-b-2 border-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="space-y-4">
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
                {saving ? <Spinner size="sm" /> : saved ? "Saved" : "Save"}
              </Button>
            </div>
          }
        >
          {!labeling && (
            <div
              className="rounded-lg border px-4 py-3 mb-4 text-sm flex items-start gap-3"
              style={{
                backgroundColor: allLabeled && saved ? "#f0fdf4" : "#eff6ff",
                borderColor: allLabeled && saved ? "#bbf7d0" : "#bfdbfe",
              }}
            >
              <span className="text-lg leading-none mt-0.5">
                {noneLabeled ? "1" : allLabeled && !saved ? "2" : allLabeled && saved ? "OK" : "1"}
              </span>
              <div>
                {noneLabeled && <p><strong>Auto Label</strong> — Click Auto Label to analyze each song.</p>}
                {!noneLabeled && !allLabeled && !labeling && <p><strong>Some samples not labeled.</strong> Click Auto Label or edit manually.</p>}
                {allLabeled && !saved && <p><strong>Save</strong> — All labeled. Click Save to continue.</p>}
                {allLabeled && saved && <p><strong>Dataset ready!</strong> Preprocess will unlock below.</p>}
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
