import { Navigate, Outlet, ScrollRestoration } from 'react-router'
import { PinPrompt } from '../features/session/PinPrompt'
import { useSession } from '../features/session/session-context'
import { BottomNav } from '../features/shell/BottomNav'

/** New screens open at the top; Back restores the previous scroll position. */
export function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

/** Signed-out users go to Login (US-01, E19). Hosts the global PIN prompt. */
export function RequireAuth() {
  const { authed, pinPromptOpen } = useSession()
  if (!authed) return <Navigate to="/login" replace />
  return (
    <>
      <Outlet />
      {pinPromptOpen && <PinPrompt />}
    </>
  )
}

/** Child view never reaches prices, payment or settings (US-05, PRD §10). */
export function ParentOnly() {
  const { viewMode } = useSession()
  if (viewMode === 'child') return <Navigate to="/" replace />
  return <Outlet />
}

/** Home, My Book and Settings share the bottom nav. */
export function TabsLayout() {
  const { viewMode } = useSession()
  return (
    <div className={`flex min-h-dvh flex-col ${viewMode === 'child' ? 'bg-teal-50' : 'bg-cream'}`}>
      <Outlet />
      <div className="mt-auto" />
      <BottomNav />
    </div>
  )
}
