import { useGoBack } from '../../lib/useGoBack'

interface BackButtonProps {
  /** Where to go when there is no history to return to (deep link, reload). */
  fallback: string
  tone?: 'white' | 'butter'
  label?: string
}

export function BackButton({ fallback, tone = 'butter', label = 'Go back' }: BackButtonProps) {
  const goBack = useGoBack(fallback)
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={`flex size-11 flex-none items-center justify-center rounded-full text-xl font-extrabold ${tone === 'white' ? 'bg-white' : 'bg-butter'}`}
    >
      <span aria-hidden="true">‹</span>
    </button>
  )
}
