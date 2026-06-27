// ─────────────────────────────────────────────────────────────────────────
// Mastery scale — the SINGLE source of truth for 0–1 ↔ 0–100 conversions.
//
// concept_mastery.mastery_score is stored as a DECIMAL on the 0.0–1.0 scale.
// The UI always shows percentages (0–100). Historically these conversions were
// duplicated across API routes and pages, and an ambiguous `<= 1` check caused
// a stored 1% (integer 1) to be re-multiplied into "100%". Centralizing here
// means that whole class of bug can only ever live in ONE place.
// ─────────────────────────────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * A mastery_score read straight from the DB (0–1) → integer percent (0–100).
 * Use whenever you KNOW the value is on the 0–1 scale (e.g. evidence fields
 * like root_mastery / weak_mastery, or concept_mastery.mastery_score).
 */
export function fractionToPercent(fraction: number | null | undefined): number {
  if (fraction == null || Number.isNaN(fraction)) return 0
  return Math.round(clamp01(fraction) * 100)
}

/**
 * Normalize a mastery value of UNKNOWN scale to an integer percent (0–100).
 *
 * Two engines write weakness_signals path nodes with different scales:
 *   DB trigger : mastery on 0–1   (e.g. 0.01 = 1%)
 *   TS refresh : mastery on 0–100 (e.g. 1 = 1%, already a percent)
 *
 * A value STRICTLY below 1 is treated as a 0–1 fraction; anything >= 1 is
 * already a percent. The strict `< 1` is deliberate: a stored integer `1`
 * means 1%, not 100%.
 */
export function ambiguousToPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0
  return value < 1 ? Math.round(value * 100) : Math.round(value)
}
