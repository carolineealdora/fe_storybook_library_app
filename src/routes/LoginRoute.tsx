import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/States'
import { TextField } from '../components/ui/TextField'
import { toApiError } from '../lib/api/errors'
import { useSession } from '../features/session/session-context'

/** A1 · US-01. No sign-up or forgot-password links (out of scope). */
export default function LoginRoute() {
  const { authed, login } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (authed && !busy) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      const apiErr = toApiError(err)
      setError(
        apiErr.code === 'INVALID_CREDENTIALS' || apiErr.code === 'VALIDATION_ERROR'
          ? 'Email or password is incorrect'
          : apiErr.code === 'FORBIDDEN'
            ? 'This account can’t use the family library.'
            : apiErr.message,
      )
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh justify-center bg-white">
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full max-w-md flex-col gap-7 px-7 pt-[max(env(safe-area-inset-top),3.5rem)] pb-8"
      >
        <div className="relative flex h-50 items-center justify-center overflow-hidden rounded-5xl bg-butter">
          <span
            aria-hidden="true"
            className="absolute -top-7.5 -right-7.5 size-35 rounded-full bg-sun"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-5 left-6 size-22.5 rounded-full bg-teal-400"
          />
          <div className="relative flex flex-col items-center gap-0.5">
            <p className="font-display text-[40px] leading-none font-extrabold text-primary">
              StoryBook
            </p>
            <p className="text-sm font-bold">by MainStory</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-tight font-extrabold">Welcome back</h1>
          <p className="text-[15px] font-semibold text-muted">
            Log in to open your family library.
          </p>
        </div>
        <div className="flex flex-col gap-3.5">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={Boolean(error)}
            required
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(error)}
            required
          />
          {error && <Notice>{error}</Notice>}
        </div>
        <Button type="submit" className="mt-auto" disabled={busy || !email || !password}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </main>
  )
}
