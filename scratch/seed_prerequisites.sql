-- ==================================================
-- SEED CONCEPT PREREQUISITES FOR ROOT FLAW ENGINE
-- ==================================================
-- Copy and paste this script into your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/pdnpfpjtbpmuvzopvren/sql)
-- to populate the prerequisite relationships between JEE concepts.

-- Clear existing prerequisites first to avoid duplicates
TRUNCATE TABLE public.concept_prerequisites;

-- Insert prerequisite relationships
-- Fields: concept_id, requires_concept_id, relationship_strength
INSERT INTO public.concept_prerequisites (concept_id, requires_concept_id, relationship_strength)
VALUES 
  -- 1. Projectile Motion (ID 15) requires:
  --    - Addition and Subtraction of Vectors (ID 2), Strength = 8 (Strong)
  --    - Uniform Motion (ID 9), Strength = 6 (Moderate)
  (15, 2, 8),
  (15, 9, 6),

  -- 2. Electric Potential and Potential Energy (ID 90) requires:
  --    - Electric Field and Electric Field Lines (ID 89), Strength = 10 (Critical)
  (90, 89, 10),

  -- 3. Rotational Mechanics (ID 35) requires:
  --    - Uniform Circular Motion (ID 16), Strength = 8 (Strong)
  --    - Torque (ID 34), Strength = 10 (Critical)
  (35, 16, 8),
  (35, 34, 10),

  -- 4. Simple Harmonic Motion (ID 72) requires:
  --    - Rest & Motion (ID 8), Strength = 6 (Moderate)
  --    - Spring Force (ID 19), Strength = 8 (Strong)
  (72, 8, 6),
  (72, 19, 8),

  -- 5. Error of Measurement (ID 7) requires:
  --    - Dimensions (ID 6), Strength = 8 (Strong)
  (7, 6, 8);

SELECT * FROM public.concept_prerequisites;
