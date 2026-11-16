import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { bookFixture, meFixture, mockApi, renderApp, signIn } from '../utils'

const books = [
  bookFixture(),
  bookFixture({ id: 'b-moon', title: 'The Sleepy Moon', price: 0, access: 'free' }),
]

describe('US-03 view mode', () => {
  it('asks for a PIN in Settings first when none is set (E11)', async () => {
    signIn('parent')
    mockApi({ 'GET /me': { data: meFixture({ pin_set: false }) }, 'GET /books': { data: books } })
    renderApp('/')
    await screen.findByRole('button', { name: /Kiko the Little Duck/ })
    await userEvent.click(screen.getByRole('button', { name: 'Child' }))
    expect(await screen.findByRole('dialog', { name: 'Set a PIN first' })).toBeInTheDocument()
    expect(localStorage.getItem('view_mode')).toBe('parent')
  })

  it('switches to Child view without a PIN and drops the parent token', async () => {
    signIn('parent')
    mockApi({ 'GET /me': { data: meFixture() }, 'GET /books': { data: books } })
    renderApp('/')
    await screen.findByText('All books')
    await userEvent.click(screen.getByRole('button', { name: 'Child' }))
    expect(await screen.findByText('Pick a story!')).toBeInTheDocument()
    expect(localStorage.getItem('parent_token')).toBeNull()
    expect(screen.queryByText('Rp 29.000')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Settings/ })).not.toBeInTheDocument()
  })

  it('shows a friendly, price-free message when a child taps a locked book (US-05)', async () => {
    signIn('child')
    mockApi({ 'GET /me': { data: meFixture() }, 'GET /books': { data: books } })
    renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: /Kiko the Little Duck/ }))
    expect(screen.getByRole('dialog', { name: 'This book is still locked' })).toHaveTextContent(
      'Ask your parent to unlock this book.',
    )
  })

  it('needs the right PIN to get back to Parent view, and locks after too many tries (E12)', async () => {
    signIn('child')
    let tries = 0
    mockApi({
      'GET /me': { data: meFixture() },
      'GET /books': { data: books },
      'POST /me/pin/verify': ({ body }) => {
        tries += 1
        if ((body as { pin: string }).pin === '1234') return { data: { parent_token: 'parent-2' } }
        if (tries >= 2) return { status: 429, error: { code: 'TOO_MANY_ATTEMPTS', message: 'x' } }
        return { status: 401, error: { code: 'INVALID_PIN', message: 'PIN is incorrect.' } }
      },
    })
    renderApp('/')
    await screen.findByText('Pick a story!')
    await userEvent.click(screen.getByRole('button', { name: 'Parent' }))
    const dialog = await screen.findByRole('dialog', { name: 'Enter parent PIN' })
    expect(dialog).toBeInTheDocument()

    await userEvent.keyboard('9999')
    expect(
      await screen.findByText('Wrong PIN. 4 tries left before a 1-minute lock.'),
    ).toBeInTheDocument()
    expect(localStorage.getItem('view_mode')).toBe('child')

    await userEvent.keyboard('8888')
    expect(await screen.findByText(/Too many wrong tries/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled()
  })

  it('returns to Parent view with the correct PIN', async () => {
    signIn('child')
    mockApi({
      'GET /me': { data: meFixture() },
      'GET /books': { data: books },
      'POST /me/pin/verify': { data: { parent_token: 'parent-2' } },
    })
    renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Parent' }))
    await userEvent.keyboard('1234')
    await waitFor(() => expect(localStorage.getItem('parent_token')).toBe('parent-2'))
    expect(await screen.findByText('All books')).toBeInTheDocument()
  })

  it('keeps Child view out of parent-only screens', async () => {
    signIn('child')
    mockApi({ 'GET /me': { data: meFixture() }, 'GET /books': { data: books } })
    const router = renderApp('/settings')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
