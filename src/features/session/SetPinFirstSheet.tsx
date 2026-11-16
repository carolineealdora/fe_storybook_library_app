import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Sheet } from '../../components/ui/Sheet'

/** C1: the parent tapped the toggle before setting a PIN (PRD E11). */
export function SetPinFirstSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Sheet title="Set a PIN first" onClose={onClose}>
      <p className="text-sm leading-normal font-semibold text-ink-body">
        Before handing over to your child, create a 4-digit PIN in Settings. You'll use it to come
        back to Parent view.
      </p>
      <Button
        className="mt-1.5"
        size="md"
        onClick={() => {
          onClose()
          navigate('/settings/pin')
        }}
      >
        Go to Settings
      </Button>
      <Button variant="ghost" size="md" onClick={onClose}>
        Not now
      </Button>
    </Sheet>
  )
}
