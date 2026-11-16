import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { meFixture, mockApi, planFixture, renderApp, signIn } from '../utils'

describe('US-01 login', () => {
  it('shows the general error for wrong credentials', async () => {
    mockApi({
      'POST /auth/login': { status: 401, error: { code: 'INVALID_CREDENTIALS', message: 'x' } },
    })
    renderApp('/login')
    await userEvent.type(screen.getByLabelText('Email'), 'parent@mainstory.test')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect')
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('lands on Home in Parent view', async () => {
    mockApi({
      'POST /auth/login': { data: { access_token: 'a', refresh_token: 'r', parent_token: 'p' } },
      'GET /me': { data: meFixture() },
      'GET /books': { data: [] },
    })
    renderApp('/login')
    await userEvent.type(screen.getByLabelText('Email'), 'parent@mainstory.test')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('All books')).toBeInTheDocument()
    expect(localStorage.getItem('view_mode')).toBe('parent')
  })

  it('sends signed-out users to Login', async () => {
    mockApi({})
    const router = renderApp('/my-books')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})

describe('US-10 / US-11 subscription', () => {
  it('re-reads the plan when the price changed (CR-001 E-CR1)', async () => {
    signIn('parent')
    let price = 49000
    const calls = mockApi({
      'GET /me': { data: meFixture() },
      'GET /subscription/plan': () => ({ data: { ...planFixture, price } }),
      'POST /subscription-orders': () => {
        price = 59000
        return {
          status: 409,
          error: { code: 'PRICE_CHANGED', message: 'The subscription price has changed.' },
        }
      },
    })
    renderApp('/subscription')
    await userEvent.click(await screen.findByRole('button', { name: 'Checkout' }))
    expect(await screen.findByText('Rp 59.000')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('The subscription price has changed.')
    expect(calls.find((c) => c.path === '/subscription-orders')?.body).toMatchObject({
      expected_price: 49000,
    })
  })

  it('confirms before cancelling and keeps the plan when the parent backs out', async () => {
    signIn('parent')
    const sub = {
      id: 's1',
      price_paid: 49000,
      status: 'active' as const,
      started_at: '2026-11-16T00:00:00Z',
      expires_at: '2026-12-16T00:00:00Z',
      cancelled_at: null,
      next_renewal_price: 59000,
      price_change_pending: true,
    }
    const calls = mockApi({
      'GET /me': { data: meFixture({ plan_status: 'subscribed', subscription: sub }) },
      'GET /subscription/plan': { data: planFixture },
    })
    renderApp('/subscription')
    expect(await screen.findByText(/will change from Rp 49.000 to Rp 59.000/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }))
    expect(screen.getByRole('dialog', { name: 'Cancel subscription?' })).toHaveTextContent(
      "Books you didn't buy will lock right away.",
    )
    await userEvent.click(screen.getByRole('button', { name: 'Keep subscription' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls.some((c) => c.path === '/subscriptions/current/cancel')).toBe(false)
  })
})

describe('US-14 settings', () => {
  it('asks for the password when changing an existing PIN', async () => {
    signIn('parent')
    const calls = mockApi({
      'GET /me': { data: meFixture({ pin_set: true }) },
      'PUT /me/pin': { status: 401, error: { code: 'INVALID_PASSWORD', message: 'x' } },
    })
    renderApp('/settings/pin')
    await userEvent.type(await screen.findByLabelText('New PIN'), '1234')
    await userEvent.type(screen.getByLabelText('Confirm PIN'), '1234')
    await userEvent.click(screen.getByRole('button', { name: 'Save PIN' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your account password')
    await userEvent.type(screen.getByLabelText('Account password'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Save PIN' }))
    expect(await screen.findByText('That password is incorrect.')).toBeInTheDocument()
    expect(calls.find((c) => c.path === '/me/pin')?.body).toEqual({
      pin: '1234',
      pin_confirmation: '1234',
      password: 'nope',
    })
  })

  it('rejects mismatched PINs before calling the API', async () => {
    signIn('parent')
    const calls = mockApi({ 'GET /me': { data: meFixture({ pin_set: false }) } })
    renderApp('/settings/pin')
    await userEvent.type(await screen.findByLabelText('New PIN'), '1234')
    await userEvent.type(screen.getByLabelText('Confirm PIN'), '4321')
    await userEvent.click(screen.getByRole('button', { name: 'Save PIN' }))
    expect(screen.getByRole('alert')).toHaveTextContent("The PINs don't match")
    expect(calls.some((c) => c.path === '/me/pin')).toBe(false)
  })

  it('shows empty order history', async () => {
    signIn('parent')
    mockApi({ 'GET /me': { data: meFixture() }, 'GET /book-orders': { data: [] } })
    renderApp('/settings/orders')
    expect(await screen.findByText('No orders yet')).toBeInTheDocument()
  })
})
