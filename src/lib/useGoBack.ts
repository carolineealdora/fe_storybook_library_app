import { useNavigate } from 'react-router'

/** Go back in history, or to `fallback` when the page was opened directly (deep link, reload). */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
