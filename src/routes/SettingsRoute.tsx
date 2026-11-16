import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ErrorState, LoadingList, Notice } from '../components/ui/States'
import { TextField } from '../components/ui/TextField'
import { toApiError } from '../lib/api/errors'
import { api } from '../lib/api/endpoints'
import { isSubscribed, type Me } from '../lib/api/types'
import { useSession } from '../features/session/session-context'
import { PriceChangeNotice } from '../features/subscription/PriceChangeNotice'

/** B4 · US-14: Parent view only. */
export default function SettingsRoute() {
  const { me, meError, reloadMe } = useSession()
  return (
    <>
      <ScreenHeader title="Settings" />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3.5 p-4">
        {me ? (
          <SettingsBody me={me} onSaved={reloadMe} />
        ) : meError ? (
          <ErrorState message={meError.message} onRetry={reloadMe} />
        ) : (
          <LoadingList rows={3} label="Loading settings" />
        )}
      </main>
    </>
  )
}

function SettingsBody({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const { logout } = useSession()
  const navigate = useNavigate()
  const [name, setName] = useState(me.name)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string }>()
  const dirty = name.trim() !== me.name

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setStatus({ ok: false, text: 'Please enter your name.' })
      return
    }
    setSaving(true)
    setStatus(undefined)
    try {
      await api.updateName(name.trim())
      onSaved()
      setStatus({ ok: true, text: 'Name saved.' })
    } catch (err) {
      const apiErr = toApiError(err)
      if (apiErr.code !== 'PARENT_MODE_REQUIRED') setStatus({ ok: false, text: apiErr.message })
    } finally {
      setSaving(false)
    }
  }

  const links = [
    { to: '/settings/pin', label: 'Parent PIN', meta: me.pin_set ? 'Set' : 'Not set' },
    { to: '/subscription', label: 'Subscription', meta: isSubscribed(me) ? 'Subscribed' : 'Free' },
    { to: '/settings/orders', label: 'Order history', meta: '' },
    { to: '/settings/subscriptions', label: 'Subscription history', meta: '' },
  ]

  return (
    <>
      <form
        onSubmit={save}
        className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3.5"
        noValidate
      >
        <TextField
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setStatus(undefined)
          }}
          invalid={status?.ok === false}
          required
        />
        <TextField label="Email" value={me.email} readOnly hint="Email can't be changed." />
        {status && <Notice tone={status.ok ? 'teal' : 'danger'}>{status.text}</Notice>}
        {dirty && (
          <Button type="submit" size="md" disabled={saving}>
            {saving ? 'Saving…' : 'Save name'}
          </Button>
        )}
      </form>

      <PriceChangeNotice subscription={me.subscription} />

      <ul className="flex flex-col rounded-3xl border border-line bg-white">
        {links.map((l) => (
          <li key={l.to} className="border-b border-line-3 last:border-b-0">
            <Link
              to={l.to}
              className="flex h-13.5 items-center justify-between px-4 text-[15px] font-bold"
            >
              <span>{l.label}</span>
              <span className="text-[13px] font-bold text-subtle">
                {l.meta} <span aria-hidden="true">›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Button
        variant="danger"
        size="md"
        onClick={() => void logout().then(() => navigate('/login', { replace: true }))}
      >
        Log out
      </Button>
    </>
  )
}
