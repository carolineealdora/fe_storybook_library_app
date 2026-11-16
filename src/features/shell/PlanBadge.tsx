import type { Me } from '../../lib/api/types'
import { isSubscribed } from '../../lib/api/types'

/** CR-001-1: "Subscribed" or "Free", derived by the backend. */
export function PlanBadge({ me, onTeal = false }: { me: Me | undefined; onTeal?: boolean }) {
  if (!me)
    return <span className="h-7 w-14 animate-pulse rounded-full bg-line" aria-hidden="true" />
  const subscribed = isSubscribed(me)
  const tone = subscribed
    ? 'bg-teal-700 text-white'
    : onTeal
      ? 'bg-white text-muted'
      : 'bg-chip text-muted'
  return (
    <span
      className={`rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${onTeal ? 'px-3 text-xs' : ''} ${tone}`}
    >
      {subscribed ? 'Subscribed' : 'Free'}
    </span>
  )
}
