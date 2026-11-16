import { Link } from 'react-router'
import { formatIDR } from '../../lib/format'
import { api } from '../../lib/api/endpoints'
import { useApi } from '../../lib/api/useApi'
import { isSubscribed } from '../../lib/api/types'
import { useSession } from '../session/session-context'

/** Yellow upsell on Home and My Book: Parent view, Free plan only, dismissible for the session. */
export function SubscribeBanner() {
  const { me, viewMode, bannerDismissed, dismissBanner } = useSession()
  const show = viewMode === 'parent' && me !== undefined && !isSubscribed(me) && !bannerDismissed
  const plan = useApi(show ? 'plan' : null, api.plan).data
  if (!show || !plan) return null

  return (
    <aside
      aria-label="Subscription offer"
      className="relative flex items-center gap-3 rounded-3xl bg-sun py-3.5 pr-11 pl-3.5"
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="font-display text-[15px] leading-tight font-extrabold text-ink">
          Read every book for {formatIDR(plan.price)}/month
        </p>
        <p className="text-xs font-semibold text-sun-ink">Unlock the whole library</p>
      </div>
      <Link
        to="/subscription"
        className="flex h-11 flex-none items-center rounded-xl bg-ink px-3.5 text-[13px] font-extrabold text-white"
      >
        Subscribe
      </Link>
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Hide subscription offer"
        className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full text-[15px] font-extrabold text-ink"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </aside>
  )
}
