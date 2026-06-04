const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

let token: string | null = localStorage.getItem('mandarim_token');

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('mandarim_token', t);
  else localStorage.removeItem('mandarim_token');
}

export function getToken() {
  return token;
}

interface Opts {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth && token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Erro ${res.status}`);
  }
  return data as T;
}

export const API_BASE = BASE;
