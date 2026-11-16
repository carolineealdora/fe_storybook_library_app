import { LockIcon } from '../../components/ui/icons'
import { formatIDR } from '../../lib/format'
import type { Book } from '../../lib/api/types'
import { BookCover } from './BookCover'

interface BookCardProps {
  book: Book
  variant: 'parent' | 'child'
  onOpen: (book: Book) => void
}

const priceLabel = (book: Book): { text: string; locked: boolean } => {
  switch (book.access) {
    case 'free':
      return { text: 'Free', locked: false }
    case 'owned':
      return { text: 'Owned', locked: false }
    case 'subscribed':
      return { text: 'Subscribed', locked: false }
    default:
      return { text: book.price === 0 ? 'Free' : formatIDR(book.price), locked: true }
  }
}

/** Cover-first card: age top left, lock or "Free" bottom right (PRD §10). */
export function BookCard({ book, variant, onOpen }: BookCardProps) {
  const child = variant === 'child'
  const locked = book.access === 'locked'
  const free = book.access === 'free'
  const price = priceLabel(book)
  // Parent hears the price label ("Free", "Owned", "Rp 29.000"); a child only hears locked / free.
  const tail = child ? (free ? ', free' : '') : `, ${price.text}`
  const label = `${book.title}, ages ${book.age_label}${locked ? ', locked' : ''}${tail}`

  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      aria-label={label}
      className={`flex w-full flex-col gap-1.5 text-left ${child ? 'rounded-4xl bg-white p-2 pb-2.5' : ''}`}
    >
      <BookCover
        book={book}
        className={`w-full ${child ? 'aspect-[11/12] rounded-3xl px-2.5 pt-8.5 pb-2.5' : 'aspect-[11/12] rounded-2xl px-3 pt-8.5 pb-3'}`}
        titleClassName={`${child ? 'pr-8.5 text-lg' : 'pr-7.5 text-[17px]'} leading-[1.05]`}
      >
        <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-ink">
          {book.age_label}
        </span>
        {locked && (
          <span
            className={`absolute right-2 bottom-2 flex items-center justify-center rounded-full bg-ink text-white ${child ? 'size-9' : 'size-7.5'}`}
          >
            <LockIcon className={child ? 'size-4' : 'size-3.5'} />
          </span>
        )}
        {free && (
          <span className="absolute right-2 bottom-2 rounded-full bg-teal-700 px-2.5 py-1 text-[11px] font-extrabold text-white">
            Free
          </span>
        )}
      </BookCover>
      <span
        className={
          child
            ? 'px-1 font-display text-sm leading-tight font-extrabold'
            : 'text-sm leading-tight font-bold'
        }
      >
        {book.title}
      </span>
      {!child && (
        <span
          className={`text-[13px] font-extrabold ${price.locked ? 'text-primary' : 'text-teal-700'}`}
        >
          {price.text}
        </span>
      )}
    </button>
  )
}
