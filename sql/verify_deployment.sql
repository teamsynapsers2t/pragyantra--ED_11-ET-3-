-- =============================================================================
-- STEP 2: VERIFY DEPLOYMENT
-- Run this AFTER deploy_fn_detect_root_flaws.sql
-- Run each block separately, or all at once in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CHECK 1: Confirm fn_detect_root_flaws exists in the DB
-- Expected: 1 row returned with proname = 'fn_detect_root_flaws'
-- -----------------------------------------------------------------------------
SELECT
  p.proname                          AS function_name,
  pg_get_function_result(p.oid)      AS returns,
  LEFT(pg_get_functiondef(p.oid), 200) AS definition_preview
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'fn_detect_root_flaws';

-- -----------------------------------------------------------------------------
-- CHECK 2: Confirm the function body uses 0.5 threshold (not 50)
-- Expected: 1 row — confirms the new scale-correct version is deployed
-- -----------------------------------------------------------------------------
SELECT
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%mastery_score < 0.5%'
    THEN 'PASS: Function uses 0-1 scale threshold (< 0.5)'
    WHEN pg_get_functiondef(p.oid) LIKE '%mastery_score < 50%'
    THEN 'FAIL: Old version still deployed — uses 0-100 threshold (< 50). Re-run deploy_fn_detect_root_flaws.sql'
    ELSE 'UNKNOWN: Cannot determine scale from function body'
  END AS scale_check
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'fn_detect_root_flaws';

-- -----------------------------------------------------------------------------
-- CHECK 3: Manually call fn_detect_root_flaws for ALL users who have
--          concept_mastery records. Triggers immediate re-evaluation.
-- Expected: No error. Run SELECT on weakness_signals after this.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_user uuid;
  v_count INT := 0;
BEGIN
  FOR v_user IN
    SELECT DISTINCT user_id FROM concept_mastery
  LOOP
    PERFORM fn_detect_root_flaws(v_user);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'fn_detect_root_flaws called for % users', v_count;
END $$;

-- -----------------------------------------------------------------------------
-- CHECK 4: Count root_flaw signals now inserted
-- Expected: >= 1 row for users who have weak child + weak parent + prerequisite
-- -----------------------------------------------------------------------------
SELECT
  ws.user_id,
  ws.concept_id         AS child_concept_id,
  c_child.concept_name  AS child_concept_name,
  ws.severity,
  ws.severity_score,
  ws.confidence_score,
  ws.evidence->>'root_concept_id'   AS root_concept_id,
  ws.evidence->>'root_concept_name' AS root_concept_name,
  ws.evidence->>'root_mastery'      AS root_mastery,
  ws.evidence->>'weak_mastery'      AS child_mastery,
  ws.evidence->>'root_flaw_score'   AS root_flaw_score,
  ws.created_at
FROM weakness_signals ws
LEFT JOIN concepts c_child ON c_child.id = ws.concept_id
WHERE ws.signal = 'root_flaw'
ORDER BY ws.severity_score DESC;

-- -----------------------------------------------------------------------------
-- CHECK 5: Confirm the specific case — concept 26 (Momentum) -> concept 17 (Newton's Laws)
-- Expected: 1+ rows where child=26 and root_concept_id=17
-- -----------------------------------------------------------------------------
SELECT
  CASE
    WHEN COUNT(*) > 0
    THEN 'PASS: root_flaw signal exists for concept 26 (Momentum) caused by concept 17 (Newton Laws)'
    ELSE 'FAIL: No root_flaw signal found for concept 26 -> 17. Check concept_mastery data for each user.'
  END AS result,
  COUNT(*) AS signal_count
FROM weakness_signals
WHERE signal = 'root_flaw'
  AND concept_id = 26
  AND (evidence->>'root_concept_id')::INT = 17;

-- -----------------------------------------------------------------------------
-- CHECK 6: Confirm mastery_score scale in concept_mastery
-- Expected: max mastery_score <= 1.0 (confirms 0-1 storage scale)
--           If max > 1, mixed data exists — needs migration
-- -----------------------------------------------------------------------------
SELECT
  MIN(mastery_score)  AS min_mastery,
  MAX(mastery_score)  AS max_mastery,
  AVG(mastery_score)  AS avg_mastery,
  COUNT(*)            AS total_rows,
  CASE
    WHEN MAX(mastery_score) <= 1.0
    THEN 'CONFIRMED: 0-1 scale. Thresholds in fn_detect_root_flaws must use 0.5 / 0.6'
    WHEN MAX(mastery_score) <= 100
    THEN 'WARNING: Mixed or 0-100 scale detected. Check all rows where mastery_score > 1'
    ELSE 'ERROR: mastery_score out of expected range'
  END AS scale_verdict
FROM concept_mastery;

-- -----------------------------------------------------------------------------
-- CHECK 7: Show any rows with mastery_score > 1.0 (bad data — wrong scale)
-- Expected: 0 rows. If rows appear, they were written by old 0-100 code.
-- -----------------------------------------------------------------------------
SELECT
  user_id,
  concept_id,
  mastery_score,
  confidence_score,
  total_attempts,
  total_correct,
  'SCALE BUG: mastery stored as 0-100 but should be 0-1' AS issue
FROM concept_mastery
WHERE mastery_score > 1.0
ORDER BY mastery_score DESC;

-- -----------------------------------------------------------------------------
-- CHECK 8: Confirm fn_apply_attempt trigger exists and fires fn_detect_root_flaws
-- Expected: 1 row showing the trigger on attempts table
-- -----------------------------------------------------------------------------
SELECT
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  t.event_object_table,
  t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_schema = 'public'
  AND t.event_object_table = 'attempts'
ORDER BY t.trigger_name;

-- =============================================================================
-- SUMMARY
-- After running all checks:
--   CHECK 1 → function exists
--   CHECK 2 → PASS (0-1 scale deployed)
--   CHECK 3 → no errors (called for all users)
--   CHECK 4 → >= 1 root_flaw row visible
--   CHECK 5 → PASS (concept 26 -> 17 signal confirmed)
--   CHECK 6 → max <= 1.0 (0-1 scale confirmed)
--   CHECK 7 → 0 rows (no bad scale data)
--   CHECK 8 → trigger exists on attempts table
-- =============================================================================
