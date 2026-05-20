/**
 * Tiny typed wrapper around fetch() that:
 *   1. Attaches the Clerk session token as a Bearer header when available
 *   2. JSON-encodes request bodies
 *   3. Throws a typed ApiClientError on non-2xx so callers can show good
 *      error messages
 *
 * Used by EntitlementLoader, the upgrade flow, and the cloud save service.
 */

import type { ApiError } from '../shared/api-types';

/** Function that returns a fresh Clerk JWT, or null when unauthenticated. */
export type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = async () => null;

/**
 * Called once at app boot by the AuthBridge component, which has access to
 * Clerk's `useAuth().getToken`. Stashing the function here lets non-React
 * modules (the cloud save service) make authenticated requests without
 * threading hooks through every layer.
 */
export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

export class ApiClientError extends Error {
  status: number;
  code?: ApiError['code'];

  constructor(message: string, status: number, code?: ApiError['code']) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Set false to skip the auth header (used by anonymous probes). */
  authenticated?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, authenticated = true } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (authenticated) {
    const token = await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errBody: ApiError | undefined;
    try {
      errBody = (await res.json()) as ApiError;
    } catch {
      /* response wasn't json */
    }
    throw new ApiClientError(
      errBody?.error ?? `Request failed (${res.status})`,
      res.status,
      errBody?.code
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
