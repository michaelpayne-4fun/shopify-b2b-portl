import { appConfig } from '@/app/config/env';

export class BffError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = 'BffError';
  }
}

type Body = unknown;

const request = async <T>(method: string, path: string, body?: Body): Promise<T> => {
  const res = await fetch(`${appConfig.bffUrl}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const contentType = res.headers.get('content-type') ?? '';
  let data: unknown;
  if (text && contentType.includes('application/json')) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }
  if (!res.ok) {
    const err = (data as { error?: string; message?: string }) ?? {};
    const fallback = text ? text.slice(0, 300) : res.statusText;
    throw new BffError(err.message ?? fallback, res.status, err.error);
  }
  return data as T;
};

export const bff = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Body) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: Body) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: Body) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
