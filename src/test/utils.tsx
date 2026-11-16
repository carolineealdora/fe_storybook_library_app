import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { SessionProvider } from '../features/session/SessionProvider'
import type { Book, Me } from '../lib/api/types'
import { routes } from '../router'

export interface Call {
  method: string
  path: string
  body: unknown
  headers: Record<string, string>
}

type Reply = { status?: number; data?: unknown; error?: { code: string; message: string } }
type Route = Reply | ((call: Call) => Reply | Promise<Reply>)

/** Stub `fetch` at the network boundary. Keys look like "GET /books". Unmatched → 404. */
export function mockApi(table: Record<string, Route>): Call[] {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = new URL(String(input))
      const call: Call = {
        method: init.method ?? 'GET',
        path: url.pathname.replace(/^\/api\/v1/, ''),
        body: init.body ? JSON.parse(String(init.body)) : undefined,
        headers: (init.headers as Record<string, string>) ?? {},
      }
      calls.push(call)
      const route = table[`${call.method} ${call.path}`]
      const reply: Reply = !route
        ? { status: 404, error: { code: 'NOT_FOUND', message: 'Not found' } }
        : typeof route === 'function'
          ? await route(call)
          : route
      const status = reply.status ?? (reply.error ? 400 : 200)
      const body = reply.error ? { error: reply.error } : { data: reply.data }
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
  return calls
}

export function signIn(mode: 'parent' | 'child' = 'parent') {
  localStorage.setItem('access_token', 'access-1')
  localStorage.setItem('refresh_token', 'refresh-1')
  localStorage.setItem('view_mode', mode)
  if (mode === 'parent') localStorage.setItem('parent_token', 'parent-1')
}

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>,
  )
  return router
}

export const meFixture = (over: Partial<Me> = {}): Me => ({
  id: 'u1',
  name: 'Demo Parent',
  email: 'parent@mainstory.test',
  pin_set: true,
  plan_status: 'free',
  is_subscriber: false,
  subscription: null,
  ...over,
})

export const bookFixture = (over: Partial<Book> = {}): Book => ({
  id: 'b-kiko',
  title: 'Kiko the Little Duck',
  author: 'Dimas Arya',
  description: 'Kiko is the smallest duck on the pond.',
  age_label: '1–3',
  price: 29000,
  access: 'locked',
  ...over,
})

export const planFixture = { id: 'p1', price: 49000, benefits: 'Read all books. Cancel anytime.' }
