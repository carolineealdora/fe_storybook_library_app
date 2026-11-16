import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/States'
import { TextField } from '../../components/ui/TextField'
import { toApiError } from '../../lib/api/errors'
import { api } from '../../lib/api/endpoints'
import { useSession } from './session-context'

const PIN_LENGTH = 4
const MAX_PIN_TRIES = 5 // backend locks after 5 wrong PINs (PRD E12)
const LOCK_MS = 60_000
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/** C4: grown-ups-only gate from Child view back to Parent view, with Forgot PIN (E13). */
export function PinPrompt() {
  const { enterParent, setPinPromptOpen } = useSession()
  const [mode, setMode] = useState<'pin' | 'password'>('pin')
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')
  const [wrongPins, setWrongPins] = useState(0)
  const [error, setError] = useState<string>()
  const [lockedUntil, setLockedUntil] = useState<number>()
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const secondsLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0
  const locked = secondsLeft > 0

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!lockedUntil) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [lockedUntil])

  const fail = (e: unknown) => {
    const err = toApiError(e)
    if (err.code === 'TOO_MANY_ATTEMPTS') {
      setLockedUntil(Date.now() + LOCK_MS)
      setNow(Date.now())
      setError(undefined)
    } else if (err.code === 'INVALID_PIN') {
      const left = MAX_PIN_TRIES - (wrongPins + 1)
      setWrongPins((n) => n + 1)
      setError(
        left > 0
          ? `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left before a 1-minute lock.`
          : 'Wrong PIN.',
      )
    } else if (err.code === 'PIN_NOT_SET') {
      setMode('password')
      setError('No PIN is set yet. Use your account password instead.')
    } else {
      setError(err.message)
    }
  }

  const submitPin = (value: string) => {
    setBusy(true)
    api
      .verifyPin(value)
      .then((r) => enterParent(r.parent_token))
      .catch((e: unknown) => {
        fail(e)
        setPin('')
      })
      .finally(() => setBusy(false))
  }

  const press = (key: (typeof KEYS)[number]) => {
    if (busy || locked) return
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (key === '' || pin.length >= PIN_LENGTH) return
    const next = pin + key
    setPin(next)
    setError(undefined)
    if (next.length === PIN_LENGTH) submitPin(next)
  }

  const pressRef = useRef(press)
  useEffect(() => {
    pressRef.current = press
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinPromptOpen(false)
      if (mode !== 'pin') return
      if (/^[0-9]$/.test(e.key)) pressRef.current(e.key as (typeof KEYS)[number])
      if (e.key === 'Backspace') pressRef.current('del')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mode, setPinPromptOpen])

  const submitPassword = (e: FormEvent) => {
    e.preventDefault()
    if (!password || busy || locked) return
    setBusy(true)
    api
      .forgotPin(password)
      .then((r) => enterParent(r.parent_token))
      .catch((err: unknown) => {
        const apiErr = toApiError(err)
        if (apiErr.code === 'INVALID_PASSWORD') setError('That password is incorrect.')
        else fail(err)
      })
      .finally(() => setBusy(false))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-white"
    >
      <div className="mx-auto flex min-h-full max-w-sm flex-col gap-4.5 px-5 pt-[max(env(safe-area-inset-top),3rem)] pb-7">
        <div className="flex items-center justify-between">
          <button
            ref={closeRef}
            type="button"
            onClick={() => setPinPromptOpen(false)}
            aria-label="Close and stay in Child view"
            className="flex size-11 items-center justify-center rounded-full bg-field text-lg font-extrabold"
          >
            <span aria-hidden="true">✕</span>
          </button>
          <span className="rounded-full bg-butter px-2.5 py-1.5 text-xs font-extrabold">
            Grown-ups only
          </span>
        </div>

        <div className="flex flex-col gap-1 text-center">
          <h2 id="pin-title" className="font-display text-[26px] leading-tight font-extrabold">
            {mode === 'pin' ? 'Enter parent PIN' : 'Enter account password'}
          </h2>
          <p className="text-sm font-semibold text-muted">to switch to Parent view</p>
        </div>

        {mode === 'pin' ? (
          <>
            <div className="flex justify-center gap-3.5" aria-hidden="true">
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <span
                  key={i}
                  className={`size-4.5 rounded-full ${i < pin.length ? 'bg-primary' : 'bg-line-2'}`}
                />
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              {pin.length} of {PIN_LENGTH} digits entered
            </p>
            {locked && <Notice>Too many wrong tries. Try again in {secondsLeft}s.</Notice>}
            {!locked && error && <Notice>{error}</Notice>}
            <div className="grid grid-cols-3 gap-2.5">
              {KEYS.map((k, i) =>
                k === '' ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => press(k)}
                    disabled={busy || locked}
                    aria-label={k === 'del' ? 'Delete last digit' : k}
                    className="h-14.5 rounded-2xl bg-field text-2xl font-bold disabled:opacity-50"
                  >
                    {k === 'del' ? <span aria-hidden="true">⌫</span> : k}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('password')
                setError(undefined)
              }}
              className="mt-auto py-3 text-center text-[15px] font-extrabold text-primary"
            >
              Forgot PIN? Use account password
            </button>
          </>
        ) : (
          <form onSubmit={submitPassword} className="flex flex-1 flex-col gap-4">
            <TextField
              label="Account password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(error)}
              autoFocus
            />
            {locked && <Notice>Too many wrong tries. Try again in {secondsLeft}s.</Notice>}
            {!locked && error && <Notice>{error}</Notice>}
            <Button type="submit" disabled={!password || busy || locked}>
              {busy ? 'Checking…' : 'Continue'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setMode('pin')
                setError(undefined)
              }}
            >
              Use PIN instead
            </Button>
            <p className="mt-auto text-center text-xs font-semibold text-muted">
              You can set a new PIN in Settings after this.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
