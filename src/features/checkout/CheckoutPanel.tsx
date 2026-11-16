import { useRef, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/States'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { formatIDR } from '../../lib/format'

interface CheckoutPanelProps {
  backTo: string
  item: ReactNode
  priceLabel: string
  price: number
  note?: ReactNode
  error?: string
  /** Mocked payment: the client picks the outcome (API contract). */
  onPay: (result: 'success' | 'failed') => Promise<void>
}

/** A5: one item per order, no cart (US-09). */
export function CheckoutPanel({
  backTo,
  item,
  priceLabel,
  price,
  note,
  error,
  onPay,
}: CheckoutPanelProps) {
  const [paying, setPaying] = useState(false)
  const inFlight = useRef(false)

  // The ref blocks a double tap before React re-renders the disabled button (PRD E8).
  const pay = async (result: 'success' | 'failed') => {
    if (inFlight.current) return
    inFlight.current = true
    setPaying(true)
    try {
      await onPay(result)
    } finally {
      inFlight.current = false
      setPaying(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <ScreenHeader title="Checkout" backTo={backTo} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pt-5 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div className="flex items-center gap-3.5 rounded-3xl border border-line bg-white p-3">
          {item}
        </div>
        <dl className="flex flex-col gap-2.5 rounded-3xl border border-line bg-white p-4 text-[15px] font-semibold">
          <div className="flex justify-between">
            <dt className="text-muted">{priceLabel}</dt>
            <dd>{formatIDR(price)}</dd>
          </div>
          <div className="h-px bg-line" />
          <div className="flex justify-between text-[17px] font-extrabold">
            <dt>Total</dt>
            <dd className="text-primary">{formatIDR(price)}</dd>
          </div>
        </dl>
        {note}
        {error && <Notice>{error}</Notice>}
        <div className="mt-auto flex flex-col gap-1">
          <Button onClick={() => void pay('success')} disabled={paying}>
            {paying ? 'Processing…' : `Pay ${formatIDR(price)}`}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void pay('failed')} disabled={paying}>
            Simulate failed payment
          </Button>
        </div>
      </main>
    </div>
  )
}
