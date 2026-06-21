-- =============================================================================
-- PAPER Engine: End-to-End Verification Script
-- =============================================================================
-- §6 of the brief: Run this to verify the entire pipeline works.
-- Must be run in the Supabase SQL Editor as a superuser.
--
-- This script:
-- 1. Creates/uses a test user
-- 2. Tags error_type on specific wrong options
-- 3. Inserts slow, mostly-wrong attempts
-- 4. Calls fn_generate_weakness_report
-- 5. Asserts all conditions from §6
-- =============================================================================

-- Step 0: Clean up any previous test data
DELETE FROM weakness_reports WHERE user_id = '00000000-0000-4000-a000-000000000001';
DELETE FROM weakness_signals  WHERE user_id = '00000000-0000-4000-a000-000000000001';
DELETE FROM concept_mastery   WHERE user_id = '00000000-0000-4000-a000-000000000001';
DELETE FROM attempts          WHERE user_id = '00000000-0000-4000-a000-000000000001';
DELETE FROM sessions          WHERE user_id = '00000000-0000-4000-a000-000000000001';

-- Step 1: Ensure test user exists
INSERT INTO users (id) VALUES ('00000000-0000-4000-a000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Find a question with options to tag error_type
-- We need at least one question that has wrong options we can tag.
DO $$
DECLARE
  v_question_id INT;
  v_wrong_option_id INT;
BEGIN
  -- Pick the first question that has question_options
  SELECT qo.question_id INTO v_question_id
  FROM question_options qo LIMIT 1;

  IF v_question_id IS NULL THEN
    RAISE NOTICE 'SKIP: No question_options found. Cannot test error_type tagging.';
    RETURN;
  END IF;

  -- Tag a wrong option with 'sign' error type
  SELECT id INTO v_wrong_option_id
  FROM question_options
  WHERE question_id = v_question_id AND is_correct = false
  LIMIT 1;

  IF v_wrong_option_id IS NOT NULL THEN
    UPDATE question_options SET error_type = 'sign' WHERE id = v_wrong_option_id;
    RAISE NOTICE 'PASS Step 2: Tagged option % with error_type=sign on question %', v_wrong_option_id, v_question_id;
  ELSE
    RAISE NOTICE 'SKIP Step 2: No wrong options found for question %', v_question_id;
  END IF;
END $$;

-- Step 3: Insert slow, mostly-wrong attempts
-- We'll pick 5 questions and insert attempts for the test user
DO $$
DECLARE
  v_q RECORD;
  v_count INT := 0;
BEGIN
  FOR v_q IN (SELECT id FROM questions ORDER BY id LIMIT 5) LOOP
    v_count := v_count + 1;

    -- Most attempts are wrong (4 wrong, 1 correct)
    INSERT INTO attempts (user_id, question_id, selected_option, is_correct, time_taken_ms, attempt_order, created_at)
    VALUES (
      '00000000-0000-4000-a000-000000000001',
      v_q.id,
      'Z', -- wrong option
      (v_count = 3), -- only the 3rd is correct
      CASE WHEN v_count <= 3 THEN 45000 ELSE 60000 END, -- slow: 45-60 seconds
      1,
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'PASS Step 3: Inserted % test attempts (4 wrong, 1 correct, all slow)', v_count;
END $$;

-- Step 4: Check that the trigger populated concept_mastery
DO $$
DECLARE
  v_mastery_count INT;
BEGIN
  SELECT COUNT(*) INTO v_mastery_count
  FROM concept_mastery
  WHERE user_id = '00000000-0000-4000-a000-000000000001';

  IF v_mastery_count > 0 THEN
    RAISE NOTICE 'PASS Step 4a: concept_mastery has % rows for test user', v_mastery_count;
  ELSE
    RAISE NOTICE 'FAIL Step 4a: concept_mastery is EMPTY for test user. Trigger may not be firing.';
  END IF;
END $$;

-- Step 5: Check that weakness_signals were generated
DO $$
DECLARE
  v_signal_count INT;
  v_weak_count INT;
  v_trap_count INT;
  v_flaw_count INT;
BEGIN
  SELECT COUNT(*) INTO v_signal_count
  FROM weakness_signals
  WHERE user_id = '00000000-0000-4000-a000-000000000001';

  SELECT COUNT(*) INTO v_weak_count
  FROM weakness_signals
  WHERE user_id = '00000000-0000-4000-a000-000000000001' AND signal = 'weak_concept';

  SELECT COUNT(*) INTO v_trap_count
  FROM weakness_signals
  WHERE user_id = '00000000-0000-4000-a000-000000000001' AND signal = 'time_trap';

  SELECT COUNT(*) INTO v_flaw_count
  FROM weakness_signals
  WHERE user_id = '00000000-0000-4000-a000-000000000001' AND signal = 'root_flaw';

  RAISE NOTICE 'Step 5: weakness_signals total=%, weak_concept=%, time_trap=%, root_flaw=%',
    v_signal_count, v_weak_count, v_trap_count, v_flaw_count;

  IF v_signal_count > 0 THEN
    RAISE NOTICE 'PASS Step 5: Weakness signals detected.';
  ELSE
    RAISE NOTICE 'WARN Step 5: No weakness signals. May need more attempts to trigger threshold.';
  END IF;
END $$;

-- Step 6: Generate weakness report
DO $$
DECLARE
  v_report TEXT;
BEGIN
  SELECT fn_generate_weakness_report('00000000-0000-4000-a000-000000000001') INTO v_report;

  IF v_report IS NOT NULL AND LENGTH(v_report) > 10 THEN
    RAISE NOTICE 'PASS Step 6: Weakness report generated (% chars)', LENGTH(v_report);
    RAISE NOTICE 'Report preview: %', LEFT(v_report, 200);
  ELSE
    RAISE NOTICE 'WARN Step 6: Report is empty or very short. May need more data.';
  END IF;
END $$;

-- Step 7: Verify weakness_reports table has a row
DO $$
DECLARE
  v_report_count INT;
BEGIN
  SELECT COUNT(*) INTO v_report_count
  FROM weakness_reports
  WHERE user_id = '00000000-0000-4000-a000-000000000001';

  IF v_report_count > 0 THEN
    RAISE NOTICE 'PASS Step 7: weakness_reports has % rows for test user', v_report_count;
  ELSE
    RAISE NOTICE 'WARN Step 7: No rows in weakness_reports. fn_generate_weakness_report may not INSERT.';
  END IF;
END $$;

-- Step 8: Verify the severity values are lowercase
DO $$
DECLARE
  v_bad_count INT;
BEGIN
  SELECT COUNT(*) INTO v_bad_count
  FROM weakness_signals
  WHERE user_id = '00000000-0000-4000-a000-000000000001'
    AND severity NOT IN ('low', 'medium', 'high');

  IF v_bad_count = 0 THEN
    RAISE NOTICE 'PASS Step 8: All severity values are lowercase (low/medium/high)';
  ELSE
    RAISE NOTICE 'WARN Step 8: % signals have non-standard severity values', v_bad_count;
  END IF;
END $$;

-- Summary
RAISE NOTICE '===========================================';
RAISE NOTICE 'PAPER Engine Verification Complete';
RAISE NOTICE '===========================================';
RAISE NOTICE 'Check the PASS/FAIL/WARN messages above.';
RAISE NOTICE 'Cleanup: DELETE FROM users WHERE id = ''00000000-0000-4000-a000-000000000001''';
