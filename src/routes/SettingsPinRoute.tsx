import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { PinBoxes } from '../components/ui/PinBoxes'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { LoadingList, Notice } from '../components/ui/States'
import { TextField } from '../components/ui/TextField'
import { toApiError } from '../lib/api/errors'
import { api } from '../lib/api/endpoints'
import { useSession } from '../features/session/session-context'

/** B5 · US-14: 4-digit PIN entered twice; changing an existing PIN needs the password. */
export default function SettingsPinRoute() {
  const { me, reloadMe } = useSession()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const changing = me?.pin_set === true

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4 || confirm.length !== 4) return setError('Enter 4 digits in both fields.')
    if (pin !== confirm) return setError("The PINs don't match. Please try again.")
    if (changing && !password) return setError('Enter your account password to change the PIN.')
    setSaving(true)
    setError(undefined)
    try {
      await api.setPin(pin, confirm, changing ? password : undefined)
      reloadMe()
      navigate('/settings', { replace: true })
    } catch (err) {
      const apiErr = toApiError(err)
      if (apiErr.code === 'INVALID_PASSWORD') setError('That password is incorrect.')
      else if (apiErr.code !== 'PARENT_MODE_REQUIRED') setError(apiErr.message)
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ScreenHeader title="Parent PIN" backTo="/settings" />
      {!me ? (
        <main className="p-5">
          <LoadingList rows={2} label="Loading" />
        </main>
      ) : (
        <form
          onSubmit={save}
          noValidate
          className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        >
          <p className="text-sm leading-normal font-semibold text-muted">
            You'll need this 4-digit PIN to leave Child view.
          </p>
          <PinBoxes label="New PIN" value={pin} onChange={setPin} autoFocus />
          <PinBoxes
            label="Confirm PIN"
            value={confirm}
            onChange={setConfirm}
            invalid={confirm.length === 4 && pin !== confirm}
          />
          {changing ? (
            <TextField
              label="Account password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Changing an existing PIN asks for your account password first."
            />
          ) : (
            <Notice tone="info">
              Changing an existing PIN asks for your account password first.
            </Notice>
          )}
          {error && <Notice>{error}</Notice>}
          <Button type="submit" className="mt-auto" disabled={saving}>
            {saving ? 'Saving…' : 'Save PIN'}
          </Button>
        </form>
      )}
    </div>
  )
}
