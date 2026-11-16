import { useEffect, useRef, useState } from 'react'
import type Book from 'epubjs/types/book'
import type Rendition from 'epubjs/types/rendition'
import type { Location } from 'epubjs/types/rendition'
import type Contents from 'epubjs/types/contents'
import { ErrorState, Skeleton } from '../../components/ui/States'

type Theme = 'day' | 'night'

interface Position {
  page: number
  total: number
  atStart: boolean
  atEnd: boolean
}

interface BookViewerProps {
  data: ArrayBuffer
  title?: string
  onClose: () => void
}

const OPEN_TIMEOUT_MS = 10_000
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&display=swap'

const pageButton =
  'flex h-15 items-center justify-center rounded-[20px] font-display text-lg font-extrabold disabled:opacity-40 md:w-45'

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function registerThemes(rendition: Rendition) {
  const font = "'Baloo 2', ui-rounded, sans-serif"
  rendition.themes.register('day', {
    body: {
      background: cssVar('--color-cream'),
      color: cssVar('--color-ink'),
      'font-family': font,
    },
  })
  rendition.themes.register('night', {
    body: {
      background: cssVar('--color-night-bg'),
      color: cssVar('--color-night-text'),
      'font-family': font,
    },
  })
}

/** D1 / D2 · US-07: paginated EPUB with Back/Next and Day/Night. */
export function BookViewer({ data, title, onClose }: BookViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<Rendition | undefined>(undefined)
  const themeRef = useRef<Theme>('day')
  const [theme, setTheme] = useState<Theme>('day')
  const [pos, setPos] = useState<Position>()
  const [failed, setFailed] = useState(false)
  const night = theme === 'night'

  useEffect(() => {
    let cancelled = false
    let opened = false
    let epub: Book | undefined
    // A malformed EPUB makes epubjs hang instead of throwing, so give up if no page shows in time.
    const timer = setTimeout(() => {
      if (!cancelled && !opened) setFailed(true)
    }, OPEN_TIMEOUT_MS)

    // ponytail: one page per EPUB section (picture books). A long text section still pages with
    // Next/Back but keeps its number; switch to epub.locations if text-heavy books arrive.
    const report = (loc: Location) => {
      if (cancelled || !epub) return
      opened = true
      const total = epub.spine.last().index + 1
      setPos({ page: loc.start.index + 1, total, atStart: loc.atStart, atEnd: loc.atEnd })
    }

    void (async () => {
      try {
        const { default: ePub } = await import('epubjs')
        if (cancelled || !hostRef.current) return
        epub = ePub(data)
        const rendition = epub.renderTo(hostRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          allowScriptedContent: false,
        })
        renditionRef.current = rendition
        registerThemes(rendition)
        rendition.themes.select(themeRef.current)
        // Pages render in their own iframe, so it needs the font stylesheet too. Not awaited:
        // a slow or blocked font must not hold the page back (it falls back to the system font).
        rendition.hooks.content.register((contents: Contents) => {
          void contents.addStylesheet(FONT_CSS)
        })
        rendition.on('relocated', report)
        await rendition.display()
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()

    return () => {
      cancelled = true
      clearTimeout(timer)
      renditionRef.current = undefined
      epub?.destroy()
    }
  }, [data])

  const chooseTheme = (t: Theme) => {
    themeRef.current = t
    setTheme(t)
    renditionRef.current?.themes.select(t)
  }

  const next = () => void renditionRef.current?.next()
  const prev = () => void renditionRef.current?.prev()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') void renditionRef.current?.next()
      if (e.key === 'ArrowLeft') void renditionRef.current?.prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const pageLabel = pos ? `Page ${pos.page} of ${pos.total}` : failed ? '' : 'Opening book…'

  return (
    <div
      className={`flex h-dvh flex-col ${night ? 'bg-night-bg text-night-text' : 'bg-cream text-ink'}`}
    >
      <header className="flex items-center justify-between gap-3 px-3.5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-2.5 md:px-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close book"
          className={`flex size-12 flex-none items-center justify-center rounded-full text-lg font-extrabold ${night ? 'bg-night-surface text-night-accent' : 'border-2 border-line-2 bg-white'}`}
        >
          <span aria-hidden="true">✕</span>
        </button>
        <p
          aria-live="polite"
          className={`truncate text-sm font-bold ${night ? 'text-night-muted' : 'text-muted'}`}
        >
          {title && <span className="hidden md:inline">{title} · </span>}
          {pageLabel}
        </p>
        <div
          role="group"
          aria-label="Reading theme"
          className={`flex flex-none rounded-full p-1 ${night ? 'bg-night-surface' : 'bg-butter'}`}
        >
          {(['day', 'night'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => chooseTheme(t)}
              className={`flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-xs font-bold capitalize ${
                theme === t
                  ? night
                    ? 'bg-lilac-300 text-night-bg'
                    : 'bg-sun text-ink'
                  : night
                    ? 'text-night-muted'
                    : 'text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="relative min-h-0 flex-1 px-4.5 py-2 md:px-7">
        {failed ? (
          <div className="flex h-full items-center justify-center">
            <ErrorState message="We couldn't open this book. Please try again later." />
          </div>
        ) : (
          <>
            {!pos && (
              <Skeleton className="absolute inset-x-4.5 inset-y-2 rounded-4xl md:inset-x-7" />
            )}
            <div
              ref={hostRef}
              className="h-full w-full"
              aria-label={title ? `${title} pages` : 'Book pages'}
            />
          </>
        )}
      </main>

      <nav
        aria-label="Pages"
        className="mx-auto grid w-full grid-cols-2 gap-3 px-4.5 pt-3.5 pb-[max(env(safe-area-inset-bottom),1.625rem)] md:flex md:justify-between md:px-7"
      >
        <button
          type="button"
          onClick={prev}
          disabled={!pos || pos.atStart}
          className={`${pageButton} ${night ? 'bg-night-surface text-night-accent' : 'border-2 border-line-2 bg-white text-ink'}`}
        >
          ‹ Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!pos || pos.atEnd}
          className={`${pageButton} ${night ? 'bg-sun text-night-bg' : 'bg-primary text-white'}`}
        >
          Next ›
        </button>
      </nav>
    </div>
  )
}
