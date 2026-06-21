import os
import json
import requests
import re
import sys

# Reconfigure stdout to use utf-8 to avoid CP1252 errors on Windows
sys.stdout.reconfigure(encoding='utf-8')

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
    "Content-Type": "application/json",
}

# The 90 chapters list in order
CHAPTERS_LIST = [
  # Physics (1-32)
  (1, "Physics", "Math in Physics"),
  (2, "Physics", "Units & Dimensions"),
  (3, "Physics", "Motion in 1D"),
  (4, "Physics", "Motion in 2D"),
  (5, "Physics", "Laws of Motion"),
  (6, "Physics", "Work Power Energy"),
  (7, "Physics", "COM & Collisions"),
  (8, "Physics", "Rotational Motion"),
  (9, "Physics", "Gravitation"),
  (10, "Physics", "Properties of Solids"),
  (11, "Physics", "Properties of Fluids"),
  (12, "Physics", "Thermal Properties"),
  (13, "Physics", "Thermodynamics"),
  (14, "Physics", "KTG"),
  (15, "Physics", "Oscillations"),
  (16, "Physics", "Waves & Sound"),
  (17, "Physics", "Electrostatics"),
  (18, "Physics", "Capacitance"),
  (19, "Physics", "Current Electricity"),
  (20, "Physics", "Magnetic Properties"),
  (21, "Physics", "Magnetism & Current"),
  (22, "Physics", "EMI"),
  (23, "Physics", "AC Circuits"),
  (24, "Physics", "EM Waves"),
  (25, "Physics", "Ray Optics"),
  (26, "Physics", "Wave Optics"),
  (27, "Physics", "Dual Nature"),
  (28, "Physics", "Atomic Physics"),
  (29, "Physics", "Nuclear Physics"),
  (30, "Physics", "Semiconductors"),
  (31, "Physics", "Communication Systems"),
  (32, "Physics", "Experimental Physics"),

  # Chemistry (33-59)
  (33, "Chemistry", "Mole Concept"),
  (34, "Chemistry", "Atomic Structure"),
  (35, "Chemistry", "Periodic Table"),
  (36, "Chemistry", "Chemical Bonding"),
  (37, "Chemistry", "States of Matter"),
  (38, "Chemistry", "Thermodynamics"),
  (39, "Chemistry", "Chemical Equilibrium"),
  (40, "Chemistry", "Ionic Equilibrium"),
  (41, "Chemistry", "Redox Reaction"),
  (42, "Chemistry", "Hydrogen"),
  (43, "Chemistry", "S Block"),
  (44, "Chemistry", "P Block (13-14)"),
  (45, "Chemistry", "General Organic Chemistry (GOC)"),
  (46, "Chemistry", "Hydrocarbons"),
  (47, "Chemistry", "Solutions"),
  (48, "Chemistry", "Electrochemistry"),
  (49, "Chemistry", "Chemical Kinetics"),
  (50, "Chemistry", "P Block (15-18)"),
  (51, "Chemistry", "d & f Block"),
  (52, "Chemistry", "Coordination Compounds"),
  (53, "Chemistry", "Haloalkanes & Haloarenes"),
  (54, "Chemistry", "Alcohols, Phenols & Ethers"),
  (55, "Chemistry", "Aldehydes & Ketones"),
  (56, "Chemistry", "Carboxylic Acids"),
  (57, "Chemistry", "Amines"),
  (58, "Chemistry", "Biomolecules"),
  (59, "Chemistry", "Practical Chemistry"),

  # Maths (60-90)
  (60, "Mathematics", "Basic Mathematics"),
  (61, "Mathematics", "Quadratic Equations"),
  (62, "Mathematics", "Complex Numbers"),
  (63, "Mathematics", "Permutation & Combination"),
  (64, "Mathematics", "Sequence & Series"),
  (65, "Mathematics", "Binomial Theorem"),
  (66, "Mathematics", "Trigonometry"),
  (67, "Mathematics", "Trigonometric Equations"),
  (68, "Mathematics", "Straight Lines"),
  (69, "Mathematics", "Circle"),
  (70, "Mathematics", "Parabola"),
  (71, "Mathematics", "Ellipse"),
  (72, "Mathematics", "Hyperbola"),
  (73, "Mathematics", "Limits"),
  (74, "Mathematics", "Statistics"),
  (75, "Mathematics", "Sets & Relations"),
  (76, "Mathematics", "Matrices"),
  (77, "Mathematics", "Determinants"),
  (78, "Mathematics", "Inverse Trigonometric Functions"),
  (79, "Mathematics", "Functions"),
  (80, "Mathematics", "Continuity & Differentiability"),
  (81, "Mathematics", "Differentiation"),
  (82, "Mathematics", "Application of Derivatives"),
  (83, "Mathematics", "Indefinite Integration"),
  (84, "Mathematics", "Definite Integration"),
  (85, "Mathematics", "Area Under Curves"),
  (86, "Mathematics", "Differential Equations"),
  (87, "Mathematics", "Vector Algebra"),
  (88, "Mathematics", "3D Geometry"),
  (89, "Mathematics", "Linear Programming"),
  (90, "Mathematics", "Probability")
]

