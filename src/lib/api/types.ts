// Shapes from ../storybook_library_app/docs/API-contracts.md, with guards that check them at the boundary.

export type BookAccess = 'free' | 'owned' | 'subscribed' | 'locked'

export interface Book {
  id: string
  title: string
  author: string
  description: string
  age_label: string
  price: number
  access?: BookAccess
  purchased_at?: string
}

export interface Subscription {
  id: string
  price_paid: number
  status: 'active' | 'cancelled' | 'expired'
  started_at: string
  expires_at: string
  cancelled_at: string | null
  order_type?: 'new' | 'renewal'
  next_renewal_price?: number
  price_change_pending?: boolean
}

export interface Me {
  id: string
  name: string
  email: string
  pin_set: boolean
  plan_status?: 'subscribed' | 'free'
  is_subscriber?: boolean
  subscription: Subscription | null
}

export interface BookOrder {
  id: string
  book_id: string
  book_title: string
  price: number
  status: 'pending' | 'paid' | 'failed'
  created_at: string
}

export interface SubscriptionOrder {
  id: string
  price: number
  status: 'pending' | 'paid' | 'failed'
}

export interface SubscriptionPlan {
  id: string
  price: number
  benefits: string
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  parent_token: string
}

export interface ParentTokenResult {
  parent_token: string
}

type Rec = Record<string, unknown>

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const has = (v: Rec, keys: Record<string, (x: unknown) => boolean>) =>
  Object.entries(keys).every(([k, check]) => check(v[k]))

export const isBook = (v: unknown): v is Book =>
  isRec(v) &&
  has(v, {
    id: isStr,
    title: isStr,
    author: isStr,
    description: isStr,
    age_label: isStr,
    price: isNum,
  })

export const isSubscription = (v: unknown): v is Subscription =>
  isRec(v) &&
  has(v, { id: isStr, price_paid: isNum, status: isStr, started_at: isStr, expires_at: isStr })

export const isMe = (v: unknown): v is Me =>
  isRec(v) &&
  has(v, { id: isStr, name: isStr, email: isStr, pin_set: (x) => typeof x === 'boolean' }) &&
  (v.subscription === null || v.subscription === undefined || isSubscription(v.subscription))

export const isBookOrder = (v: unknown): v is BookOrder =>
  isRec(v) && has(v, { id: isStr, book_id: isStr, book_title: isStr, price: isNum, status: isStr })

export const isSubscriptionOrder = (v: unknown): v is SubscriptionOrder =>
  isRec(v) && has(v, { id: isStr, price: isNum, status: isStr })

export const isPlan = (v: unknown): v is SubscriptionPlan =>
  isRec(v) && has(v, { id: isStr, price: isNum, benefits: isStr })

export const isLoginResult = (v: unknown): v is LoginResult =>
  isRec(v) && has(v, { access_token: isStr, refresh_token: isStr, parent_token: isStr })

export const isParentTokenResult = (v: unknown): v is ParentTokenResult =>
  isRec(v) && isStr(v.parent_token)

export const isAnyObject = (v: unknown): v is Rec => isRec(v)

export const listOf =
  <T>(guard: (v: unknown) => v is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(guard)

/** CR-001-1: the badge comes from the backend. */
export const isSubscribed = (me: Me): boolean =>
  me.plan_status ? me.plan_status === 'subscribed' : me.is_subscriber === true
