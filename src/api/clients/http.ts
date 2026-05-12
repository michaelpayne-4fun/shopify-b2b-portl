import { ApiError, NetworkError } from '../errors/ApiError';

export interface HttpRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface HttpClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | undefined;
}

export interface HttpClient {
  request<T>(req: HttpRequest): Promise<T>;
}

export const createHttpClient = (options: HttpClientOptions = {}): HttpClient => {
  const base = options.baseUrl?.replace(/\/$/, '') ?? '';

  return {
    async request<T>({ url, method = 'GET', headers, body, signal }: HttpRequest): Promise<T> {
      const token = options.getAuthToken?.();
      const fullUrl = url.startsWith('http') ? url : `${base}${url}`;
      const finalHeaders: Record<string, string> = {
        'content-type': 'application/json',
        ...options.defaultHeaders,
        ...headers,
      };
      if (token) finalHeaders['authorization'] = `Bearer ${token}`;

      let response: Response;
      try {
        response = await fetch(fullUrl, {
          method,
          headers: finalHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal,
        });
      } catch (err) {
        throw new NetworkError('Network request failed', err);
      }

      const text = await response.text();
      const parsed = text ? safeJsonParse(text) : undefined;
      if (!response.ok) {
        throw new ApiError(response.statusText || `HTTP ${response.status}`, response.status, parsed);
      }
      return parsed as T;
    },
  };
};

const safeJsonParse = (s: string): unknown => {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};