# 1. Seed public.chapters (Skipped because chapters table is unused and RLS prevents insertion)
print("Skipping chapters table seeding...")
# chapters_payload = []
# for cid, sub, cname in CHAPTERS_LIST:
#     chapters_payload.append({
#         "id": cid,
#         "chapter_name": cname,
#         "subject": sub
#     })
# requests.delete(f"{SUPABASE_URL}/rest/v1/chapters?id=not.is.null", headers=headers)
# res_chapters = requests.post(f"{SUPABASE_URL}/rest/v1/chapters", headers=headers, json=chapters_payload)
# print("Chapters table seeding status:", res_chapters.status_code)
# if res_chapters.status_code not in [200, 201]:
#     print("Error seeding chapters:", res_chapters.text)
#     exit(1)
# print("Successfully seeded 90 chapters in chapters table.")


# 2. Get all questions from the database
print("Fetching questions from database...")
all_questions = []
for offset in [0, 1000]:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=1000&offset={offset}", headers=headers)
    if res.status_code == 200:
        all_questions.extend(res.json())
print(f"Fetched {len(all_questions)} questions from Supabase.")

# 3. Load local jee_questions.json
print("Loading local JSON questions...")
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)
print(f"Loaded {len(local_questions)} questions from local file.")

# Index local questions for fast prefix matching
local_lookup = {}
for lq in local_questions:
    q_text = lq.get("question", "")
    clean = "".join(q_text.split()).lower()
    prefix = clean[:50]
    if prefix:
        if prefix not in local_lookup:
            local_lookup[prefix] = []
        local_lookup[prefix].append(lq)

