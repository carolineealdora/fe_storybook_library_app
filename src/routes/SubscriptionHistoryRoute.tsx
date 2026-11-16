import { Pill, type PillTone } from '../components/ui/Pill'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { EmptyState, ErrorState, LoadingList } from '../components/ui/States'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import type { Subscription } from '../lib/api/types'
import { formatDate, formatIDR } from '../lib/format'

const status: Record<Subscription['status'], { label: string; tone: PillTone }> = {
  active: { label: 'Active', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
}

/** B7 · US-13: one row per subscription period. */
export default function SubscriptionHistoryRoute() {
  const subs = useApi('subscriptions', api.subscriptions)
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <ScreenHeader title="Subscription history" backTo="/settings" />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-2.5 p-4">
        {subs.data ? (
          subs.data.length === 0 ? (
            <EmptyState title="No subscriptions yet" body="Your monthly plans will show up here." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {subs.data.map((s) => {
                const st = status[s.status] ?? status.expired
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-extrabold">
                        {formatDate(s.started_at)} – {formatDate(s.expires_at)}
                      </span>
                      <Pill tone={st.tone}>{st.label}</Pill>
                    </div>
                    <div className="flex justify-between text-[13px] font-semibold text-muted">
                      <span>Monthly · {s.order_type === 'renewal' ? 'Renewal' : 'New'}</span>
                      <span className="text-sm font-extrabold text-ink">
                        {formatIDR(s.price_paid)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        ) : subs.error ? (
          <ErrorState message={subs.error.message} onRetry={subs.reload} />
        ) : (
          <LoadingList label="Loading subscriptions" />
        )}
      </main>
    </div>
  )
}
