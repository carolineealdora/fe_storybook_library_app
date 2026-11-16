import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, toApiError } from './errors'

interface Settled<T> {
  key: string
  run: number
  data?: T
  error?: ApiError
}

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
  reload: () => void
}

/**
 * The app's one data-fetching hook. `key` identifies the request (null = skip).
 * On reload the previous data stays visible until the new response lands.
 */
export function useApi<T>(key: string | null, fetcher: () => Promise<T>): ApiState<T> {
  const [settled, setSettled] = useState<Settled<T>>()
  const [run, setRun] = useState(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (key === null) return
    let live = true
    fetcherRef.current().then(
      (data) => live && setSettled({ key, run, data }),
      (e: unknown) => live && setSettled({ key, run, error: toApiError(e) }),
    )
    return () => {
      live = false
    }
  }, [key, run])

  const reload = useCallback(() => setRun((r) => r + 1), [])
  const sameKey = settled?.key === key
  const current = sameKey && settled.run === run

  return {
    data: sameKey ? settled.data : undefined,
    error: current ? settled.error : undefined,
    loading: key !== null && !current,
    reload,
  }
}
