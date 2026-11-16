import { readStore, writeStore } from '../storage'
import { ApiError, toApiError } from './errors'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:9999/api/v1'

interface Handlers {
  /** Refresh token expired or revoked: the user must log in again. */
  onAuthLost: () => void
  /** A 🔒P route was called without a valid parent token. */
  onParentRequired: () => void
}

let handlers: Handlers = { onAuthLost: () => {}, onParentRequired: () => {} }

export function setApiHandlers(h: Handlers): void {
  handlers = h
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Public endpoints (login) skip the bearer header and the session-loss handling. */
  auth?: boolean
}

let refreshing: Promise<boolean> | null = null

// Concurrent 401 TOKEN_EXPIRED responses share one refresh call.
function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = readStore('refresh_token')
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return false
      const json: unknown = await res.json()
      const token = readDataField(json, 'access_token')
      if (typeof token !== 'string') return false
      writeStore('access_token', token)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

function readDataField(json: unknown, field: string): unknown {
  if (typeof json !== 'object' || json === null || !('data' in json)) return undefined
  const data = json.data
  if (typeof data !== 'object' || data === null) return undefined
  return (data as Record<string, unknown>)[field]
}

async function readError(res: Response): Promise<ApiError> {
  try {
    const json: unknown = await res.json()
    if (typeof json === 'object' && json !== null && 'error' in json) {
      const err = json.error as { code?: unknown; message?: unknown }
      if (typeof err.code === 'string') {
        return new ApiError(
          res.status,
          err.code,
          typeof err.message === 'string' ? err.message : 'Something went wrong.',
        )
      }
    }
  } catch {
    // fall through to the generic error
  }
  return new ApiError(res.status, 'GENERAL_ERROR', 'Something went wrong. Please try again.')
}

async function send(path: string, opts: RequestOptions, retried = false): Promise<Response> {
  const auth = opts.auth ?? true
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const access = readStore('access_token')
    if (access) headers.Authorization = `Bearer ${access}`
    const parent = readStore('parent_token')
    if (parent) headers['X-Parent-Token'] = parent
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })
  } catch (e) {
    throw toApiError(e)
  }
  if (res.ok) return res

  const err = await readError(res)
  if (auth && err.code === 'TOKEN_EXPIRED' && !retried) {
    if (await refreshAccessToken()) return send(path, opts, true)
    handlers.onAuthLost()
    throw new ApiError(401, 'REFRESH_TOKEN_EXPIRED', 'Your session has ended. Please log in again.')
  }
  if (auth && (err.code === 'REFRESH_TOKEN_EXPIRED' || err.code === 'UNAUTHORIZED')) {
    handlers.onAuthLost()
  }
  if (err.code === 'PARENT_MODE_REQUIRED') handlers.onParentRequired()
  throw err
}

/** JSON request; returns the `data` field after checking its shape with `guard`. */
export async function request<T>(
  path: string,
  guard: (v: unknown) => v is T,
  opts: RequestOptions = {},
): Promise<T> {
  const res = await send(path, opts)
  const json: unknown = await res.json().catch(() => undefined)
  const data = typeof json === 'object' && json !== null && 'data' in json ? json.data : undefined
  if (!guard(data)) {
    throw new ApiError(res.status, 'BAD_RESPONSE', 'Something went wrong. Please try again.')
  }
  return data
}

/** Binary request (covers, EPUB): needs the bearer header, so <img src> can't fetch it directly. */
export async function requestBlob(path: string): Promise<Blob> {
  const res = await send(path, {})
  return res.blob()
}
