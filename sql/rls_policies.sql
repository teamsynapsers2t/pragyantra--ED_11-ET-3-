-- =============================================================================
-- PAPER Engine: Row Level Security (RLS) Policies
-- =============================================================================
-- Run this in the Supabase SQL Editor as a superuser.
-- This enables RLS on user-scoped tables and creates policies for:
--   1. Students can only read/write their own data
--   2. Engine functions run as SECURITY DEFINER to bypass RLS for triggers
--   3. Reference tables are read-only for authenticated users
-- =============================================================================

-- ===========================
-- 1. Enable RLS on user tables
-- ===========================

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE weakness_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weakness_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on interaction_events if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interaction_events') THEN
    EXECUTE 'ALTER TABLE interaction_events ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ===========================
-- 2. Student self-access policies (user_id based)
-- ===========================

-- The app uses a deterministic Clerk-to-UUID mapping (clerkIdToUuid).
-- The service-role client bypasses RLS. For anon-key access,
-- these policies ensure students can only see their own data.

-- Attempts: students can INSERT their own and SELECT their own
CREATE POLICY "students_insert_own_attempts" ON attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_select_own_attempts" ON attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Concept mastery: read-only for students (trigger writes this)
CREATE POLICY "students_select_own_mastery" ON concept_mastery
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Weakness signals: read-only for students
CREATE POLICY "students_select_own_signals" ON weakness_signals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Weakness reports: read-only for students
CREATE POLICY "students_select_own_reports" ON weakness_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Sessions: students can insert and select their own
CREATE POLICY "students_insert_own_sessions" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_select_own_sessions" ON sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "students_update_own_sessions" ON sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===========================
-- 3. Engine functions as SECURITY DEFINER
-- ===========================
-- These functions are called by triggers and need to write to
-- concept_mastery and weakness_signals regardless of RLS.

ALTER FUNCTION fn_apply_attempt(bigint) SECURITY DEFINER;
ALTER FUNCTION fn_detect_root_flaws(uuid) SECURITY DEFINER;
ALTER FUNCTION fn_generate_weakness_report(uuid) SECURITY DEFINER;

-- ===========================
-- 4. Reference tables: read-only for authenticated users
-- ===========================

-- These tables contain shared question/concept data that all students need to read.

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_questions" ON questions
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_options" ON question_options
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_concepts" ON concepts
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_chapters" ON chapters
  FOR SELECT TO authenticated
  USING (true);

-- concept_prerequisites: read-only
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'concept_prerequisites') THEN
    EXECUTE 'ALTER TABLE concept_prerequisites ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "authenticated_read_prerequisites" ON concept_prerequisites FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- question_concepts: read-only
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_concepts') THEN
    EXECUTE 'ALTER TABLE question_concepts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "authenticated_read_question_concepts" ON question_concepts FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- question_stats: read-only
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_stats') THEN
    EXECUTE 'ALTER TABLE question_stats ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "authenticated_read_question_stats" ON question_stats FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- users: students can read their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_read_own_user" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Allow service role to insert users (for the upsert in attempt/session endpoints)
-- Note: Service role client bypasses RLS automatically.

-- ===========================
-- 5. Verification
-- ===========================
-- Run these to verify RLS is enabled:

-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Verify trigger still works under RLS:
-- The attempts_after_insert trigger calls fn_apply_attempt which is SECURITY DEFINER,
-- so it will execute with the function owner's privileges (bypassing RLS).
