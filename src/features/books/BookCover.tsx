import type { ReactNode } from 'react'
import type { Book } from '../../lib/api/types'
import { bookColors } from './palette'
import { useCover } from './useCover'

interface BookCoverProps {
  book: Pick<Book, 'id' | 'title'>
  className?: string
  /** Title drawn on the flat colour while the image is missing (design placeholder). */
  titleClassName?: string
  children?: ReactNode
}

export function BookCover({ book, className = '', titleClassName, children }: BookCoverProps) {
  const src = useCover(book.id)
  const { bg, ink } = bookColors(book.id)
  return (
    <div className={`relative flex items-end overflow-hidden ${bg} ${className}`}>
      {src ? (
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        titleClassName && (
          <span
            aria-hidden="true"
            className={`relative font-display font-extrabold ${ink} ${titleClassName}`}
          >
            {book.title}
          </span>
        )
      )}
      {children}
    </div>
  )
}
