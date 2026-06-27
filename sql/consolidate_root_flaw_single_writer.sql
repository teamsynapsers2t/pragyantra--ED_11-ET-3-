-- =============================================================================
-- CONSOLIDATION: single writer for root_flaw signals
-- =============================================================================
--
-- PROBLEM (the dual-writer race)
-- ──────────────────────────────
-- `weakness_signals.root_flaw` rows are written by TWO engines with DIFFERENT
-- evidence schemas, and they overwrite each other (last writer wins):
--
--   1. DB trigger  fn_apply_attempt → fn_detect_root_flaws   (fires per attempt)
--        path nodes: { concept_id, concept_name, mastery }   mastery on 0–1
--
--   2. TS engine   app/api/weakness/refresh (v3)             (fires per session)
--        path nodes: { id, name, mastery, attempts, accuracy } mastery on 0–100
--        + multi-hop chains, statistical confidence, missing_foundation, unlocks
--
-- The two schemas are why the UI needed ambiguousToPercent() and why the
-- "100% mastery" class of bug kept reappearing.
--
-- DECISION
-- ────────
-- The TS v3 engine is strictly richer (multi-hop path, confidence, unlocks,
-- missing_foundation). Make it the SOLE writer of root_flaw by turning the DB
-- function fn_detect_root_flaws into a no-op. This does NOT require editing the
-- fn_apply_attempt trigger body — the trigger keeps calling the function, the
-- function simply does nothing now.
--
-- OWNERSHIP AFTER THIS MIGRATION
-- ──────────────────────────────
--   DB trigger (per attempt)   → concept_mastery, weak_concept, time_trap
--   TS engine  (per session)   → root_flaw, missing_foundation
--   (TS refresh deletes+reinserts all signals, so weak_concept/time_trap remain
--    consistent — they are re-derived by the DB trigger on the next attempt.)
--
-- No application code change is required: GET /api/weakness already normalizes,
-- and once the DB stops writing root_flaw only the TS 0–100 schema appears.
--
-- SAFETY
-- ──────
-- Fully reversible. To roll back, re-run sql/fn_detect_root_flaws_v2_full_path.sql
-- which restores the original detection logic.
-- =============================================================================

-- 1. Replace the detector with a no-op (keeps the same signature so the trigger
--    that PERFORMs it continues to work unchanged).
CREATE OR REPLACE FUNCTION fn_detect_root_flaws(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Intentionally a no-op as of the single-writer consolidation.
  -- Root-cause detection now lives exclusively in the TS v3 engine
  -- (app/api/weakness/refresh), which writes a richer multi-hop schema.
  -- See sql/consolidate_root_flaw_single_writer.sql for the rationale.
  RETURN;
END;
$$;

-- 2. Clear out any stale DB-written root_flaw rows so the next TS refresh
--    repopulates them cleanly in the unified 0–100 schema. (The TS engine also
--    deletes-all on refresh, so this is belt-and-suspenders for users who don't
--    refresh immediately.)
DELETE FROM weakness_signals WHERE signal = 'root_flaw';

-- 3. Verification — should return 0 rows (no detector logic left in the function
--    body beyond the no-op RETURN).
SELECT proname,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'fn_detect_root_flaws';
-- After running: trigger a practice session (or POST /api/weakness/refresh) and
-- confirm new root_flaw rows have evidence.path nodes shaped { id, name,
-- mastery, attempts, accuracy } with mastery on the 0–100 scale.
