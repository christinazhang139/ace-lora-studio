"use client";

import { useState, useEffect } from "react";
import { Button, Card, EmptyState, Input, AudioPlayer, Badge } from "@ace/ui";
import { audioUrl } from "@ace/ui";
import type { ParsedResult } from "@ace/ui";

interface HistoryEntry {
  id: string;
  result: ParsedResult;
  timestamp: number;
  prompt: string;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ace-muse-history") || "[]");
      setEntries(stored);
    } catch {}
  }, []);

  const filtered = search
    ? entries.filter(
        (e) =>
          e.result.prompt?.toLowerCase().includes(search.toLowerCase()) ||
          e.prompt?.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const handleClear = () => {
    localStorage.removeItem("ace-muse-history");
    setEntries([]);
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="Continue some music and it will appear here"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">History</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((entry) => {
          const paths = entry.result.raw_audio_paths ?? [];
          return (
            <Card key={entry.id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.prompt && <Badge variant="info">{entry.prompt.slice(0, 60)}{entry.prompt.length > 60 ? "..." : ""}</Badge>}
                    {entry.result.metas?.bpm && <Badge>{entry.result.metas.bpm} BPM</Badge>}
                    {entry.result.metas?.keyscale && <Badge>{entry.result.metas.keyscale}</Badge>}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {paths.map((path, j) => (
                  <div key={j}>
                    <AudioPlayer src={audioUrl(path)} />
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

      {filtered.length === 0 && search && (
        <EmptyState title="No matches" description={`No results matching "${search}"`} />
      )}
    </div>
  );
}
