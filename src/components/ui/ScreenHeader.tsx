import { BackButton } from './BackButton'

interface ScreenHeaderProps {
  title: string
  /** Omit for top-level tabs (Settings) that have no back button. */
  backTo?: string
}

export function ScreenHeader({ title, backTo }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-3.5">
        {backTo && <BackButton fallback={backTo} />}
        <h1 className="font-display text-[22px] font-extrabold">{title}</h1>
      </div>
    </header>
  )
}
