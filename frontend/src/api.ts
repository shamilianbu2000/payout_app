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
