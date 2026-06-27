import { describe, it, expect } from 'vitest'
import {
  sampleConfidence,
  findRoot,
  missingFoundations,
  WEAK_THRESHOLD,
  type MasteryMap,
  type RequiresMap,
} from './rootCause'

const info = (mastery: number, attempts = 10, correct = 0) => ({ mastery, attempts, correct })

describe('sampleConfidence', () => {
  it('returns 0 for no attempts', () => {
    expect(sampleConfidence(0)).toBe(0)
    expect(sampleConfidence(-5)).toBe(0)
  })

  it('never reaches 100 and discounts small samples', () => {
    expect(sampleConfidence(8)).toBe(50)        // 8/(8+8)
    expect(sampleConfidence(2)).toBe(20)        // 2/(2+8)
    expect(sampleConfidence(1000)).toBeLessThan(100)
  })

  it('respects a custom k', () => {
    expect(sampleConfidence(6, 6)).toBe(50)     // 6/(6+6)
  })
})

describe('findRoot — multi-hop prerequisite traversal', () => {
  it('returns null when there are no prerequisites', () => {
    const requires: RequiresMap = {}
    const M: MasteryMap = { 1: info(0.3) }
    expect(findRoot(1, 0.3, requires, M)).toBeNull()
  })

  it('finds a direct weaker prerequisite (1 hop)', () => {
    // 1 (Spring Force, 0.26) → 2 (Newton Laws, 0.15)
    const requires: RequiresMap = { 1: [{ rootId: 2, strength: 8 }] }
    const M: MasteryMap = { 1: info(0.26), 2: info(0.15) }
    const root = findRoot(1, 0.26, requires, M)
    expect(root).not.toBeNull()
    expect(root!.id).toBe(2)
    expect(root!.path).toEqual([1, 2])
  })

  it('walks multiple hops to the deepest weakest foundation', () => {
    // 1 (0.5) → 2 (0.4) → 3 (0.1). Deepest weakest = 3.
    const requires: RequiresMap = {
      1: [{ rootId: 2, strength: 9 }],
      2: [{ rootId: 3, strength: 7 }],
    }
    const M: MasteryMap = { 1: info(0.5), 2: info(0.4), 3: info(0.1) }
    const root = findRoot(1, 0.5, requires, M)
    expect(root!.id).toBe(3)
    expect(root!.path).toEqual([1, 2, 3])
    expect(root!.minStrength).toBe(7) // weakest link in the chain
  })

  it('does NOT branch into solid (>= threshold) foundations', () => {
    // prerequisite 2 is solid (0.9) → should be ignored, no root found
    const requires: RequiresMap = { 1: [{ rootId: 2, strength: 8 }] }
    const M: MasteryMap = { 1: info(0.5), 2: info(0.9) }
    expect(findRoot(1, 0.5, requires, M)).toBeNull()
  })

  it('ignores prerequisites that are weak but not weaker than the symptom', () => {
    // symptom 0.3, prereq 0.5 (weak for JEE but stronger than symptom) → no root
    const requires: RequiresMap = { 1: [{ rootId: 2, strength: 8 }] }
    const M: MasteryMap = { 1: info(0.3), 2: info(0.5) }
    expect(findRoot(1, 0.3, requires, M)).toBeNull()
  })

  it('skips unpracticed prerequisites (no mastery row)', () => {
    const requires: RequiresMap = { 1: [{ rootId: 2, strength: 8 }] }
    const M: MasteryMap = { 1: info(0.3) } // 2 never practiced
    expect(findRoot(1, 0.3, requires, M)).toBeNull()
  })

  it('terminates on cyclic graphs without infinite recursion', () => {
    const requires: RequiresMap = {
      1: [{ rootId: 2, strength: 8 }],
      2: [{ rootId: 1, strength: 8 }], // cycle
    }
    const M: MasteryMap = { 1: info(0.3), 2: info(0.2) }
    const root = findRoot(1, 0.3, requires, M)
    expect(root!.id).toBe(2)
  })

  it('WEAK_THRESHOLD is the JEE 0.8 standard', () => {
    expect(WEAK_THRESHOLD).toBe(0.8)
  })
})

describe('missingFoundations', () => {
  it('lists direct prerequisites the user has never practiced', () => {
    const requires: RequiresMap = {
      1: [
        { rootId: 2, strength: 9 },
        { rootId: 3, strength: 5 },
      ],
    }
    const M: MasteryMap = { 1: info(0.3), 2: info(0.4) } // 3 never practiced
    const missing = missingFoundations(1, requires, M)
    expect(missing).toEqual([{ id: 3, strength: 5 }])
  })

  it('returns empty when all prerequisites are practiced', () => {
    const requires: RequiresMap = { 1: [{ rootId: 2, strength: 9 }] }
    const M: MasteryMap = { 1: info(0.3), 2: info(0.4) }
    expect(missingFoundations(1, requires, M)).toEqual([])
  })
})
