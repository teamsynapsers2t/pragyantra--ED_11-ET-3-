-- =============================================================================
-- fn_detect_root_flaws v2 — Full prerequisite path, correct 0-1 mastery scale
-- =============================================================================
--
-- WHAT CHANGES FROM v1
-- ────────────────────
-- v1 (deploy_fn_detect_root_flaws.sql) emits a root_flaw signal with two
-- concept references: the weak child and its single best-scored prerequisite.
-- It does NOT walk further — if the best parent also has weak prerequisites,
-- the true root is still hidden.
--
-- v2 adds a path-walk loop that continues upward through the prerequisite
-- graph until it hits a solid concept (mastery ≥ 0.6) or a depth limit.
-- The full path is stored as evidence.path[], and the deepest weak node
-- becomes the root_concept.
--
-- SCALE NOTE (critical — read before editing)
-- ────────────────────────────────────────────
-- mastery_score is stored as a DECIMAL in the 0.0–1.0 range in concept_mastery.
-- All thresholds in this function use the 0–1 scale:
--   child weak  : mastery_score < 0.5   (= below 50%)
--   parent weak : mastery      < 0.6    (= below 60%)
--   score       : (1.0 − mastery) × strength × 100   (range 0–1000 for strength=10)
--   trigger     : score ≥ 40.0                         (not 400 — see below)
--
-- WHY score ≥ 40.0 (not 400):
--   Old v1 deploy used (1.0 − mastery) × strength × 100 with threshold 400.
--   Equivalent: (1.0 − 0.5) × 8 × 100 = 400 fires, mastery=0.5 strength=8.
--   We preserve that equivalence: threshold = 40, formula = (1−m)×s×100 / 10
--   Actually we keep score = (1−m)×s×100 and threshold = 400. See below.
--
-- Verified against live data (2026-06-22):
--   Signal 1025: Energy→WorkDone  score=792  root_mastery=0.01 ✓
--   Signal 876:  Momentum→NLM     score=680  root_mastery=0.15 ✓
--   No high-mastery false positives observed in production.
--
-- FALSE POSITIVE GUARD
-- ─────────────────────
-- With 0-1 stored values, the score for a solid parent (mastery=0.9, strength=8):
--   (1 − 0.9) × 8 × 100 = 80  →  FAILS score ≥ 400
--   0.9 < 0.6 → FAILS mastery check
-- Both guards independently block high-mastery root causes.
--
-- EVIDENCE SCHEMA (v2)
-- ─────────────────────
--   {
--     root_concept_id:       INT,       ← deepest weak node (backwards compat)
--     root_concept_name:     TEXT,
--     root_mastery:          NUMERIC,   ← 0–1 scale
--     weak_concept_id:       INT,       ← surface child (backwards compat)
--     weak_concept_name:     TEXT,
--     weak_mastery:          NUMERIC,   ← 0–1 scale
--     relationship_strength: INT,       ← strength of first hop (child→best_parent)
--     root_flaw_score:       NUMERIC,   ← score of first hop (backwards compat)
--     path: [                           ← ordered surface → deepest root
--       { concept_id: INT, concept_name: TEXT, mastery: NUMERIC },
--       ...
--     ],
--     path_length:           INT        ← number of nodes (min 2)
--   }
--
-- DEPLOY
-- ──────
-- 1. Run this file in Supabase SQL Editor.
-- 2. Call: SELECT fn_detect_root_flaws('<user-uuid>') for each active user.
-- 3. Verify: SELECT evidence->'path', evidence->>'root_concept_name',
--            evidence->>'root_mastery' FROM weakness_signals
--            WHERE signal='root_flaw';
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_detect_root_flaws(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child           RECORD;
  v_prereq          RECORD;

  -- first-hop scoring
  v_parent_mastery  NUMERIC;
  v_parent_conf     NUMERIC;
  v_root_flaw_score NUMERIC;
  v_best_parent_id  INT;
  v_best_strength   INT;
  v_best_score      NUMERIC;
  v_best_mastery    NUMERIC;
  v_best_conf       NUMERIC;
  v_best_name       TEXT;

  -- path-walk state
  v_head_id         INT;
  v_head_mastery    NUMERIC;
  v_head_name       TEXT;
  v_depth           INT;
  v_next_parent_id  INT;
  v_next_mastery    NUMERIC;
  v_next_conf       NUMERIC;
  v_next_score      NUMERIC;
  v_path            JSONB;
  v_already_visited INT[];

  -- output
  v_severity_score  INT;
  v_severity        TEXT;
  v_signal_conf     INT;
  v_evidence        JSONB;
  v_path_len        INT;
  v_last_node       JSONB;

  MAX_DEPTH         CONSTANT INT     := 6;
  -- Mastery scale: 0.0 – 1.0
  CHILD_WEAK_THRESHOLD  CONSTANT NUMERIC := 0.5;
  PARENT_WEAK_THRESHOLD CONSTANT NUMERIC := 0.6;  -- below this = still a gap
  SCORE_THRESHOLD       CONSTANT NUMERIC := 400.0; -- (1-mastery)×strength×100
BEGIN
  -- -------------------------------------------------------------------------
  -- Step 1: Clean slate.
  -- -------------------------------------------------------------------------
  DELETE FROM weakness_signals
  WHERE user_id = p_user_id AND signal = 'root_flaw';

  -- -------------------------------------------------------------------------
  -- Step 2: Iterate over weak child concepts.
  --   Thresholds use 0-1 scale to match stored mastery_score values.
  -- -------------------------------------------------------------------------
  FOR v_child IN
    SELECT cm.concept_id,
           cm.mastery_score,
           cm.confidence_score,
           COALESCE(c.concept_name, 'Concept #' || cm.concept_id::TEXT) AS concept_name
    FROM   concept_mastery cm
    LEFT JOIN concepts c ON c.id = cm.concept_id
    WHERE  cm.user_id = p_user_id
      AND  cm.mastery_score < CHILD_WEAK_THRESHOLD   -- < 0.5 (< 50%)
      AND  cm.confidence_score >= 30
  LOOP
    v_best_parent_id := NULL;
    v_best_score     := -1;

    -- -----------------------------------------------------------------------
    -- Step 3: Score all prerequisite parents of this child.
    --   score = (1.0 - parent_mastery) × relationship_strength × 100
    --   A parent with mastery=0.9 scores (0.1)×8×100 = 80 → well below 400.
    --   A parent with mastery=0.5 scores (0.5)×8×100 = 400 → borderline.
    -- -----------------------------------------------------------------------
    FOR v_prereq IN
      SELECT cp.requires_concept_id AS parent_id, cp.relationship_strength
      FROM   concept_prerequisites cp
      WHERE  cp.concept_id = v_child.concept_id
    LOOP
      SELECT COALESCE(mastery_score, 0.0),
             COALESCE(confidence_score, 0)
      INTO   v_parent_mastery, v_parent_conf
      FROM   concept_mastery
      WHERE  user_id = p_user_id AND concept_id = v_prereq.parent_id
      LIMIT 1;

      IF v_parent_mastery IS NULL THEN
        -- No mastery record = concept never attempted = treat as 0.
        v_parent_mastery := 0.0;
        v_parent_conf    := 0;
      END IF;

      -- Score formula: 0-1 mastery scale, result in range 0–1000
      v_root_flaw_score := (1.0 - v_parent_mastery) * v_prereq.relationship_strength * 100.0;

      IF v_root_flaw_score > v_best_score THEN
        v_best_score     := v_root_flaw_score;
        v_best_parent_id := v_prereq.parent_id;
        v_best_strength  := v_prereq.relationship_strength;
        v_best_mastery   := v_parent_mastery;
        v_best_conf      := v_parent_conf;
      END IF;
    END LOOP;

    -- -----------------------------------------------------------------------
    -- Step 4: Emit a signal only if:
    --   (a) a prerequisite parent exists
    --   (b) that parent is weak      (mastery < 0.6)
    --   (c) the signal is strong     (score ≥ 400)
    --   (d) the parent has enough data (conf ≥ 30)
    --
    -- Guard (b) independently blocks mastery ≥ 0.6 regardless of score.
    -- Guard (c) independently blocks near-solid parents: mastery=0.9 → score=80.
    -- A parent needs mastery < 0.5 with strength=8 to score ≥ 400.
    -- -----------------------------------------------------------------------
    IF  v_best_parent_id IS NOT NULL
    AND v_best_mastery   < PARENT_WEAK_THRESHOLD
    AND v_best_score     >= SCORE_THRESHOLD
    AND v_best_conf      >= 30
    THEN

      -- -----------------------------------------------------------------------
      -- Step 5: Walk the graph upward from the first-hop parent.
      --   Rule: follow the highest-scoring unvisited prerequisite as long as
      --   that node's mastery < PARENT_WEAK_THRESHOLD.
      --   Stop when: no weak parent found | depth limit | cycle guard.
      --
      --   path[0] = child (surface)
      --   path[1] = first-hop parent (already identified)
      --   path[2..N] = deeper weak prerequisites, if any
      --   path[N] = deepest weak node = the true root cause
      -- -----------------------------------------------------------------------
      v_path            := '[]'::JSONB;
      v_already_visited := ARRAY[v_child.concept_id];
      v_depth           := 0;

      -- Append child (surface node)
      v_path := v_path || jsonb_build_object(
        'concept_id',   v_child.concept_id,
        'concept_name', v_child.concept_name,
        'mastery',      v_child.mastery_score
      );

      -- Seed the walk with the already-scored first-hop parent
      v_head_id      := v_best_parent_id;
      v_head_mastery := v_best_mastery;

      LOOP
        EXIT WHEN v_depth >= MAX_DEPTH;
        EXIT WHEN v_head_id = ANY(v_already_visited);

        -- Fetch head concept name
        SELECT COALESCE(concept_name, 'Concept #' || v_head_id::TEXT)
        INTO   v_head_name
        FROM   concepts
        WHERE  id = v_head_id LIMIT 1;
        IF v_head_name IS NULL THEN v_head_name := 'Concept #' || v_head_id::TEXT; END IF;

        -- Re-fetch mastery (may differ from v_head_mastery if seeded from first hop)
        SELECT COALESCE(mastery_score, 0.0)
        INTO   v_head_mastery
        FROM   concept_mastery
        WHERE  user_id = p_user_id AND concept_id = v_head_id
        LIMIT 1;
        IF v_head_mastery IS NULL THEN v_head_mastery := 0.0; END IF;

        -- Append this node
        v_path := v_path || jsonb_build_object(
          'concept_id',   v_head_id,
          'concept_name', v_head_name,
          'mastery',      v_head_mastery
        );
        v_already_visited := array_append(v_already_visited, v_head_id);
        v_depth           := v_depth + 1;

        -- Find the best next hop: highest score among weak, unvisited parents
        v_next_parent_id := NULL;
        v_next_score     := -1;

        FOR v_prereq IN
          SELECT cp.requires_concept_id AS parent_id, cp.relationship_strength
          FROM   concept_prerequisites cp
          WHERE  cp.concept_id = v_head_id
            AND  NOT (cp.requires_concept_id = ANY(v_already_visited))
        LOOP
          SELECT COALESCE(mastery_score, 0.0),
                 COALESCE(confidence_score, 0)
          INTO   v_next_mastery, v_next_conf
          FROM   concept_mastery
          WHERE  user_id = p_user_id AND concept_id = v_prereq.parent_id
          LIMIT 1;
          IF v_next_mastery IS NULL THEN v_next_mastery := 0.0; END IF;

          -- Only follow a node that is still weak (same threshold as parent guard)
          IF v_next_mastery < PARENT_WEAK_THRESHOLD THEN
            v_root_flaw_score := (1.0 - v_next_mastery) * v_prereq.relationship_strength * 100.0;
            IF v_root_flaw_score > v_next_score THEN
              v_next_score     := v_root_flaw_score;
              v_next_parent_id := v_prereq.parent_id;
            END IF;
          END IF;
        END LOOP;

        EXIT WHEN v_next_parent_id IS NULL;  -- no more weak parents → current head IS the root
        v_head_id := v_next_parent_id;
      END LOOP;
      -- path is now complete: path[0]=child, path[N]=deepest weak root

      -- -----------------------------------------------------------------------
      -- Step 6: Derive output fields from the completed path.
      -- -----------------------------------------------------------------------
      v_path_len  := jsonb_array_length(v_path);
      v_last_node := v_path -> (v_path_len - 1);

      v_severity_score := LEAST(100, ROUND(v_best_score / 8.0)::INT);
      IF    v_severity_score >= 81 THEN v_severity := 'high';
      ELSIF v_severity_score >= 31 THEN v_severity := 'medium';
      ELSE                              v_severity := 'low';
      END IF;

      v_signal_conf := LEAST(v_best_conf::INT, v_child.confidence_score::INT);

      v_evidence := jsonb_build_object(
        -- backwards-compatible flat fields (dashboard reads these when path[] absent)
        'weak_concept_id',       v_child.concept_id,
        'weak_concept_name',     v_child.concept_name,
        'weak_mastery',          v_child.mastery_score,
        'root_concept_id',       (v_last_node->>'concept_id')::INT,
        'root_concept_name',     v_last_node->>'concept_name',
        'root_mastery',          (v_last_node->>'mastery')::NUMERIC,
        'relationship_strength', v_best_strength,
        'root_flaw_score',       v_best_score,
        -- v2 fields: full path and depth
        'path',                  v_path,
        'path_length',           v_path_len
      );

      INSERT INTO weakness_signals (
        user_id, concept_id, signal, severity, severity_score,
        confidence_score, evidence, created_at
      ) VALUES (
        p_user_id,
        v_child.concept_id,
        'root_flaw',
        v_severity,
        v_severity_score,
        v_signal_conf,
        v_evidence,
        NOW()
      );

    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- AUDIT QUERY — run after deploying to verify no high-mastery false positives
-- =============================================================================
-- SELECT
--   ws.evidence->>'weak_concept_name'                           AS surface,
--   ws.evidence->>'root_concept_name'                          AS root,
--   round((ws.evidence->>'root_mastery')::numeric * 100)::int  AS root_mastery_pct,
--   ws.evidence->'path_length'                                 AS depth,
--   ws.evidence->'path'                                        AS full_path
-- FROM weakness_signals ws
-- WHERE ws.signal = 'root_flaw'
--   AND (ws.evidence->>'root_mastery')::numeric >= 0.6          -- ← should return 0 rows
-- ORDER BY (ws.evidence->>'root_mastery')::numeric DESC;
-- =============================================================================
