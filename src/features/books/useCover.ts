import { api } from '../../lib/api/endpoints'
import { useApi } from '../../lib/api/useApi'

// Object URLs are cached per book for the session so covers don't refetch between screens.
// ponytail: never revoked until logout; fine for a catalogue of ~100 books.
const cache = new Map<string, Promise<string>>()

export function clearCoverCache(): void {
  for (const url of cache.values()) url.then(URL.revokeObjectURL, () => undefined)
  cache.clear()
}

function loadCover(bookId: string): Promise<string> {
  let url = cache.get(bookId)
  if (!url) {
    url = api.cover(bookId).then((blob) => URL.createObjectURL(blob))
    url.catch(() => cache.delete(bookId))
    cache.set(bookId, url)
  }
  return url
}

/** Cover image URL, or undefined while loading / when the cover can't be fetched. */
export function useCover(bookId: string): string | undefined {
  return useApi(`cover:${bookId}`, () => loadCover(bookId)).data
}
