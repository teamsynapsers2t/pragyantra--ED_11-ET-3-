import os
import requests

# Mimicking the exact javascript getQuestionMapping logic

CHAPTER_MAPPING = {
  1: { "subject": "Physics", "chapter": "electromagnetic-waves", "topic": "displacement-current" },
  2: { "subject": "Physics", "chapter": "units-and-measurements", "topic": "dimensions" },
  3: { "subject": "Physics", "chapter": "kinematics", "topic": "fluid-flow" },
  5: { "subject": "Physics", "chapter": "rotational-motion", "topic": "moment-of-inertia" },
  6: { "subject": "Physics", "chapter": "work-power-and-energy", "topic": "collision" },
  8: { "subject": "Physics", "chapter": "rotational-motion", "topic": "rotational-dynamics" },
  9: { "subject": "Physics", "chapter": "gravitation", "topic": "escape-velocity" },
  15: { "subject": "Physics", "chapter": "simple-harmonic-motion", "topic": "oscillations" },
  16: { "subject": "Physics", "chapter": "wave-optics", "topic": "interference" },
  17: { "subject": "Physics", "chapter": "electrostatics", "topic": "electric-field" },
  19: { "subject": "Physics", "chapter": "current-electricity", "topic": "circuits" },
  21: { "subject": "Physics", "chapter": "magnetics", "topic": "magnetic-flux" },
  22: { "subject": "Physics", "chapter": "atoms-and-nuclei", "topic": "bohr-model" },
  23: { "subject": "Physics", "chapter": "atoms-and-nuclei", "topic": "radioactivity" },
  25: { "subject": "Physics", "chapter": "geometrical-optics", "topic": "optical-instruments" },
  29: { "subject": "Physics", "chapter": "heat-and-thermodynamics", "topic": "thermodynamics-laws" },
  
  33: { "subject": "Chemistry", "chapter": "hydrocarbons", "topic": "alkenes" },
  34: { "subject": "Chemistry", "chapter": "structure-of-atom", "topic": "quantum-numbers" },
  36: { "subject": "Chemistry", "chapter": "coordination-compounds", "topic": "crystal-field-theory" },
  38: { "subject": "Chemistry", "chapter": "thermodynamics", "topic": "enthalpy" },
  39: { "subject": "Chemistry", "chapter": "ionic-equilibrium", "topic": "ph-buffer" },
  45: { "subject": "Chemistry", "chapter": "basics-of-organic-chemistry", "topic": "nomenclature" },
  48: { "subject": "Chemistry", "chapter": "s-block-elements", "topic": "alkali-metals" },
  49: { "subject": "Chemistry", "chapter": "chemical-kinetics", "topic": "arrhenius-equation" },
  
  61: { "subject": "Mathematics", "chapter": "application-of-derivatives", "topic": "tangent-normal" },
  64: { "subject": "Mathematics", "chapter": "mathematical-reasoning", "topic": "logical-statements" },
  73: { "subject": "Mathematics", "chapter": "matrices-and-determinants", "topic": "matrices" },
  75: { "subject": "Mathematics", "chapter": "3d-geometry", "topic": "planes" },
  76: { "subject": "Mathematics", "chapter": "differential-equations", "topic": "variable-separation" },
  77: { "subject": "Mathematics", "chapter": "straight-lines", "topic": "equations" },
  79: { "subject": "Mathematics", "chapter": "definite-integration", "topic": "integration-properties" },
  84: { "subject": "Mathematics", "chapter": "differential-equations", "topic": "general-term" },
  89: { "subject": "Mathematics", "chapter": "3d-geometry", "topic": "lines-planes" }
}

def get_question_mapping(chapter_id):
    if chapter_id is None:
        return { "subject": "Physics", "chapter": "general", "topic": "general" }
    cid = int(chapter_id)
    if cid in CHAPTER_MAPPING:
        return CHAPTER_MAPPING[cid]
    
    # Fallback logic
    if cid <= 30:
        sub = "Physics"
    elif cid <= 50:
        sub = "Chemistry"
    else:
        sub = "Mathematics"
        
    return {
        "subject": sub,
        "chapter": f"chapter-{cid}",
        "topic": "general"
    }

def load_env():
    env = {}
    if os.path.exists(".env.local"):
        with open(".env.local", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        env[key] = val
    return env

env = load_env()
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}

# Fetch all questions (up to 2000 to be sure we get all)
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=chapter_id&limit=2000", headers=headers)
if res.status_code == 200:
    questions = res.json()
    subjects_count = {}
    chapter_ids = {}
    for q in questions:
        cid = q.get("chapter_id")
        chapter_ids[cid] = chapter_ids.get(cid, 0) + 1
        mapping = get_question_mapping(cid)
        sub = mapping["subject"]
        subjects_count[sub] = subjects_count.get(sub, 0) + 1
    
    print("Total fetched rows:", len(questions))
    print("Mapped subjects count:")
    for sub, cnt in subjects_count.items():
        print(f"  {sub}: {cnt}")
    print("\nChapter IDs present in DB:")
    for cid, cnt in sorted(chapter_ids.items()):
        print(f"  Chapter ID {cid}: {cnt} questions")
else:
    print("Failed to fetch:", res.text)
