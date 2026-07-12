export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080/api/v1";

export async function apiFetchJson<T>(path: string, init: RequestInit = {}, token = "", fallbackError = ""): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error((data.error ?? fallbackError) || `HTTP ${response.status}`);
  }
  return data as T;
}

export async function uploadImageFile(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "上传失败");
  }
  return data.url;
}
