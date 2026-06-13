"use client";

import { useState } from "react";
import { Dialog, Input, Textarea, Select, Button } from "@ace/ui";
import { VALID_KEYSCALES } from "@ace/ui";
import type { DatasetSample } from "@ace/ui";

interface SampleEditorProps {
  sample: DatasetSample;
  idx: number;
  onSave: (idx: number, patch: Partial<DatasetSample>) => void;
  onClose: () => void;
}

export function SampleEditor({ sample, idx, onSave, onClose }: SampleEditorProps) {
  const [caption, setCaption] = useState(sample.caption ?? "");
  const [genre, setGenre] = useState(sample.genre ?? "");
  const [lyrics, setLyrics] = useState(sample.lyrics ?? "");
  const [bpm, setBpm] = useState(sample.bpm?.toString() ?? "");
  const [key, setKey] = useState(sample.keyscale ?? "");

  const handleSave = () => {
    onSave(idx, {
      caption,
      genre,
      lyrics,
      bpm: bpm ? Number(bpm) : undefined,
      keyscale: key || undefined,
    });
  };

  return (
    <Dialog open onClose={onClose} title={`Edit Sample #${idx + 1}`}>
      <div className="space-y-4">
        <Textarea
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
        />
        <Input
          label="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="e.g. pop, rock, jazz"
        />
        <Textarea
          label="Lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={4}
          placeholder="Song lyrics or [Instrumental]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="BPM"
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            min={30}
            max={250}
          />
          <Select
            label="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            options={[
              { value: "", label: "Auto-detect" },
              ...VALID_KEYSCALES.map((k) => ({ value: k, label: k })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Dialog>
  );
}
