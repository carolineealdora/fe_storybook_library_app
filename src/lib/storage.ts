// localStorage can throw (private mode, blocked storage); the app must still run without it.
export type StorageKey = 'access_token' | 'refresh_token' | 'parent_token' | 'view_mode'

export function readStore(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStore(key: StorageKey, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ponytail: storage blocked → session lasts until reload, which is acceptable.
  }
}
