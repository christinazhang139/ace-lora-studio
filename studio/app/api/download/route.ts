import { NextRequest, NextResponse } from "next/server";
import { stat, readdir } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import os from "os";

const SAFE_ROOT = process.env.ACESTEP_SAFE_ROOT || os.homedir();

function isSafePath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(path.resolve(SAFE_ROOT));
}

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  if (!isSafePath(filePath)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const info = await stat(filePath);

    if (info.isDirectory()) {
      const files = await readdir(filePath);
      const safetensors = files.find(f => f.endsWith(".safetensors"));
      if (!safetensors) {
        return NextResponse.json({ error: "No .safetensors file found in directory" }, { status: 404 });
      }
      const actualPath = path.join(filePath, safetensors);
      return serveFile(actualPath, safetensors, (await stat(actualPath)).size);
    }

    return serveFile(filePath, path.basename(filePath), info.size);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

function serveFile(filePath: string, fileName: string, size: number) {
  const stream = createReadStream(filePath);
  const readable = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new NextResponse(readable as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(size),
    },
  });
}