# Mapping logic: maps JSON slugs and topics to user's 90 chapter IDs
def get_mapped_chapter_id(subject, chapter_slug, topic_text):
    sub = subject.lower()
    chap = chapter_slug.lower() if chapter_slug else ""
    topic = topic_text.lower() if topic_text else ""
    
    if "physics" in sub:
        if "vector-algebra" in chap: return 1
        if "units-and-measurements" in chap: return 2
        if "motion-in-a-straight-line" in chap: return 3
        if "motion-in-a-plane" in chap or "circular-motion" in chap: return 4
        if "laws-of-motion" in chap: return 5
        if "work-power-and-energy" in chap: return 6
        if "center-of-mass" in chap: return 7
        if "rotational-motion" in chap: return 8
        if "gravitation" in chap: return 9
        if "properties-of-matter" in chap:
            if any(t in topic for t in ["fluid", "viscos", "bernoulli", "surface-tension", "capillar"]):
                return 11
            return 10
        if "heat-and-thermodynamics" in chap:
            if "thermodynam" in topic: return 13
            if any(t in topic for t in ["kinetic", "gas-laws", "ktg", "mean-free-path"]): return 14
            return 12
        if "simple-harmonic-motion" in chap: return 15
        if "waves" in chap: return 16
        if "electrostatics" in chap: return 17
        if "capacitor" in chap: return 18
        if "current-electricity" in chap: return 19
        if "magnetic-properties-of-matter" in chap: return 20
        if "magnetism" in chap or "magnetics" in chap: return 21
        if "electromagnetic-induction" in chap: return 22
        if "alternating-current" in chap: return 23
        if "electromagnetic-waves" in chap: return 24
        if "geometrical-optics" in chap: return 25
        if "wave-optics" in chap: return 26
        if "dual-nature-of-radiation" in chap: return 27
        if "atoms-and-nuclei" in chap:
            if any(t in topic for t in ["nucleus", "radioactiv", "mass-defect", "fission", "fusion"]):
                return 29
            return 28
        if "electronic-devices" in chap: return 30
        if "communication-systems" in chap: return 31
        if any(t in topic for t in ["experimental", "measurement", "screw-gauge", "vernier"]): return 32
        return 3

    elif "chemistry" in sub:
        if "some-basic-concepts-of-chemistry" in chap: return 33
        if "structure-of-atom" in chap: return 34
        if "periodic-table-and-periodicity" in chap: return 35
        if "chemical-bonding-and-molecular-structure" in chap: return 36
        if "gaseous-state" in chap or "solid-state" in chap: return 37
        if "thermodynamics" in chap: return 38
        if "chemical-equilibrium" in chap: return 39
        if "ionic-equilibrium" in chap: return 40
        if "redox-reactions" in chap: return 41
        if "hydrogen" in chap: return 42
        if "s-block-elements" in chap: return 43
        if "p-block-elements" in chap:
            if any(t in topic for t in ["boron", "carbon", "group-13", "group-14"]): return 44
            return 50
        if "basics-of-organic-chemistry" in chap: return 45
        if "hydrocarbons" in chap: return 46
        if "solutions" in chap: return 47
        if "electrochemistry" in chap: return 48
        if "chemical-kinetics-and-nuclear-chemistry" in chap: return 49
        if "d-and-f-block-elements" in chap: return 51
        if "coordination-compounds" in chap: return 52
        if "haloalkanes-and-haloarenes" in chap: return 53
        if "alcohols-phenols-and-ethers" in chap: return 54
        if "aldehydes-ketones-and-carboxylic-acids" in chap:
            if "carboxylic" in topic or "acid" in topic: return 56
            return 55
        if "compounds-containing-nitrogen" in chap: return 57
        if any(c in chap for c in ["biomolecules", "polymers", "chemistry-in-everyday-life", "environmental-chemistry", "surface-chemistry"]):
            return 58
        if any(c in chap for c in ["practical-organic-chemistry", "salt-analysis", "isolation-of-elements"]):
            return 59
        return 33

    elif "math" in sub:
        if "logarithm" in chap or "mathematical-induction" in chap: return 60
        if "quadratic-equation-and-inequalities" in chap: return 61
        if "complex-numbers" in chap: return 62
        if "permutations-and-combinations" in chap: return 63
        if "sequences-and-series" in chap: return 64
        if "binomial-theorem" in chap: return 65
        if any(c in chap for c in ["trigonometric-ratio-and-identites", "properties-of-triangle", "height-and-distance"]):
            return 66
        if "trigonometric-functions-and-equations" in chap: return 67
        if "straight-lines-and-pair-of-straight-lines" in chap: return 68
        if "circle" in chap: return 69
        if "parabola" in chap: return 70
        if "ellipse" in chap: return 71
        if "hyperbola" in chap: return 72
        if "limits-continuity-and-differentiability" in chap:
            if "limit" in topic: return 73
            return 80
        if "statistics" in chap: return 74
        if "sets-and-relations" in chap: return 75
        if "matrices-and-determinants" in chap:
            if "determinant" in topic or "cramer" in topic: return 77
            return 76
        if "inverse-trigonometric-functions" in chap: return 78
        if "functions" in chap: return 79
        if "differentiation" in chap: return 81
        if "application-of-derivatives" in chap: return 82
        if "indefinite-integrals" in chap: return 83
        if "definite-integration" in chap: return 84
        if "area-under-the-curves" in chap: return 85
        if "differential-equations" in chap: return 86
        if "vector-algebra" in chap: return 87
        if "3d-geometry" in chap: return 88
        if "linear-programming" in chap: return 89
        if "probability" in chap: return 90
        return 60
        
    return 1

# 4. Map questions and perform updates
print("Matching and updating chapter_id of database questions...")
matched_count = 0
unmatched_count = 0
updates_performed = 0

for idx, dbq in enumerate(all_questions):
    db_text = dbq.get("question_text", "")
    db_id = dbq.get("id")
    
    clean_db_text = "".join(db_text.split()).lower()
    prefix = clean_db_text[:50]
    
    matched = None
    if prefix in local_lookup:
        matched = local_lookup[prefix][0]
    else:
        for k in local_lookup.keys():
            if k in clean_db_text or clean_db_text[:30] in k:
                matched = local_lookup[k][0]
                break
                
    if matched:
        matched_count += 1
        subject = matched.get("subject")
        chapter_slug = matched.get("chapter")
        topic_text = matched.get("topic")
        
        target_chapter_id = get_mapped_chapter_id(subject, chapter_slug, topic_text)
        if target_chapter_id >= 86:
            target_chapter_id += 1
        
        # Only update if the database chapter_id doesn't match the correct mapped ID
        if dbq.get("chapter_id") != target_chapter_id:
            patch_res = requests.patch(
                f"{SUPABASE_URL}/rest/v1/questions?id=eq.{db_id}",
                headers=headers,
                json={"chapter_id": target_chapter_id}
            )
            if patch_res.status_code in [200, 204]:
                updates_performed += 1
            else:
                print(f"Failed to update ID {db_id}: {patch_res.text}")
    else:
        unmatched_count += 1

print(f"\nReseeding completed!")
print(f"Matched questions: {matched_count}")
print(f"Unmatched questions: {unmatched_count}")
print(f"Updates performed: {updates_performed}")
