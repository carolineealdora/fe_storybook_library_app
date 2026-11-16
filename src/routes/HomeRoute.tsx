import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState, ErrorState } from '../components/ui/States'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import type { Book } from '../lib/api/types'
import { BookCard } from '../features/books/BookCard'
import { BookGrid, BookGridSkeleton } from '../features/books/BookGrid'
import { LockedBookModal } from '../features/books/LockedBookModal'
import { useSession } from '../features/session/session-context'
import { AppHeader } from '../features/shell/AppHeader'
import { SubscribeBanner } from '../features/shell/SubscribeBanner'

/** A2 / C2 · US-04, US-05: one mixed showcase of every published book. */
export default function HomeRoute() {
  const { viewMode } = useSession()
  const navigate = useNavigate()
  const books = useApi('books', api.books)
  const [lockedOpen, setLockedOpen] = useState(false)
  const child = viewMode === 'child'

  const open = (book: Book) => {
    if (!child) navigate(`/books/${book.id}`)
    else if (book.access === 'locked') setLockedOpen(true)
    else navigate(`/books/${book.id}/read`)
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3.5 px-4 pt-4 pb-6">
        {!child && <SubscribeBanner />}
        <h1
          className={
            child
              ? 'font-display text-[34px] leading-none font-extrabold text-teal-900'
              : 'font-display text-2xl leading-tight font-extrabold'
          }
        >
          {child ? 'Pick a story!' : 'All books'}
        </h1>
        {books.data ? (
          books.data.length === 0 ? (
            <EmptyState
              title="No books yet"
              body="New stories are on their way. Check back soon!"
            />
          ) : (
            <BookGrid>
              {books.data.map((b) => (
                <li key={b.id}>
                  <BookCard book={b} variant={viewMode} onOpen={open} />
                </li>
              ))}
            </BookGrid>
          )
        ) : books.error ? (
          <ErrorState message={books.error.message} onRetry={books.reload} />
        ) : (
          <BookGridSkeleton label="Loading books" />
        )}
      </main>
      {lockedOpen && <LockedBookModal onClose={() => setLockedOpen(false)} />}
    </>
  )
}
