export interface ApiResponse<T> {
  data: T;
  code: number;
  error: string | null;
  timestamp: number;
  extra: unknown;
}

const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8001`)
    : "http://localhost:8001";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_KEY
    : undefined;
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export function audioUrl(path: string): string {
  const encoded = encodeURIComponent(path);
  return `${BASE_URL}/v1/audio?path=${encoded}`;
}
