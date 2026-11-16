import type { ReactNode } from 'react'
import { Button } from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center"
    >
      <p className="font-semibold text-ink-body">{message}</p>
      {onRetry && (
        <Button variant="outline" size="md" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  body?: string
  action?: ReactNode
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-white px-6 py-10 text-center">
      <p className="font-display text-xl font-extrabold">{title}</p>
      {body && <p className="text-sm font-semibold text-muted">{body}</p>}
      {action && <div className="mt-3 w-full max-w-xs">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-line ${className}`} />
}

export function LoadingList({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  )
}

export function Notice({
  tone = 'danger',
  children,
}: {
  tone?: 'danger' | 'info' | 'teal'
  children: ReactNode
}) {
  const tones = {
    danger: 'bg-danger-bg text-danger-ink font-bold',
    info: 'bg-cream-2 text-muted font-semibold',
    teal: 'bg-teal-50 text-teal-900 font-semibold',
  }
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-xl px-3 py-2.5 text-[13px] leading-snug ${tones[tone]}`}
    >
      {children}
    </div>
  )
}
