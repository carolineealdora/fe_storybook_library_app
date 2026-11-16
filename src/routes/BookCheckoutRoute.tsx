import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Notice } from '../components/ui/States'
import { toApiError } from '../lib/api/errors'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import type { BookOrder } from '../lib/api/types'
import { formatIDR } from '../lib/format'
import { BookCover } from '../features/books/BookCover'
import { CheckoutPanel } from '../features/checkout/CheckoutPanel'
import { PaymentResult } from '../features/checkout/PaymentResult'

type Phase = 'checkout' | 'success' | 'failed' | 'unavailable'

/** A5 → A6 / A7 · US-09. The order comes from Buy Now (router state); there is no GET for it. */
export default function BookCheckoutRoute() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const order = (location.state as { order?: BookOrder } | null)?.order
  const [phase, setPhase] = useState<Phase>('checkout')
  const [error, setError] = useState<string>()
  const [retrying, setRetrying] = useState(false)
  const book = useApi(`book:${id}`, () => api.book(id)).data
  const plan = useApi('plan', api.plan).data

  if (!order || order.book_id !== id) return <Navigate to={`/books/${id}`} replace />

  const pay = async (result: 'success' | 'failed') => {
    setError(undefined)
    try {
      await api.payBookOrder(order.id, result)
      setPhase('success')
    } catch (e) {
      const err = toApiError(e)
      if (err.code === 'PAYMENT_FAILED') setPhase('failed')
      else if (err.code === 'BOOK_UNAVAILABLE') setPhase('unavailable')
      else if (err.code !== 'PARENT_MODE_REQUIRED') setError(err.message)
    }
  }

  // A failed order can't be paid again: retry with a new order (API contract, E9).
  const retry = async () => {
    setRetrying(true)
    try {
      const next = await api.createBookOrder(id)
      navigate('.', { replace: true, state: { order: next } })
      setPhase('checkout')
    } catch {
      navigate(`/books/${id}`, { replace: true })
    } finally {
      setRetrying(false)
    }
  }

  const title = order.book_title

  if (phase === 'success') {
    return (
      <PaymentResult
        kind="success"
        title={`${title} is yours!`}
        body={`Payment received. ${title} is now in My Book, ready to read anytime.`}
      >
        <Link to={`/books/${id}/read`} replace className={buttonClass('primary', 'lg')}>
          Read Now
        </Link>
        <Link to="/" className={`${buttonClass('outline', 'md')}`}>
          Back to Home
        </Link>
      </PaymentResult>
    )
  }
  if (phase === 'failed') {
    return (
      <PaymentResult
        kind="failed"
        title="Payment didn't go through"
        body="You weren't charged and the book is still locked. You can try again from checkout."
      >
        <Button onClick={() => void retry()} disabled={retrying}>
          {retrying ? 'Preparing…' : 'Back to Checkout'}
        </Button>
      </PaymentResult>
    )
  }
  if (phase === 'unavailable') {
    return (
      <PaymentResult
        kind="failed"
        title="This book is no longer available"
        body="You weren't charged. The book was removed from the library while you were checking out."
      >
        <Link to="/" replace className={buttonClass('primary', 'lg')}>
          Back to Home
        </Link>
      </PaymentResult>
    )
  }

  return (
    <CheckoutPanel
      backTo={`/books/${id}`}
      priceLabel="Book price"
      price={order.price}
      error={error}
      onPay={pay}
      item={
        <>
          <BookCover book={{ id, title }} className="h-24 w-18 flex-none rounded-[10px]" />
          <div className="flex flex-col gap-1">
            <p className="font-display text-[17px] leading-tight font-extrabold">{title}</p>
            <p className="text-[13px] font-semibold text-muted">
              {book ? `Ages ${book.age_label} · ` : ''}Yours forever
            </p>
          </div>
        </>
      }
      note={
        plan && (
          <Notice tone="teal">
            One book per order. Prefer the whole library? Subscribe for {formatIDR(plan.price)}
            /month.
          </Notice>
        )
      }
    />
  )
}
