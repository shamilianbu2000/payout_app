import type { Role } from './types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3004';

export async function api<T>(path: string, role: Role, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'x-role': role, ...(init.headers as Record<string, string>) };
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = data.message;
    throw new Error(Array.isArray(m) ? m.join(', ') : m ?? `Request failed (${res.status})`);
  }
  return data as T;
}

/** Fetch a binary file with the role header and trigger a browser download. */
export async function download(path: string, role: Role, fallbackName: string): Promise<void> {
  const res = await fetch(BASE + path, { headers: { 'x-role': role } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Download failed (${res.status})`);
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
