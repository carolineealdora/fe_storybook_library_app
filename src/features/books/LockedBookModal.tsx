import { Button } from '../../components/ui/Button'
import { LockIcon } from '../../components/ui/icons'
import { Sheet } from '../../components/ui/Sheet'

/** C3: kind, price-free message when a child taps a locked book (US-05). */
export function LockedBookModal({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="This book is still locked"
      placement="center"
      scrim="teal"
      onClose={onClose}
      icon={
        <span className="flex size-24 items-center justify-center rounded-full bg-sun text-ink">
          <LockIcon className="size-11" />
        </span>
      }
    >
      <p className="text-[17px] leading-snug font-bold text-ink-body">
        Ask your parent to unlock this book.
      </p>
      <Button
        variant="teal"
        className="mt-1.5 h-15 w-full rounded-[20px] text-xl"
        onClick={onClose}
      >
        Okay!
      </Button>
    </Sheet>
  )
}
