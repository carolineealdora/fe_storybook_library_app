import { NavLink } from 'react-router'
import { BookIcon, HomeIcon, SettingsIcon } from '../../components/ui/icons'
import { useSession } from '../session/session-context'

const tabs = [
  { to: '/', label: 'Home', Icon: HomeIcon, parentOnly: false },
  { to: '/my-books', label: 'My Book', Icon: BookIcon, parentOnly: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, parentOnly: true },
]

/** Parent: Home · My Book · Settings. Child: big Home · My Book buttons (US-04, US-05). */
export function BottomNav() {
  const { viewMode } = useSession()
  const child = viewMode === 'child'
  const items = tabs.filter((t) => !child || !t.parentOnly)

  return (
    <nav
      aria-label="Main"
      className={`sticky bottom-0 z-10 bg-white pb-[max(env(safe-area-inset-bottom),1.25rem)] ${child ? 'rounded-t-5xl px-3.5 pt-2.5' : 'border-t border-line px-2 pt-2'}`}
    >
      <ul className={`mx-auto grid max-w-xl gap-2.5 ${child ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                child
                  ? `flex h-14 items-center justify-center gap-2 rounded-3xl font-display text-base font-extrabold ${isActive ? 'bg-sun text-ink' : 'text-muted'}`
                  : `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl p-1.5 text-xs font-extrabold ${isActive ? 'text-primary' : 'text-subtle'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon filled={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
