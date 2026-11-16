import type { ReactNode } from 'react'
import { Skeleton } from '../../components/ui/States'

export function BookGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-3.5 sm:grid-cols-3 lg:grid-cols-4">{children}</ul>
  )
}

export function BookGridSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="aspect-[11/16]" />
      ))}
    </div>
  )
}
