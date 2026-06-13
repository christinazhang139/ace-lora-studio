import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";
import os from "os";

export const config = {
  api: { bodyParser: false },
};

export const maxDuration = 300;

const UPLOAD_BASE = path.join(os.homedir(), "ace-step", "uploads");

const AUDIO_EXTS = new Set([".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const datasetName = (formData.get("datasetName") as string) || "my_dataset";
  const clearExisting = formData.get("clearExisting") === "true";

  const safeName = datasetName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(UPLOAD_BASE, safeName);
  await mkdir(dir, { recursive: true });

  if (clearExisting) {
    try {
      const existing = await readdir(dir);
      for (const f of existing) {
        if (AUDIO_EXTS.has(path.extname(f).toLowerCase())) {
          await unlink(path.join(dir, f));
        }
      }
    } catch {}
  }

  const files: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === "files" && value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer());
      const safeFn = value.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const dest = path.join(dir, safeFn);
      await writeFile(dest, buffer);
      files.push(safeFn);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No audio files received" }, { status: 400 });
  }

  return NextResponse.json({ dir, files });
}
