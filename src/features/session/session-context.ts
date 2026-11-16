import { createContext, useContext } from 'react'
import type { ApiError } from '../../lib/api/errors'
import type { Me } from '../../lib/api/types'

export type ViewMode = 'parent' | 'child'

export interface SessionValue {
  authed: boolean
  viewMode: ViewMode
  me: Me | undefined
  meError: ApiError | undefined
  reloadMe: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Parent → Child. Callers check `me.pin_set` first (US-03). */
  switchToChild: () => void
  /** Child → Parent after a verified PIN or password. */
  enterParent: (parentToken: string) => void
  pinPromptOpen: boolean
  setPinPromptOpen: (open: boolean) => void
  bannerDismissed: boolean
  dismissBanner: () => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside <SessionProvider>')
  return value
}
