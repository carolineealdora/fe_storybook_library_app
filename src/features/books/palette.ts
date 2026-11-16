// Flat cover colours from the design, used behind the cover image and while it loads.
const palette = [
  { bg: 'bg-teal-50', ink: 'text-teal-900' },
  { bg: 'bg-sun', ink: 'text-sun-ink' },
  { bg: 'bg-danger-bg', ink: 'text-danger-strong' },
  { bg: 'bg-lilac-50', ink: 'text-lilac-900' },
  { bg: 'bg-butter', ink: 'text-sun-ink' },
  { bg: 'bg-lilac-300', ink: 'text-lilac-900' },
] as const

export function bookColors(id: string): (typeof palette)[number] {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return palette[Math.abs(hash) % palette.length] ?? palette[0]
}
