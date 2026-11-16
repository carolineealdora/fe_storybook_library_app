import type { ReactNode } from 'react'

export type PillTone = 'neutral' | 'success' | 'danger' | 'brand' | 'white' | 'butter'

const tones: Record<PillTone, string> = {
  neutral: 'bg-chip text-muted',
  success: 'bg-teal-50 text-teal-900',
  danger: 'bg-danger-bg text-danger-strong',
  brand: 'bg-teal-700 text-white',
  white: 'bg-white text-ink',
  butter: 'bg-butter text-ink',
}

interface PillProps {
  tone?: PillTone
  className?: string
  children: ReactNode
}

export function Pill({ tone = 'neutral', className = '', children }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
