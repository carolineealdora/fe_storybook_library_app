const idr = new Intl.NumberFormat('id-ID')

/** 29000 → "Rp 29.000" (design format). */
export const formatIDR = (amount: number): string => `Rp ${idr.format(amount)}`

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

/** "16 Dec 2026" */
export const formatDate = (iso: string): string => day.format(new Date(iso))

/** "14 Nov 2026 · 19:42" */
export const formatDateTime = (iso: string): string =>
  `${day.format(new Date(iso))} · ${time.format(new Date(iso))}`

/** Admin writes benefits one per line; the seeded plan uses sentences. */
export const splitBenefits = (text: string): string[] => {
  const byLine = text.split(/\r?\n/)
  const parts = byLine.length > 1 ? byLine : text.split(/\.\s+/)
  return parts.map((s) => s.trim().replace(/\.$/, '')).filter(Boolean)
}
