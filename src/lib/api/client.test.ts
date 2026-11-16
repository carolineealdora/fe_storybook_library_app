import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '../../test/utils'
import { request, setApiHandlers } from './client'
import { isAnyObject } from './types'

describe('api client', () => {
  const onAuthLost = vi.fn()
  const onParentRequired = vi.fn()

  beforeEach(() => {
    setApiHandlers({ onAuthLost, onParentRequired })
    localStorage.setItem('access_token', 'old')
    localStorage.setItem('refresh_token', 'refresh-1')
    localStorage.setItem('parent_token', 'parent-1')
  })

  it('sends the bearer and parent tokens', async () => {
    const calls = mockApi({ 'GET /me': { data: {} } })
    await request('/me', isAnyObject)
    expect(calls[0]?.headers).toMatchObject({
      Authorization: 'Bearer old',
      'X-Parent-Token': 'parent-1',
    })
  })

  it('refreshes once for concurrent TOKEN_EXPIRED responses, then retries', async () => {
    const calls = mockApi({
      'GET /me': ({ headers }) =>
        headers.Authorization === 'Bearer new'
          ? { data: { ok: true } }
          : { status: 401, error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
      'POST /auth/refresh': { data: { access_token: 'new' } },
    })
    const results = await Promise.all([request('/me', isAnyObject), request('/me', isAnyObject)])
    expect(results).toEqual([{ ok: true }, { ok: true }])
    expect(calls.filter((c) => c.path === '/auth/refresh')).toHaveLength(1)
    expect(localStorage.getItem('access_token')).toBe('new')
  })

  it('reports a lost session when the refresh token has expired', async () => {
    mockApi({
      'GET /me': { status: 401, error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
      'POST /auth/refresh': { status: 401, error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'x' } },
    })
    await expect(request('/me', isAnyObject)).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_EXPIRED',
    })
    expect(onAuthLost).toHaveBeenCalledOnce()
  })

  it('asks for the PIN on PARENT_MODE_REQUIRED', async () => {
    mockApi({
      'POST /book-orders': { status: 403, error: { code: 'PARENT_MODE_REQUIRED', message: 'x' } },
    })
    await expect(
      request('/book-orders', isAnyObject, { method: 'POST', body: {} }),
    ).rejects.toMatchObject({
      code: 'PARENT_MODE_REQUIRED',
    })
    expect(onParentRequired).toHaveBeenCalledOnce()
  })

  it('rejects a response that does not match the expected shape', async () => {
    mockApi({ 'GET /me': { data: 'nope' } })
    await expect(request('/me', isAnyObject)).rejects.toMatchObject({ code: 'BAD_RESPONSE' })
  })
})
