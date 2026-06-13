"use client";

import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { cn } from "../lib/cn";

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, title, className }: AudioPlayerProps) {
  const { playing, currentTime, duration, toggle, seek } = useAudioPlayer(src);

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50", className)}>
      <button
        onClick={toggle}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="4" height="12" rx="1" />
            <rect x="8" y="1" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9-5.5z" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium text-gray-900 truncate">{title}</p>}
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 accent-blue-600"
        />
      </div>

      <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
