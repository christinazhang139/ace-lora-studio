import { apiPost, apiGet } from "@ace/ui";
import type {
  ReleaseTaskResponse,
  QueryResultItem,
  LoraStatus,
} from "@ace/ui";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function releaseTaskWithAudio(formData: FormData) {
  const res = await fetch(`${BASE_URL}/release_task`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json as { data: ReleaseTaskResponse; code: number };
}

export async function queryResult(taskIds: string[]) {
  return apiPost<QueryResultItem[]>("/query_result", { task_ids: taskIds });
}

export async function loadLora(path: string) {
  return apiPost("/v1/lora/load", { path });
}

export async function unloadLora() {
  return apiPost("/v1/lora/unload");
}

export async function toggleLora(enabled: boolean) {
  return apiPost("/v1/lora/toggle", { enabled });
}

export async function setLoraScale(scale: number) {
  return apiPost("/v1/lora/scale", { scale });
}

export async function getLoraStatus() {
  return apiGet<LoraStatus>("/v1/lora/status");
}
