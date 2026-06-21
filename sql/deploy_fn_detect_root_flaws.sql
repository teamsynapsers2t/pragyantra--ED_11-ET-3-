-- =============================================================================
-- STEP 1: DEPLOY fn_detect_root_flaws (corrected child-centric version)
-- Run this first in Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_detect_root_flaws(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child          RECORD;
  v_prereq         RECORD;
  v_parent_mastery  NUMERIC;
  v_parent_conf     NUMERIC;
  v_root_flaw_score NUMERIC;
  v_best_parent_id  INT;
  v_best_strength   INT;
  v_best_score      NUMERIC;
  v_best_mastery    NUMERIC;
  v_best_conf       NUMERIC;
  v_best_name       TEXT;
  v_child_name      TEXT;
  v_severity_score  INT;
  v_severity        TEXT;
  v_signal_conf     INT;
  v_evidence        JSONB;
BEGIN
  -- -------------------------------------------------------------------------
  -- Step 1: Delete all existing root_flaw signals for this user.
  --         Full re-evaluation on every call — clean slate each time.
  -- -------------------------------------------------------------------------
  DELETE FROM weakness_signals
  WHERE user_id = p_user_id AND signal = 'root_flaw';

  -- -------------------------------------------------------------------------
  -- Step 2: Loop over CHILD concepts that are weak.
  --         Thresholds (0-1 scale aware):
  --           mastery_score < 0.5   (equivalent to < 50%)
  --           confidence_score >= 30
  -- -------------------------------------------------------------------------
  FOR v_child IN
    SELECT cm.concept_id, cm.mastery_score, cm.confidence_score,
           COALESCE(c.concept_name, 'Concept #' || cm.concept_id::TEXT) AS concept_name
    FROM concept_mastery cm
    LEFT JOIN concepts c ON c.id = cm.concept_id
    WHERE cm.user_id = p_user_id
      AND cm.mastery_score < 0.5
      AND cm.confidence_score >= 30
  LOOP
    v_best_parent_id := NULL;
    v_best_score     := -1;

    -- -----------------------------------------------------------------------
    -- Step 3: For each weak child, look up all prerequisites (PARENT concepts).
    --         concept_prerequisites.concept_id         = child  (e.g. 26 = Momentum)
    --         concept_prerequisites.requires_concept_id = parent (e.g. 17 = Newton's Laws)
    -- -----------------------------------------------------------------------
    FOR v_prereq IN
      SELECT cp.requires_concept_id AS parent_id,
             cp.relationship_strength
      FROM concept_prerequisites cp
      WHERE cp.concept_id = v_child.concept_id
    LOOP
      -- Fetch parent mastery (default 0 if no record exists)
      SELECT COALESCE(mastery_score, 0), COALESCE(confidence_score, 0)
      INTO   v_parent_mastery, v_parent_conf
      FROM   concept_mastery
      WHERE  user_id = p_user_id
        AND  concept_id = v_prereq.parent_id
      LIMIT 1;

      IF v_parent_mastery IS NULL THEN
        v_parent_mastery := 0;
        v_parent_conf    := 0;
      END IF;

      -- RootFlawScore = (1 - parent_mastery) * relationship_strength * 100
      -- Normalised to 0-1 mastery scale, then multiplied to keep score range comparable
      v_root_flaw_score := (1.0 - v_parent_mastery) * v_prereq.relationship_strength * 100;

      -- Track the best (highest scoring) prerequisite
      IF v_root_flaw_score > v_best_score THEN
        v_best_score     := v_root_flaw_score;
        v_best_parent_id := v_prereq.parent_id;
        v_best_strength  := v_prereq.relationship_strength;
        v_best_mastery   := v_parent_mastery;
        v_best_conf      := v_parent_conf;
      END IF;
    END LOOP;

    -- -----------------------------------------------------------------------
    -- Step 4: Check trigger conditions for the best prerequisite.
    --   - child mastery < 0.5          (already filtered above)
    --   - parent mastery < 0.6         (parent is also weak)
    --   - root_flaw_score >= 400       (strong enough signal)
    --   - parent confidence >= 30      (enough data on parent)
    -- -----------------------------------------------------------------------
    IF v_best_parent_id IS NOT NULL
       AND v_best_mastery < 0.6
       AND v_best_score >= 400
       AND v_best_conf >= 30
    THEN
      -- Severity score capped at 100
      v_severity_score := LEAST(100, ROUND(v_best_score / 8.0)::INT);

      -- Severity level
      IF v_severity_score >= 81 THEN
        v_severity := 'high';
      ELSIF v_severity_score >= 31 THEN
        v_severity := 'medium';
      ELSE
        v_severity := 'low';
      END IF;

      -- Signal confidence = min(parent_confidence, child_confidence)
      v_signal_conf := LEAST(v_best_conf::INT, v_child.confidence_score::INT);

      -- Fetch parent concept name
      SELECT COALESCE(concept_name, 'Concept #' || v_best_parent_id::TEXT)
      INTO   v_best_name
      FROM   concepts
      WHERE  id = v_best_parent_id
      LIMIT 1;

      IF v_best_name IS NULL THEN
        v_best_name := 'Concept #' || v_best_parent_id::TEXT;
      END IF;

      -- Build evidence JSON (child-centric: root cause is the PARENT)
      v_evidence := jsonb_build_object(
        'root_concept_id',       v_best_parent_id,
        'root_concept_name',     v_best_name,
        'root_mastery',          v_best_mastery,
        'relationship_strength', v_best_strength,
        'root_flaw_score',       v_best_score,
        'weak_concept_id',       v_child.concept_id,
        'weak_concept_name',     v_child.concept_name,
        'weak_mastery',          v_child.mastery_score
      );

      -- -------------------------------------------------------------------
      -- Step 5: Insert root_flaw signal under the CHILD concept ID.
      --   concept_id = v_child.concept_id  (e.g. 26 = Momentum)
      --   evidence.root_concept_id         (e.g. 17 = Newton's Laws)
      -- -------------------------------------------------------------------
      INSERT INTO weakness_signals (
        user_id,
        concept_id,
        signal,
        severity,
        severity_score,
        confidence_score,
        evidence,
        created_at
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
