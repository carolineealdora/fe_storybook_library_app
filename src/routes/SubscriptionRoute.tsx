import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Pill'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Sheet } from '../components/ui/Sheet'
import { ErrorState, LoadingList, Notice } from '../components/ui/States'
import { toApiError } from '../lib/api/errors'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import { isSubscribed, type Me, type SubscriptionPlan } from '../lib/api/types'
import { formatDate, formatIDR, splitBenefits } from '../lib/format'
import { useSession } from '../features/session/session-context'
import { PriceChangeNotice } from '../features/subscription/PriceChangeNotice'

/** B1 (offer) / B2 (manage + cancel) · US-10, US-11. */
export default function SubscriptionRoute() {
  const { me, meError, reloadMe } = useSession()
  const plan = useApi('plan', api.plan)

  if (me && isSubscribed(me)) return <ManageSubscription me={me} onChanged={reloadMe} />
  if (me && plan.data)
    return (
      <SubscriptionOffer plan={plan.data} onPriceChanged={plan.reload} onAlreadyActive={reloadMe} />
    )

  const error = meError ?? plan.error
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <ScreenHeader title="Subscription" backTo="/" />
      <main className="mx-auto w-full max-w-xl p-4">
        {error ? (
          <ErrorState
            message={error.message}
            onRetry={() => (meError ? reloadMe() : plan.reload())}
          />
        ) : (
          <LoadingList rows={2} label="Loading subscription" />
        )}
      </main>
    </div>
  )
}

interface OfferProps {
  plan: SubscriptionPlan
  onPriceChanged: () => void
  onAlreadyActive: () => void
}

function SubscriptionOffer({ plan, onPriceChanged, onAlreadyActive }: OfferProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const checkout = async () => {
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      const order = await api.createSubscriptionOrder(plan.price)
      navigate('/subscription/checkout', { state: { order } })
    } catch (e) {
      const err = toApiError(e)
      // CR-001 E-CR1: the admin changed the price; show the new one and ask again.
      if (err.code === 'PRICE_CHANGED') onPriceChanged()
      if (err.code === 'SUBSCRIPTION_ACTIVE') onAlreadyActive()
      if (err.code !== 'PARENT_MODE_REQUIRED') setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <div className="relative overflow-hidden bg-sun px-5 pt-[max(env(safe-area-inset-top),2.5rem)] pb-7">
        <span
          aria-hidden="true"
          className="absolute -top-10 -right-15 size-45 rounded-full bg-butter/60"
        />
        <div className="relative mx-auto flex max-w-xl flex-col gap-4">
          <BackButton fallback="/" tone="white" />
          <h1 className="font-display text-[34px] leading-none font-extrabold text-ink">
            Read every book in the library
          </h1>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[32px] font-extrabold">{formatIDR(plan.price)}</span>
            <span className="text-[15px] font-bold">/ month</span>
          </p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[calc(var(--container-xl)+2.5rem)] flex-1 flex-col gap-3.5 px-5 pt-5.5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <ul className="flex flex-col gap-3.5">
          {splitBenefits(plan.benefits).map((b) => (
            <li key={b} className="flex items-center gap-3 text-[15px] font-bold">
              <span
                aria-hidden="true"
                className="flex size-7 flex-none items-center justify-center rounded-full bg-teal-50 text-sm font-extrabold text-teal-700"
              >
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <p className="text-xs leading-normal font-semibold text-muted">
          Renews automatically every month. Cancel anytime in Settings.
        </p>
        {error && <Notice>{error}</Notice>}
        <Button className="mt-auto md:mt-6" onClick={() => void checkout()} disabled={busy}>
          {busy ? 'Preparing checkout…' : 'Checkout'}
        </Button>
      </div>
    </main>
  )
}

function ManageSubscription({ me, onChanged }: { me: Me; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const sub = me.subscription

  const cancel = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await api.cancelSubscription()
      setConfirming(false)
      onChanged()
    } catch (e) {
      const err = toApiError(e)
      setConfirming(false)
      if (err.code === 'SUBSCRIPTION_NOT_ACTIVE') onChanged()
      else if (err.code !== 'PARENT_MODE_REQUIRED') setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <ScreenHeader title="Subscription" backTo="/settings" />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-3.5 px-4 py-5">
        <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Monthly plan</h2>
            <Pill tone="success">Active</Pill>
          </div>
          {sub && (
            <dl className="flex flex-col gap-3 text-sm font-semibold">
              <div className="flex justify-between">
                <dt className="text-muted">Price</dt>
                <dd>{formatIDR(sub.price_paid)} / month</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Next renewal</dt>
                <dd>{formatDate(sub.expires_at)}</dd>
              </div>
            </dl>
          )}
        </section>
        <PriceChangeNotice subscription={sub} />
        {error && <Notice>{error}</Notice>}
        <Button
          variant="outline"
          size="md"
          className="border-primary text-primary"
          onClick={() => setConfirming(true)}
        >
          Cancel subscription
        </Button>
      </main>
      {confirming && (
        <Sheet title="Cancel subscription?" onClose={() => !busy && setConfirming(false)}>
          <p className="text-sm leading-normal font-semibold text-pretty text-ink-body">
            Books you didn't buy will lock right away. There's no refund for the rest of this month.
            Books you bought stay in My Book.
          </p>
          <Button
            size="md"
            className="mt-1.5 h-13.5"
            onClick={() => setConfirming(false)}
            disabled={busy}
          >
            Keep subscription
          </Button>
          <Button variant="ghost" size="md" onClick={() => void cancel()} disabled={busy}>
            {busy ? 'Cancelling…' : 'Yes, cancel now'}
          </Button>
        </Sheet>
      )}
    </div>
  )
}
