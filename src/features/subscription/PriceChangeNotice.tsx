import { Notice } from '../../components/ui/States'
import { formatDate, formatIDR } from '../../lib/format'
import type { Subscription } from '../../lib/api/types'

/** CR-001-2: tell an active subscriber the next renewal costs a different price. */
export function PriceChangeNotice({ subscription }: { subscription: Subscription | null }) {
  if (!subscription?.price_change_pending || subscription.next_renewal_price === undefined)
    return null
  return (
    <Notice tone="info">
      Your subscription price will change from {formatIDR(subscription.price_paid)} to{' '}
      {formatIDR(subscription.next_renewal_price)} on your next renewal (
      {formatDate(subscription.expires_at)}).
    </Notice>
  )
}
