import { describe, it, expect } from 'vitest'
import { fractionToPercent, ambiguousToPercent } from './scale'

describe('fractionToPercent (known 0–1 scale)', () => {
  it('converts fractions to integer percents', () => {
    expect(fractionToPercent(0)).toBe(0)
    expect(fractionToPercent(0.01)).toBe(1)
    expect(fractionToPercent(0.5)).toBe(50)
    expect(fractionToPercent(0.756)).toBe(76)
    expect(fractionToPercent(1)).toBe(100)
  })

  it('clamps out-of-range values', () => {
    expect(fractionToPercent(1.4)).toBe(100)
    expect(fractionToPercent(-0.2)).toBe(0)
  })

  it('treats null/undefined/NaN as 0', () => {
    expect(fractionToPercent(null)).toBe(0)
    expect(fractionToPercent(undefined)).toBe(0)
    expect(fractionToPercent(NaN)).toBe(0)
  })
})

describe('ambiguousToPercent (mixed-scale path nodes)', () => {
  it('treats values < 1 as 0–1 fractions', () => {
    expect(ambiguousToPercent(0.01)).toBe(1)   // DB trigger: 1%
    expect(ambiguousToPercent(0.5)).toBe(50)
    expect(ambiguousToPercent(0.99)).toBe(99)
  })

  it('treats values >= 1 as already-percent (the regression guard)', () => {
    // THE BUG: a stored integer 1 means 1%, NOT 100%.
    expect(ambiguousToPercent(1)).toBe(1)
    expect(ambiguousToPercent(39)).toBe(39)
    expect(ambiguousToPercent(100)).toBe(100)
  })

  it('treats null/undefined/NaN as 0', () => {
    expect(ambiguousToPercent(null)).toBe(0)
    expect(ambiguousToPercent(undefined)).toBe(0)
    expect(ambiguousToPercent(NaN)).toBe(0)
  })
})
