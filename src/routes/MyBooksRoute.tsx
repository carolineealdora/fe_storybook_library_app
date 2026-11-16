import { Link, useNavigate } from 'react-router'
import { buttonClass } from '../components/ui/buttonStyles'
import { EmptyState, ErrorState, LoadingList } from '../components/ui/States'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import { formatDate } from '../lib/format'
import { BookCard } from '../features/books/BookCard'
import { BookCover } from '../features/books/BookCover'
import { BookGrid } from '../features/books/BookGrid'
import { useSession } from '../features/session/session-context'
import { AppHeader } from '../features/shell/AppHeader'
import { SubscribeBanner } from '../features/shell/SubscribeBanner'

/** B3 / C5 · US-08: purchased books only, newest first. */
export default function MyBooksRoute() {
  const { viewMode } = useSession()
  const navigate = useNavigate()
  const books = useApi('my-books', api.myBooks)
  const child = viewMode === 'child'

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 pt-4 pb-6">
        {!child && <SubscribeBanner />}
        <div className="flex flex-col gap-0.5">
          <h1
            className={
              child
                ? 'font-display text-[34px] leading-none font-extrabold text-teal-900'
                : 'font-display text-2xl leading-tight font-extrabold'
            }
          >
            {child ? 'My books' : 'My Book'}
          </h1>
          {!child && (
            <p className="text-[13px] font-semibold text-muted">Books you bought. Newest first.</p>
          )}
        </div>

        {books.data ? (
          books.data.length === 0 ? (
            <EmptyState
              title={child ? 'No books here yet' : 'No books bought yet'}
              body={child ? 'Let’s find a story to read!' : 'Books you buy stay here forever.'}
              action={
                <Link to="/" className={`${buttonClass(child ? 'teal' : 'primary', 'md')} w-full`}>
                  Go to Home
                </Link>
              }
            />
          ) : child ? (
            <BookGrid>
              {books.data.map((b) => (
                <li key={b.id}>
                  <BookCard
                    book={{ ...b, access: 'owned' }}
                    variant="child"
                    onOpen={() => navigate(`/books/${b.id}/read`)}
                  />
                </li>
              ))}
            </BookGrid>
          ) : (
            <ul className="grid gap-2.5 lg:grid-cols-2">
              {books.data.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-3xl border border-line bg-white p-2.5"
                >
                  <BookCover book={b} className="h-21 w-16 flex-none rounded-[10px]" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="font-display text-base leading-tight font-extrabold">{b.title}</p>
                    <p className="text-xs font-semibold text-muted">
                      Ages {b.age_label}
                      {b.purchased_at && ` · Bought ${formatDate(b.purchased_at)}`}
                    </p>
                  </div>
                  <Link
                    to={`/books/${b.id}/read`}
                    aria-label={`Read ${b.title}`}
                    className={buttonClass('primary', 'sm')}
                  >
                    Read
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : books.error ? (
          <ErrorState message={books.error.message} onRetry={books.reload} />
        ) : (
          <LoadingList label="Loading your books" />
        )}
      </main>
    </>
  )
}
