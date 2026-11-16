import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { ErrorState, Notice, Skeleton } from '../components/ui/States'
import { toApiError } from '../lib/api/errors'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import type { Book } from '../lib/api/types'
import { formatIDR } from '../lib/format'
import { BookCover } from '../features/books/BookCover'
import { bookColors } from '../features/books/palette'
import { Pill } from '../components/ui/Pill'

/** A3 / A4 · US-06: actions follow `access` (API contract). */
export default function BookDetailRoute() {
  const { id = '' } = useParams()
  const book = useApi(`book:${id}`, () => api.book(id))

  if (book.data) return <BookDetail book={book.data} onStale={book.reload} />
  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <div className="flex h-75 flex-col bg-butter px-5 pt-10 pb-5">
        <BackButton fallback="/" tone="white" />
      </div>
      <div className="flex flex-col gap-3 p-5">
        {book.error ? (
          <ErrorState
            message={
              book.error.code === 'BOOK_NOT_FOUND'
                ? 'This book isn’t available any more.'
                : book.error.message
            }
            onRetry={book.error.code === 'BOOK_NOT_FOUND' ? undefined : book.reload}
          />
        ) : (
          <div role="status" aria-label="Loading book" className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20" />
          </div>
        )}
      </div>
    </main>
  )
}

function BookDetail({ book, onStale }: { book: Book; onStale: () => void }) {
  const navigate = useNavigate()
  const plan = useApi(book.access === 'locked' ? 'plan' : null, api.plan).data
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string>()
  const { bg } = bookColors(book.id)
  const free = book.price === 0

  const buyNow = async () => {
    if (buying) return
    setBuying(true)
    setError(undefined)
    try {
      const order = await api.createBookOrder(book.id)
      navigate(`/books/${book.id}/checkout`, { state: { order } })
    } catch (e) {
      const err = toApiError(e)
      // E1 / E2 / E10: access changed under us; re-read the book so the right button shows.
      if (['BOOK_ALREADY_OWNED', 'SUBSCRIPTION_ACTIVE', 'BOOK_NOT_PURCHASABLE'].includes(err.code))
        onStale()
      if (err.code !== 'PARENT_MODE_REQUIRED') setError(err.message)
      setBuying(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white md:flex-row">
      <div
        className={`flex h-75 flex-col px-5 pt-[max(env(safe-area-inset-top),2.5rem)] pb-5 md:h-auto md:w-1/2 md:pb-10 ${bg}`}
      >
        <div className="flex items-center justify-between">
          <BackButton fallback="/" tone="white" />
          {book.access === 'subscribed' && <Pill tone="brand">Subscribed</Pill>}
        </div>
        <BookCover
          book={book}
          className="m-auto mb-0 h-50 w-37.5 rounded-xl p-3 shadow-[0_10px_24px_rgb(45_41_31/0.25)] md:mb-auto md:h-80 md:w-60"
          titleClassName="text-xl leading-none"
        >
          <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-ink">
            {book.age_label}
          </span>
        </BookCover>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-2.5 px-5 pt-4.5 pb-[max(env(safe-area-inset-bottom),1.25rem)] md:justify-center">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-2xl leading-tight font-extrabold">{book.title}</h1>
          <p className="text-sm font-semibold text-muted">
            by {book.author} · Ages {book.age_label}
          </p>
        </div>
        <p className="text-sm leading-normal font-medium text-pretty text-ink-body">
          {book.description}
        </p>
        <p
          className={`font-display text-[22px] font-extrabold ${book.access === 'locked' ? 'text-primary' : free ? 'text-teal-700' : 'text-subtle'}`}
        >
          {free ? 'Free' : formatIDR(book.price)}
        </p>
        {error && <Notice>{error}</Notice>}

        <div className="mt-auto flex flex-col gap-2.5 pt-4 md:mt-6">
          {book.access === 'locked' && (
            <>
              <Button onClick={() => void buyNow()} disabled={buying} className="h-13.5">
                {buying ? 'Preparing checkout…' : 'Buy Now'}
              </Button>
              {plan && (
                <Link
                  to="/subscription"
                  className="flex items-center gap-2.5 rounded-2xl bg-lilac-50 px-3.5 py-3"
                >
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-lilac-900">
                      Read all books for {formatIDR(plan.price)}/month
                    </span>
                    <span className="text-xs font-semibold text-lilac-700">
                      Subscribe and unlock the whole library
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xl font-extrabold text-lilac-900">
                    ›
                  </span>
                </Link>
              )}
            </>
          )}
          {book.access === 'subscribed' && (
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="soft" disabled className="h-13.5">
                Subscribed
              </Button>
              <Link
                to={`/books/${book.id}/read`}
                className={`${buttonClass('primary', 'lg')} h-13.5`}
              >
                Read
              </Link>
            </div>
          )}
          {(book.access === 'owned' || book.access === 'free') && (
            <Link
              to={`/books/${book.id}/read`}
              className={`${buttonClass('primary', 'lg')} h-13.5`}
            >
              Read
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
