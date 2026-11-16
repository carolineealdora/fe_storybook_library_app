import { useEffect, useId, useRef, type ReactNode } from 'react'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** bottom = parent-style bottom sheet; center = child-style card. */
  placement?: 'bottom' | 'center'
  scrim?: 'ink' | 'teal'
  /** Shown above the title (center placement). */
  icon?: ReactNode
}

/** Modal dialog: Escape and the scrim close it, focus moves in and is restored on close. */
export function Sheet({
  title,
  onClose,
  children,
  placement = 'bottom',
  scrim = 'ink',
  icon,
}: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('button, a, input')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [])

  // ponytail: no full focus trap; the scrim blocks pointer access and Escape closes. Add a trap if audits ask.
  return (
    <div
      className={`fixed inset-0 z-40 flex ${placement === 'bottom' ? 'items-end' : 'items-center p-6'} justify-center ${scrim === 'teal' ? 'bg-scrim-teal' : 'bg-scrim'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          placement === 'bottom'
            ? 'flex w-full max-w-xl flex-col gap-3 rounded-t-5xl bg-white px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.75rem)]'
            : 'flex w-full max-w-sm flex-col items-center gap-3.5 rounded-[32px] bg-white px-5.5 py-7 text-center'
        }
      >
        {icon}
        <h2
          id={titleId}
          className={
            placement === 'bottom'
              ? 'font-display text-2xl leading-tight font-extrabold'
              : 'font-display text-[28px] leading-none font-extrabold text-teal-900'
          }
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
