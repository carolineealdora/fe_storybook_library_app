import { Pill } from '../components/ui/Pill'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { EmptyState, ErrorState, LoadingList } from '../components/ui/States'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import { formatDateTime, formatIDR } from '../lib/format'

/** B6 · US-12: book orders only, newest first. */
export default function OrderHistoryRoute() {
  const orders = useApi('book-orders', api.bookOrders)
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <ScreenHeader title="Order history" backTo="/settings" />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-2.5 p-4">
        {orders.data ? (
          orders.data.length === 0 ? (
            <EmptyState title="No orders yet" body="Books you buy will show up here." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {orders.data.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {formatDateTime(o.created_at)}
                    </span>
                    <Pill tone={o.status === 'paid' ? 'success' : 'danger'}>
                      {o.status === 'paid' ? 'Paid' : 'Failed'}
                    </Pill>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-base font-extrabold">{o.book_title}</span>
                    <span className="text-sm font-extrabold">{formatIDR(o.price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : orders.error ? (
          <ErrorState message={orders.error.message} onRetry={orders.reload} />
        ) : (
          <LoadingList label="Loading orders" />
        )}
      </main>
    </div>
  )
}
