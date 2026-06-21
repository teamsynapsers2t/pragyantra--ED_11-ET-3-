-- =============================================================================
-- PAPER Engine: Question Stats Refresh (pg_cron)
-- =============================================================================
-- Run this in the Supabase SQL Editor as a superuser.
-- Step 1: Enable the pg_cron extension (only needed once).
-- Step 2: Schedule the nightly refresh job.
-- Step 3: (Optional) Run the refresh immediately for initial seeding.
-- =============================================================================

-- Step 1: Enable pg_cron extension (requires superuser on Supabase)
-- If this fails, enable it via the Supabase Dashboard > Extensions page.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Schedule nightly refresh at 02:00 UTC
-- This updates question_stats with aggregate performance data from attempts.
SELECT cron.schedule(
  'nightly-question-stats-refresh',   -- job name
  '0 2 * * *',                        -- cron expression: 2:00 AM UTC daily
  $$
    INSERT INTO question_stats (
      question_id,
      n_attempts,
      n_correct,
      accuracy,
      median_time_ms,
      p90_time_ms,
      updated_at
    )
    SELECT
      a.question_id,
      COUNT(*)                                                    AS n_attempts,
      COUNT(*) FILTER (WHERE a.is_correct = true)                 AS n_correct,
      ROUND(
        (100.0 * COUNT(*) FILTER (WHERE a.is_correct = true))
        / NULLIF(COUNT(*), 0)
      )                                                           AS accuracy,
      ROUND(COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY a.time_taken_ms), 0))::integer AS median_time_ms,
      ROUND(COALESCE(percentile_cont(0.9) WITHIN GROUP (ORDER BY a.time_taken_ms), 0))::integer AS p90_time_ms,
      NOW()                                                       AS updated_at
    FROM attempts a
    GROUP BY a.question_id
    ON CONFLICT (question_id) DO UPDATE SET
      n_attempts     = EXCLUDED.n_attempts,
      n_correct      = EXCLUDED.n_correct,
      accuracy       = EXCLUDED.accuracy,
      median_time_ms = EXCLUDED.median_time_ms,
      p90_time_ms    = EXCLUDED.p90_time_ms,
      updated_at     = EXCLUDED.updated_at;
  $$
);

-- Step 3: (Optional) Run the refresh once immediately for initial seeding
-- Uncomment and run this to populate question_stats right now:
/*
INSERT INTO question_stats (
  question_id,
  n_attempts,
  n_correct,
  accuracy,
  median_time_ms,
  p90_time_ms,
  updated_at
)
SELECT
  a.question_id,
  COUNT(*)                                                    AS n_attempts,
  COUNT(*) FILTER (WHERE a.is_correct = true)                 AS n_correct,
  ROUND(
    (100.0 * COUNT(*) FILTER (WHERE a.is_correct = true))
    / NULLIF(COUNT(*), 0)
  )                                                           AS accuracy,
  ROUND(COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY a.time_taken_ms), 0))::integer AS median_time_ms,
  ROUND(COALESCE(percentile_cont(0.9) WITHIN GROUP (ORDER BY a.time_taken_ms), 0))::integer AS p90_time_ms,
  NOW()                                                       AS updated_at
FROM attempts a
GROUP BY a.question_id
ON CONFLICT (question_id) DO UPDATE SET
  n_attempts     = EXCLUDED.n_attempts,
  n_correct      = EXCLUDED.n_correct,
  accuracy       = EXCLUDED.accuracy,
  median_time_ms = EXCLUDED.median_time_ms,
  p90_time_ms    = EXCLUDED.p90_time_ms,
  updated_at     = EXCLUDED.updated_at;
*/

-- Verify the job is scheduled:
-- SELECT * FROM cron.job;
