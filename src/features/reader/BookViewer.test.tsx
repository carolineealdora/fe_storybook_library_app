import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookViewer } from './BookViewer'

// A malformed EPUB (e.g. no package document) makes epubjs hang instead of throwing.
vi.mock('epubjs', () => ({
  default: () => ({
    renderTo: () => ({
      themes: { register: () => {}, select: () => {} },
      hooks: { content: { register: () => {} } },
      on: () => {},
      display: () => new Promise(() => {}),
    }),
    destroy: () => {},
  }),
}))

describe('BookViewer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an error instead of loading forever when the EPUB never opens', async () => {
    vi.useFakeTimers()
    render(<BookViewer data={new ArrayBuffer(8)} onClose={() => {}} />)
    expect(screen.getByText('Opening book…')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't open this book.")
  })
})
