import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setApiHandlers } from '../../lib/api/client'
import { api } from '../../lib/api/endpoints'
import { useApi } from '../../lib/api/useApi'
import { readStore, writeStore } from '../../lib/storage'
import { clearCoverCache } from '../books/useCover'
import { SessionContext, type SessionValue, type ViewMode } from './session-context'

const readViewMode = (): ViewMode => (readStore('view_mode') === 'child' ? 'child' : 'parent')

function clearTokens() {
  writeStore('access_token', null)
  writeStore('refresh_token', null)
  writeStore('parent_token', null)
  writeStore('view_mode', null)
  clearCoverCache()
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => readStore('access_token') !== null)
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode)
  const [pinPromptOpen, setPinPromptOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const meState = useApi(authed ? 'me' : null, api.me)

  const switchToChild = useCallback(() => {
    // Deleting the parent token is what keeps a child away from payments (API contract, US-03).
    writeStore('parent_token', null)
    writeStore('view_mode', 'child')
    setViewMode('child')
  }, [])

  useEffect(() => {
    setApiHandlers({
      onAuthLost: () => {
        clearTokens()
        setAuthed(false)
        setPinPromptOpen(false)
      },
      onParentRequired: () => {
        switchToChild()
        setPinPromptOpen(true)
      },
    })
  }, [switchToChild])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    writeStore('access_token', res.access_token)
    writeStore('refresh_token', res.refresh_token)
    writeStore('parent_token', res.parent_token)
    writeStore('view_mode', 'parent')
    setViewMode('parent')
    setBannerDismissed(false)
    setAuthed(true)
  }, [])

  const logout = useCallback(async () => {
    const refresh = readStore('refresh_token')
    // Clear locally even if the revoke call fails; the token expires on its own.
    if (refresh) await api.logout(refresh).catch(() => undefined)
    clearTokens()
    setAuthed(false)
  }, [])

  const enterParent = useCallback((parentToken: string) => {
    writeStore('parent_token', parentToken)
    writeStore('view_mode', 'parent')
    setViewMode('parent')
    setPinPromptOpen(false)
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      authed,
      viewMode,
      me: meState.data,
      meError: meState.error,
      reloadMe: meState.reload,
      login,
      logout,
      switchToChild,
      enterParent,
      pinPromptOpen,
      setPinPromptOpen,
      bannerDismissed,
      dismissBanner: () => setBannerDismissed(true),
    }),
    [
      authed,
      viewMode,
      meState.data,
      meState.error,
      meState.reload,
      login,
      logout,
      switchToChild,
      enterParent,
      pinPromptOpen,
      bannerDismissed,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
