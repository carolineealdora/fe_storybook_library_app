import { Link, useParams } from 'react-router'
import { buttonClass } from '../components/ui/buttonStyles'
import { LockIcon } from '../components/ui/icons'
import { ErrorState, Skeleton } from '../components/ui/States'
import { api } from '../lib/api/endpoints'
import { useApi } from '../lib/api/useApi'
import { useGoBack } from '../lib/useGoBack'
import { BookViewer } from '../features/reader/BookViewer'
import { useSession } from '../features/session/session-context'

/** D1 / D2 · US-07. Locked content is never returned (403 BOOK_LOCKED, E4/E18). */
export default function ReaderRoute() {
  const { id = '' } = useParams()
  const { viewMode } = useSession()
  const content = useApi(`content:${id}`, () => api.content(id).then((b) => b.arrayBuffer()))
  const title = useApi(`book:${id}`, () => api.book(id)).data?.title
  const child = viewMode === 'child'

  const close = useGoBack('/')

  if (content.data) return <BookViewer data={content.data} title={title} onClose={close} />

  if (content.error?.code === 'BOOK_LOCKED') {
    return (
      <main
        className={`flex min-h-dvh items-center justify-center p-6 ${child ? 'bg-teal-50' : 'bg-cream'}`}
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-3.5 rounded-[32px] bg-white px-5.5 py-7 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-sun text-ink">
            <LockIcon className="size-11" />
          </span>
          <h1 className="font-display text-[28px] leading-none font-extrabold text-teal-900">
            This book is locked
          </h1>
          <p className="text-[17px] leading-snug font-bold text-ink-body">
            {child
              ? 'Ask your parent to unlock this book.'
              : 'Buy this book or subscribe to read it.'}
          </p>
          {child ? (
            <Link
              to="/"
              replace
              className={`${buttonClass('teal', 'lg')} h-15 w-full rounded-[20px] text-xl`}
            >
              Okay!
            </Link>
          ) : (
            <Link to={`/books/${id}`} replace className={`${buttonClass('primary', 'lg')} w-full`}>
              See book
            </Link>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col gap-4 bg-cream p-4.5 pt-10">
      {content.error ? (
        <ErrorState
          message={
            content.error.code === 'BOOK_NOT_FOUND'
              ? 'This book isn’t available any more.'
              : content.error.message
          }
          onRetry={content.error.code === 'BOOK_NOT_FOUND' ? undefined : content.reload}
        />
      ) : (
        <div role="status" aria-label="Opening book" className="flex flex-1 flex-col gap-4">
          <Skeleton className="flex-1 rounded-4xl" />
          <Skeleton className="h-15" />
        </div>
      )}
    </main>
  )
}
