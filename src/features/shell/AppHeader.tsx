import { ViewModeToggle } from '../session/ViewModeToggle'
import { useSession } from '../session/session-context'
import { PlanBadge } from './PlanBadge'

/** Badge top left, view toggle top right, in both views (US-04, US-05). */
export function AppHeader() {
  const { me, viewMode } = useSession()
  const child = viewMode === 'child'
  return (
    <header
      className={`sticky top-0 z-10 pt-[max(env(safe-area-inset-top),1rem)] ${child ? 'bg-teal-50' : 'border-b border-line bg-white'}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 pb-3">
        <PlanBadge me={me} onTeal={child} />
        <ViewModeToggle />
      </div>
    </header>
  )
}
