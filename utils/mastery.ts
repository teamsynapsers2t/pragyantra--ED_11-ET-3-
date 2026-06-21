/**
 * mastery.ts — ARCHIVED (dead code)
 *
 * The mastery engine, weakness detection, time trap detection, and root flaw
 * detection ALL run inside Supabase PostgreSQL database triggers — NOT here.
 *
 * Pipeline (triggered on every INSERT into `attempts`):
 *
 *   attempts INSERT
 *     └── DB trigger: attempts_after_insert
 *           └── fn_apply_attempt(user_id, question_id)
 *                 ├── fn_update_concept_mastery()   → writes concept_mastery (EWMA)
 *                 ├── fn_detect_weak_concepts()     → writes weakness_signals (weak_concept)
 *                 ├── fn_detect_time_traps()        → writes weakness_signals (time_trap)
 *                 └── fn_detect_root_flaws()        → writes weakness_signals (root_flaw)
 *
 * The SQL source of truth lives in:
 *   sql/deploy_fn_detect_root_flaws.sql   ← fn_detect_root_flaws (deployed to Supabase)
 *   sql/fix_root_flaw_direction.sql       ← previous version (superseded)
 *   sql/verify_deployment.sql             ← verification queries
 *
 * DO NOT call these TypeScript functions. They will double-count data if called
 * alongside the DB trigger. See app/api/attempts/submit/route.ts for confirmation.
 */

import { SupabaseClient } from '@supabase/supabase-js'

/** @deprecated Logic runs in DB trigger fn_apply_attempt. Do not call. */
export async function updateConceptMastery(
  _supabase: SupabaseClient,
  _userUuid: string,
  _questionId: number
): Promise<void> {
  console.warn('[mastery.ts] updateConceptMastery() called but is a no-op — logic runs in Supabase DB trigger fn_apply_attempt.')
}

/** @deprecated Logic runs in DB trigger fn_detect_weak_concepts. Do not call. */
export async function detectWeakConcepts(
  _supabase: SupabaseClient,
  _userUuid: string,
  _conceptId: number
): Promise<void> {
  console.warn('[mastery.ts] detectWeakConcepts() called but is a no-op — logic runs in Supabase DB trigger.')
}

/** @deprecated Logic runs in DB trigger fn_detect_time_traps. Do not call. */
export async function detectTimeTraps(
  _supabase: SupabaseClient,
  _userUuid: string,
  _conceptId: number
): Promise<void> {
  console.warn('[mastery.ts] detectTimeTraps() called but is a no-op — logic runs in Supabase DB trigger.')
}

/** @deprecated Logic runs in DB trigger fn_detect_root_flaws. Do not call. */
export async function detectRootFlaws(
  _supabase: SupabaseClient,
  _userUuid: string
): Promise<void> {
  console.warn('[mastery.ts] detectRootFlaws() called but is a no-op — logic runs in Supabase DB trigger.')
}
