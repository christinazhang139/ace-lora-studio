"use client";

import { useRef, useState, useCallback } from "react";
import { cn, AudioPlayer } from "@ace/ui";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  className?: string;
}

export function AudioUploader({ onFileSelect, file, className }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback(
    (f: File) => {
      onFileSelect(f);
      setPreviewUrl(URL.createObjectURL(f));
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f?.type.startsWith("audio/")) handleFile(f);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
          onChange={handleChange}
          className="hidden"
        />
        <div className="text-4xl mb-2">🎵</div>
        <p className="text-sm font-medium text-gray-700">
          {file ? file.name : "Drop your audio here"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
            : "WAV, MP3, FLAC — drag & drop or click to browse"}
        </p>
      </div>

      {previewUrl && (
        <AudioPlayer src={previewUrl} title="Your audio" />
      )}
    </div>
  );
}
