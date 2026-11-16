import { describe, expect, it } from 'vitest'
import { formatIDR, splitBenefits } from './format'

describe('formatIDR', () => {
  it('formats rupiah the way the design shows it', () => {
    expect(formatIDR(29000)).toBe('Rp 29.000')
    expect(formatIDR(0)).toBe('Rp 0')
  })
})

describe('splitBenefits', () => {
  it('splits admin-entered lines', () => {
    expect(splitBenefits('Unlock every book\nCancel anytime')).toEqual([
      'Unlock every book',
      'Cancel anytime',
    ])
  })
  it('falls back to sentences for the seeded plan', () => {
    expect(
      splitBenefits('Read all published books. New books every month. Cancel anytime.'),
    ).toEqual(['Read all published books', 'New books every month', 'Cancel anytime'])
  })
})
