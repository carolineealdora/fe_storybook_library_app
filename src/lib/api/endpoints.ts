import { request, requestBlob } from './client'
import {
  isAnyObject,
  isBook,
  isBookOrder,
  isLoginResult,
  isMe,
  isParentTokenResult,
  isPlan,
  isSubscription,
  isSubscriptionOrder,
  listOf,
} from './types'

// ponytail: lists ask for one page of 100 (the API max); add paging UI when a family has more.
const PAGE = '?page=1&page_size=100'

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', isLoginResult, {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
  logout: (refreshToken: string) =>
    request('/auth/logout', isAnyObject, { method: 'POST', body: { refresh_token: refreshToken } }),

  me: () => request('/me', isMe),
  updateName: (name: string) => request('/me', isMe, { method: 'PATCH', body: { name } }),
  setPin: (pin: string, pinConfirmation: string, password?: string) =>
    request('/me/pin', isAnyObject, {
      method: 'PUT',
      body: { pin, pin_confirmation: pinConfirmation, ...(password ? { password } : {}) },
    }),
  verifyPin: (pin: string) =>
    request('/me/pin/verify', isParentTokenResult, { method: 'POST', body: { pin } }),
  forgotPin: (password: string) =>
    request('/me/pin/forgot', isParentTokenResult, { method: 'POST', body: { password } }),

  books: () => request(`/books${PAGE}`, listOf(isBook)),
  book: (id: string) => request(`/books/${encodeURIComponent(id)}`, isBook),
  cover: (id: string) => requestBlob(`/books/${encodeURIComponent(id)}/cover`),
  content: (id: string) => requestBlob(`/books/${encodeURIComponent(id)}/content`),
  myBooks: () => request(`/me/books${PAGE}`, listOf(isBook)),

  createBookOrder: (bookId: string) =>
    request('/book-orders', isBookOrder, {
      method: 'POST',
      body: { book_id: bookId, idempotency_key: crypto.randomUUID() },
    }),
  payBookOrder: (orderId: string, result: 'success' | 'failed') =>
    request(`/book-orders/${encodeURIComponent(orderId)}/pay`, isBookOrder, {
      method: 'POST',
      body: { result },
    }),
  bookOrders: () => request(`/book-orders${PAGE}`, listOf(isBookOrder)),

  plan: () => request('/subscription/plan', isPlan),
  createSubscriptionOrder: (expectedPrice: number) =>
    request('/subscription-orders', isSubscriptionOrder, {
      method: 'POST',
      body: { idempotency_key: crypto.randomUUID(), expected_price: expectedPrice },
    }),
  paySubscriptionOrder: (orderId: string, result: 'success' | 'failed') =>
    request(`/subscription-orders/${encodeURIComponent(orderId)}/pay`, isSubscription, {
      method: 'POST',
      body: { result },
    }),
  cancelSubscription: () =>
    request('/subscriptions/current/cancel', isSubscription, { method: 'POST' }),
  subscriptions: () => request(`/subscriptions${PAGE}`, listOf(isSubscription)),
}
