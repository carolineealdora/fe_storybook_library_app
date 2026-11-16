// Small inline icons drawn from the design file.
interface IconProps {
  className?: string
}

export function LockIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="3" y="7" width="10" height="8" rx="2" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function HomeIcon({ filled, className = 'size-5.5' }: IconProps & { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-block rounded-[7px] ${filled ? 'bg-current' : 'border-[2.5px] border-current'}`}
    />
  )
}

export function BookIcon({ filled, className = 'size-5.5' }: IconProps & { filled: boolean }) {
  return (
    <svg viewBox="0 0 22 22" className={`${className} flex-none`} aria-hidden="true">
      <polygon
        points="11,2.5 20.5,19.5 1.5,19.5"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SettingsIcon({ filled, className = 'size-5.5' }: IconProps & { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-block rounded-full ${filled ? 'bg-current' : 'border-[2.5px] border-current'}`}
    />
  )
}
