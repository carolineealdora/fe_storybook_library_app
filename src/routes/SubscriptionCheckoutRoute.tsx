import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Notice } from '../components/ui/States'
import { toApiError } from '../lib/api/errors'
import { api } from '../lib/api/endpoints'
import type { SubscriptionOrder } from '../lib/api/types'
import { CheckoutPanel } from '../features/checkout/CheckoutPanel'
import { PaymentResult } from '../features/checkout/PaymentResult'
import { useSession } from '../features/session/session-context'

/** A5-style checkout for the monthly plan → A6 / A7 · US-10. */
export default function SubscriptionCheckoutRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const { reloadMe } = useSession()
  const order = (location.state as { order?: SubscriptionOrder } | null)?.order
  const [phase, setPhase] = useState<'checkout' | 'success' | 'failed'>('checkout')
  const [error, setError] = useState<string>()
  const [retrying, setRetrying] = useState(false)

  if (!order) return <Navigate to="/subscription" replace />

  const pay = async (result: 'success' | 'failed') => {
    setError(undefined)
    try {
      await api.paySubscriptionOrder(order.id, result)
      reloadMe() // badge flips to Subscribed without a page reload (CR-001-1)
      setPhase('success')
    } catch (e) {
      const err = toApiError(e)
      if (err.code === 'PAYMENT_FAILED') setPhase('failed')
      else if (err.code === 'SUBSCRIPTION_ACTIVE') {
        reloadMe()
        navigate('/subscription', { replace: true })
      } else if (err.code !== 'PARENT_MODE_REQUIRED') setError(err.message)
    }
  }

  const retry = async () => {
    setRetrying(true)
    try {
      const next = await api.createSubscriptionOrder(order.price)
      navigate('.', { replace: true, state: { order: next } })
      setPhase('checkout')
    } catch {
      // PRICE_CHANGED and friends: the offer page re-reads the plan.
      navigate('/subscription', { replace: true })
    } finally {
      setRetrying(false)
    }
  }

  if (phase === 'success') {
    return (
      <PaymentResult
        kind="success"
        title="You're subscribed!"
        body="Payment received. Every book in the library is now unlocked."
      >
        <Link to="/" replace className={buttonClass('primary', 'lg')}>
          Start reading
        </Link>
      </PaymentResult>
    )
  }
  if (phase === 'failed') {
    return (
      <PaymentResult
        kind="failed"
        title="Payment didn't go through"
        body="You weren't charged and no subscription was started. You can try again from checkout."
      >
        <Button onClick={() => void retry()} disabled={retrying}>
          {retrying ? 'Preparing…' : 'Back to Checkout'}
        </Button>
      </PaymentResult>
    )
  }

  return (
    <CheckoutPanel
      backTo="/subscription"
      priceLabel="Monthly plan"
      price={order.price}
      error={error}
      onPay={pay}
      item={
        <>
          <span aria-hidden="true" className="h-24 w-18 flex-none rounded-[10px] bg-sun" />
          <div className="flex flex-col gap-1">
            <p className="font-display text-[17px] leading-tight font-extrabold">Monthly plan</p>
            <p className="text-[13px] font-semibold text-muted">Every published book</p>
          </div>
        </>
      }
      note={
        <Notice tone="teal">Renews automatically every month. Cancel anytime in Settings.</Notice>
      }
    />
  )
}
