import { env } from '@/config/env'
import { supabase } from '@/lib/supabase'

/** Error thrown by `apiFetch`, carrying the HTTP status. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  signal?: AbortSignal
}

/**
 * Thin fetch wrapper for the FastAPI backend.
 *
 * It attaches the current Supabase access token as a Bearer header and turns
 * non-2xx responses into `ApiError` (using the API's `{ detail }` message).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let fetchBody: BodyInit | undefined
  if (options.form !== undefined) {
    // Let the browser set the multipart boundary.
    fetchBody = options.form
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    fetchBody = JSON.stringify(options.body)
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: fetchBody,
    signal: options.signal,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: unknown }
      if (typeof payload.detail === 'string') message = payload.detail
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
