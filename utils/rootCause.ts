// ─────────────────────────────────────────────────────────────────────────
// Root-cause engine — PURE logic, extracted from app/api/weakness/refresh so
// it can be unit-tested in isolation (no Supabase, no Clerk, no I/O).
//
// All mastery values here are on the 0–1 scale (as stored in concept_mastery).
// ─────────────────────────────────────────────────────────────────────────

export const WEAK_THRESHOLD = 0.8 // JEE standard: below 80% mastery counts as weak

/**
 * Smooth statistical confidence: n attempts → n/(n+k), as an integer percent.
 * Never reaches 100, and discounts tiny samples. k controls how many attempts
 * you need before the signal is "trusted".
 */
export function sampleConfidence(n: number, k = 8): number {
  if (n <= 0) return 0
  return Math.round(100 * (n / (n + k)))
}

export type MasteryInfo = { mastery: number; attempts: number; correct: number }
/** Mastery lookup for PRACTICED concepts only (key = concept_id). */
export type MasteryMap = Record<number, MasteryInfo>
/** requires[S] = prerequisites S depends on (edges walked DOWNWARD to roots). */
export type RequiresMap = Record<number, { rootId: number; strength: number }[]>

export type RootResult = { id: number; path: number[]; minStrength: number }

/**
 * MULTI-HOP root finder. From symptom `startId`, walk DOWNWARD through
 * practiced-weak prerequisites and return the weakest reachable foundation that
 * is weaker than the symptom, with the full chain path S → … → root.
 *
 * Returns null when no prerequisite is both practiced, weak, and weaker than S.
 */
export function findRoot(
  startId: number,
  startMastery: number,
  requires: RequiresMap,
  M: MasteryMap,
  weakThreshold: number = WEAK_THRESHOLD,
): RootResult | null {
  const visited = new Set<number>([startId])
  let best: RootResult | null = null

  const dfs = (id: number, path: number[], minStrength: number) => {
    for (const dep of requires[id] || []) {
      const r = M[dep.rootId]
      if (!r) continue // not practiced — handled by missingFoundations
      if (r.mastery >= weakThreshold) continue // foundation is solid → branch ends
      if (visited.has(dep.rootId)) continue
      visited.add(dep.rootId)

      const path2 = [...path, dep.rootId]
      const minStr2 = Math.min(minStrength, dep.strength)

      if (r.mastery < startMastery) {
        const better =
          !best ||
          r.mastery < M[best.id].mastery || // weaker wins
          (r.mastery === M[best.id].mastery && path2.length > best.path.length) // deeper wins
        if (better) best = { id: dep.rootId, path: path2, minStrength: minStr2 }
      }
      dfs(dep.rootId, path2, minStr2)
    }
  }
  dfs(startId, [startId], 10)
  return best
}

/** Direct prerequisites of `startId` the user has NEVER practiced. */
export function missingFoundations(
  startId: number,
  requires: RequiresMap,
  M: MasteryMap,
): { id: number; strength: number }[] {
  return (requires[startId] || [])
    .filter((dep) => !M[dep.rootId])
    .map((dep) => ({ id: dep.rootId, strength: dep.strength }))
}
