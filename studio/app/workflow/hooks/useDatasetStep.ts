"use client";

import { useState, useCallback } from "react";
import type { DatasetSample, AutoLabelStatus } from "@ace/ui";
import { usePolling } from "@ace/ui";
import {
  scanDirectory,
  loadDataset,
  saveDataset,
  getSamples,
  startAutoLabel,
  getAutoLabelStatus,
  updateSample,
} from "../../lib/api";

export function useDatasetStep() {
  const [tab, setTab] = useState<"upload" | "path" | "json">("upload");
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

  const doScan = useCallback(
    async (dir: string) => {
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
    },
    [datasetName],
  );

  const handleScan = useCallback(() => {
    if (scanDir) doScan(scanDir);
  }, [scanDir, doScan]);

  const handleUploadDone = useCallback(
    (dir: string) => {
      setScanDir(dir);
      doScan(dir);
    },
    [doScan],
  );

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
  const isComplete = allLabeled && saved;
  const summary = isComplete ? `${samples.length} samples, all labeled` : "";

  return {
    tab, setTab,
    datasetName, setDatasetName,
    scanDir, setScanDir,
    jsonPath, setJsonPath,
    samples, loading, error,
    editIdx, setEditIdx,
    labelStatus, labeling,
    saving, saved,
    allLabeled,
    isComplete,
    summary,
    handleScan,
    handleUploadDone,
    handleLoad,
    handleAutoLabel,
    handleSave,
    handleSampleUpdate,
  };
}
