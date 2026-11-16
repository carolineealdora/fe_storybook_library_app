import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { bookFixture, meFixture, mockApi, planFixture, renderApp, signIn } from '../utils'

describe('US-04 showcase (parent)', () => {
  it('shows price, Free and Owned labels and only locks books the user cannot read', async () => {
    signIn('parent')
    mockApi({
      'GET /me': { data: meFixture() },
      'GET /subscription/plan': { data: planFixture },
      'GET /books': {
        data: [
          bookFixture(),
          bookFixture({ id: 'b2', title: 'The Sleepy Moon', price: 0, access: 'free' }),
          bookFixture({ id: 'b3', title: 'Rainbow Garden', access: 'owned' }),
        ],
      },
    })
    renderApp('/')
    expect(
      await screen.findByRole('button', {
        name: 'Kiko the Little Duck, ages 1–3, locked, Rp 29.000',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'The Sleepy Moon, ages 1–3, Free' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Rainbow Garden, ages 1–3, Owned' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Read every book for Rp 49.000/month')).toBeInTheDocument()
    expect(screen.getByText('Free', { selector: 'header span' })).toBeInTheDocument()
  })

  it('shows the Subscribed badge and no banner for subscribers (CR-001-1)', async () => {
    signIn('parent')
    mockApi({
      'GET /me': { data: meFixture({ plan_status: 'subscribed' }) },
      'GET /books': { data: [bookFixture({ access: 'subscribed' })] },
    })
    renderApp('/')
    await screen.findByRole('button', { name: /Kiko the Little Duck/ })
    expect(screen.getByText('Subscribed', { selector: 'header span' })).toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', { name: 'Subscription offer' }),
    ).not.toBeInTheDocument()
  })

  it('shows an error with retry when books fail to load', async () => {
    signIn('parent')
    mockApi({
      'GET /me': { data: meFixture() },
      'GET /books': { status: 500, error: { code: 'GENERAL_ERROR', message: 'Server hiccup' } },
    })
    renderApp('/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Server hiccup')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

describe('US-06 book detail buttons', () => {
  const setup = (access: 'locked' | 'subscribed' | 'owned' | 'free') => {
    signIn('parent')
    mockApi({
      'GET /me': { data: meFixture() },
      'GET /subscription/plan': { data: planFixture },
      'GET /books/b-kiko': { data: bookFixture({ access }) },
    })
    renderApp('/books/b-kiko')
  }

  it('locked → Buy Now + subscription prompt', async () => {
    setup('locked')
    expect(await screen.findByRole('button', { name: 'Buy Now' })).toBeEnabled()
    expect(
      await screen.findByRole('link', { name: /Read all books for Rp 49.000\/month/ }),
    ).toHaveAttribute('href', '/subscription')
  })

  it('subscribed → disabled Subscribed + Read', async () => {
    setup('subscribed')
    expect(await screen.findByRole('button', { name: 'Subscribed' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Read' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buy Now' })).not.toBeInTheDocument()
  })

  it.each(['owned', 'free'] as const)('%s → Read only', async (access) => {
    setup(access)
    expect(await screen.findByRole('link', { name: 'Read' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buy Now' })).not.toBeInTheDocument()
  })
})

describe('US-09 buy one book', () => {
  it('creates one order, pays once on a double tap, and shows success', async () => {
    signIn('parent')
    let release: () => void = () => {}
    const paid = new Promise<void>((r) => (release = r))
    const calls = mockApi({
      'GET /me': { data: meFixture() },
      'GET /subscription/plan': { data: planFixture },
      'GET /books/b-kiko': { data: bookFixture() },
      'POST /book-orders': {
        data: {
          id: 'o1',
          book_id: 'b-kiko',
          book_title: 'Kiko the Little Duck',
          price: 29000,
          status: 'pending',
          created_at: '2026-11-16T00:00:00Z',
        },
      },
      'POST /book-orders/o1/pay': async () => {
        await paid
        return {
          data: {
            id: 'o1',
            book_id: 'b-kiko',
            book_title: 'Kiko the Little Duck',
            price: 29000,
            status: 'paid',
            created_at: '2026-11-16T00:00:00Z',
          },
        }
      },
    })
    renderApp('/books/b-kiko')
    await userEvent.click(await screen.findByRole('button', { name: 'Buy Now' }))
    const pay = await screen.findByRole('button', { name: 'Pay Rp 29.000' })
    await userEvent.dblClick(pay)
    release()
    expect(
      await screen.findByRole('heading', { name: 'Kiko the Little Duck is yours!' }),
    ).toBeInTheDocument()
    expect(calls.filter((c) => c.path === '/book-orders/o1/pay')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Read Now' })).toHaveAttribute(
      'href',
      '/books/b-kiko/read',
    )
  })

  it('shows the failure screen and retries with a new order (E9)', async () => {
    signIn('parent')
    let order = 0
    const calls = mockApi({
      'GET /me': { data: meFixture() },
      'GET /books/b-kiko': { data: bookFixture() },
      'POST /book-orders': () => {
        order += 1
        return {
          data: {
            id: `o${order}`,
            book_id: 'b-kiko',
            book_title: 'Kiko the Little Duck',
            price: 29000,
            status: 'pending',
            created_at: '2026-11-16T00:00:00Z',
          },
        }
      },
      'POST /book-orders/o1/pay': {
        status: 402,
        error: { code: 'PAYMENT_FAILED', message: 'Payment failed.' },
      },
    })
    renderApp('/books/b-kiko')
    await userEvent.click(await screen.findByRole('button', { name: 'Buy Now' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Simulate failed payment' }))
    expect(
      await screen.findByRole('heading', { name: "Payment didn't go through" }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Back to Checkout' }))
    expect(await screen.findByRole('button', { name: 'Pay Rp 29.000' })).toBeInTheDocument()
    await waitFor(() => expect(calls.filter((c) => c.path === '/book-orders')).toHaveLength(2))
  })
})

describe('US-08 My Book', () => {
  it('shows an empty state that leads Home', async () => {
    signIn('parent')
    mockApi({
      'GET /me': { data: meFixture({ plan_status: 'subscribed' }) },
      'GET /me/books': { data: [] },
    })
    renderApp('/my-books')
    expect(await screen.findByText('No books bought yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/')
  })
})

describe('US-07 reader', () => {
  it('shows a kind locked screen with no price in Child view (E18)', async () => {
    signIn('child')
    mockApi({
      'GET /me': { data: meFixture() },
      'GET /books/b-kiko': { data: bookFixture() },
      'GET /books/b-kiko/content': { status: 403, error: { code: 'BOOK_LOCKED', message: 'x' } },
    })
    renderApp('/books/b-kiko/read')
    expect(await screen.findByRole('heading', { name: 'This book is locked' })).toBeInTheDocument()
    expect(screen.getByText('Ask your parent to unlock this book.')).toBeInTheDocument()
    expect(screen.queryByText(/Rp/)).not.toBeInTheDocument()
  })
})
