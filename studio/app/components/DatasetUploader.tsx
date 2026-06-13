"use client";

import { useRef, useState, useCallback } from "react";
import { cn, Button, Spinner, Progress } from "@ace/ui";

interface DatasetUploaderProps {
  datasetName: string;
  onUploaded: (dir: string) => void;
}

interface QueuedFile {
  file: File;
  id: string;
}

export function DatasetUploader({ datasetName, onUploaded }: DatasetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [queued, setQueued] = useState<QueuedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clearExisting, setClearExisting] = useState(true);

  const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const audio = Array.from(fileList).filter((f) => f.type.startsWith("audio/"));
    if (audio.length === 0) return;
    setQueued((prev) => {
      const existing = new Set(prev.map((q) => q.file.name));
      const fresh = audio
        .filter((f) => !existing.has(f.name))
        .map((f) => ({ file: f, id: makeId() }));
      return [...prev, ...fresh];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles],
  );

  const removeFile = useCallback((id: string) => {
    setQueued((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleUpload = useCallback(async () => {
    if (queued.length === 0) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    let lastDir = "";
    try {
      for (let i = 0; i < queued.length; i++) {
        const formData = new FormData();
        formData.append("datasetName", datasetName);
        formData.append("files", queued[i].file);
        if (i === 0 && clearExisting) formData.append("clearExisting", "true");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(`Upload failed for ${queued[i].file.name}: ${text}`);
        }
        const data = await res.json();
        lastDir = data.dir;
        setUploadProgress(i + 1);
      }
      setQueued([]);
      onUploaded(lastDir);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [queued, datasetName, onUploaded]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          dragOver ? "border-accent bg-accent/5" : "border-gray-200 hover:border-gray-300",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <div className="text-3xl mb-2">+</div>
        <p className="text-sm font-medium text-gray-700">
          Drop audio files here or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">WAV, MP3, FLAC — no limit on number of files</p>
      </div>

      {queued.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">{queued.length} file{queued.length > 1 ? "s" : ""} selected</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {queued.map((q) => (
              <div key={q.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <span className="truncate mr-3">{q.file.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{formatSize(q.file.size)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(q.id); }}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {uploading && (
            <Progress
              value={uploadProgress}
              max={queued.length}
              label={`Uploading ${uploadProgress}/${queued.length}...`}
            />
          )}

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} className="accent-blue-600" />
            Replace existing files (clear old uploads first)
          </label>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? <Spinner size="sm" /> : `Upload ${queued.length} File${queued.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
