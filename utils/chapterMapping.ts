export interface MappingInfo {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
}

export const CHAPTER_MAPPING: { [key: number]: Omit<MappingInfo, "id"> } = {
  // Physics (1-32)
  1: { subject: "Physics", chapter: "Math in Physics", topic: "general" },
  2: { subject: "Physics", chapter: "Units & Dimensions", topic: "general" },
  3: { subject: "Physics", chapter: "Motion in 1D", topic: "general" },
  4: { subject: "Physics", chapter: "Motion in 2D", topic: "general" },
  5: { subject: "Physics", chapter: "Laws of Motion", topic: "general" },
  6: { subject: "Physics", chapter: "Work Power Energy", topic: "general" },
  7: { subject: "Physics", chapter: "COM & Collisions", topic: "general" },
  8: { subject: "Physics", chapter: "Rotational Motion", topic: "general" },
  9: { subject: "Physics", chapter: "Gravitation", topic: "general" },
  10: { subject: "Physics", chapter: "Properties of Solids", topic: "general" },
  11: { subject: "Physics", chapter: "Properties of Fluids", topic: "general" },
  12: { subject: "Physics", chapter: "Thermal Properties", topic: "general" },
  13: { subject: "Physics", chapter: "Thermodynamics", topic: "general" },
  14: { subject: "Physics", chapter: "KTG", topic: "general" },
  15: { subject: "Physics", chapter: "Oscillations", topic: "general" },
  16: { subject: "Physics", chapter: "Waves & Sound", topic: "general" },
  17: { subject: "Physics", chapter: "Electrostatics", topic: "general" },
  18: { subject: "Physics", chapter: "Capacitance", topic: "general" },
  19: { subject: "Physics", chapter: "Current Electricity", topic: "general" },
  20: { subject: "Physics", chapter: "Magnetic Properties", topic: "general" },
  21: { subject: "Physics", chapter: "Magnetism & Current", topic: "general" },
  22: { subject: "Physics", chapter: "EMI", topic: "general" },
  23: { subject: "Physics", chapter: "AC Circuits", topic: "general" },
  24: { subject: "Physics", chapter: "EM Waves", topic: "general" },
  25: { subject: "Physics", chapter: "Ray Optics", topic: "general" },
  26: { subject: "Physics", chapter: "Wave Optics", topic: "general" },
  27: { subject: "Physics", chapter: "Dual Nature", topic: "general" },
  28: { subject: "Physics", chapter: "Atomic Physics", topic: "general" },
  29: { subject: "Physics", chapter: "Nuclear Physics", topic: "general" },
  30: { subject: "Physics", chapter: "Semiconductors", topic: "general" },
  31: { subject: "Physics", chapter: "Communication Systems", topic: "general" },
  32: { subject: "Physics", chapter: "Experimental Physics", topic: "general" },

  // Chemistry (33-59)
  33: { subject: "Chemistry", chapter: "Mole Concept", topic: "general" },
  34: { subject: "Chemistry", chapter: "Atomic Structure", topic: "general" },
  35: { subject: "Chemistry", chapter: "Periodic Table", topic: "general" },
  36: { subject: "Chemistry", chapter: "Chemical Bonding", topic: "general" },
  37: { subject: "Chemistry", chapter: "States of Matter", topic: "general" },
  38: { subject: "Chemistry", chapter: "Thermodynamics", topic: "general" },
  39: { subject: "Chemistry", chapter: "Chemical Equilibrium", topic: "general" },
  40: { subject: "Chemistry", chapter: "Ionic Equilibrium", topic: "general" },
  41: { subject: "Chemistry", chapter: "Redox Reaction", topic: "general" },
  42: { subject: "Chemistry", chapter: "Hydrogen", topic: "general" },
  43: { subject: "Chemistry", chapter: "S Block", topic: "general" },
  44: { subject: "Chemistry", chapter: "P Block (13-14)", topic: "general" },
  45: { subject: "Chemistry", chapter: "General Organic Chemistry (GOC)", topic: "general" },
  46: { subject: "Chemistry", chapter: "Hydrocarbons", topic: "general" },
  47: { subject: "Chemistry", chapter: "Solutions", topic: "general" },
  48: { subject: "Chemistry", chapter: "Electrochemistry", topic: "general" },
  49: { subject: "Chemistry", chapter: "Chemical Kinetics", topic: "general" },
  50: { subject: "Chemistry", chapter: "P Block (15-18)", topic: "general" },
  51: { subject: "Chemistry", chapter: "d & f Block", topic: "general" },
  52: { subject: "Chemistry", chapter: "Coordination Compounds", topic: "general" },
  53: { subject: "Chemistry", chapter: "Haloalkanes & Haloarenes", topic: "general" },
  54: { subject: "Chemistry", chapter: "Alcohols, Phenols & Ethers", topic: "general" },
  55: { subject: "Chemistry", chapter: "Aldehydes & Ketones", topic: "general" },
  56: { subject: "Chemistry", chapter: "Carboxylic Acids", topic: "general" },
  57: { subject: "Chemistry", chapter: "Amines", topic: "general" },
  58: { subject: "Chemistry", chapter: "Biomolecules", topic: "general" },
  59: { subject: "Chemistry", chapter: "Practical Chemistry", topic: "general" },

  // Mathematics (60-90)
  60: { subject: "Mathematics", chapter: "Basic Mathematics", topic: "general" },
  61: { subject: "Mathematics", chapter: "Quadratic Equations", topic: "general" },
  62: { subject: "Mathematics", chapter: "Complex Numbers", topic: "general" },
  63: { subject: "Mathematics", chapter: "Permutation & Combination", topic: "general" },
  64: { subject: "Mathematics", chapter: "Sequence & Series", topic: "general" },
  65: { subject: "Mathematics", chapter: "Binomial Theorem", topic: "general" },
  66: { subject: "Mathematics", chapter: "Trigonometry", topic: "general" },
  67: { subject: "Mathematics", chapter: "Trigonometric Equations", topic: "general" },
  68: { subject: "Mathematics", chapter: "Straight Lines", topic: "general" },
  69: { subject: "Mathematics", chapter: "Circle", topic: "general" },
  70: { subject: "Mathematics", chapter: "Parabola", topic: "general" },
  71: { subject: "Mathematics", chapter: "Ellipse", topic: "general" },
  72: { subject: "Mathematics", chapter: "Hyperbola", topic: "general" },
  73: { subject: "Mathematics", chapter: "Limits", topic: "general" },
  74: { subject: "Mathematics", chapter: "Statistics", topic: "general" },
  75: { subject: "Mathematics", chapter: "Sets & Relations", topic: "general" },
  76: { subject: "Mathematics", chapter: "Matrices", topic: "general" },
  77: { subject: "Mathematics", chapter: "Determinants", topic: "general" },
  78: { subject: "Mathematics", chapter: "Inverse Trigonometric Functions", topic: "general" },
  79: { subject: "Mathematics", chapter: "Functions", topic: "general" },
  80: { subject: "Mathematics", chapter: "Continuity & Differentiability", topic: "general" },
  81: { subject: "Mathematics", chapter: "Differentiation", topic: "general" },
  82: { subject: "Mathematics", chapter: "Application of Derivatives", topic: "general" },
  83: { subject: "Mathematics", chapter: "Indefinite Integration", topic: "general" },
  84: { subject: "Mathematics", chapter: "Definite Integration", topic: "general" },
  85: { subject: "Mathematics", chapter: "Area Under Curves", topic: "general" },
  86: { subject: "Mathematics", chapter: "Differential Equations", topic: "general" },
  87: { subject: "Mathematics", chapter: "Vector Algebra", topic: "general" },
  88: { subject: "Mathematics", chapter: "3D Geometry", topic: "general" },
  89: { subject: "Mathematics", chapter: "Linear Programming", topic: "general" },
  90: { subject: "Mathematics", chapter: "Probability", topic: "general" }
};

export const getQuestionMapping = (chapterId: string | number | null): MappingInfo => {
  if (chapterId === null || chapterId === undefined) {
    return { id: 1, subject: "Physics", chapter: "Math in Physics", topic: "general" };
  }
  let cid = Number(chapterId);
  if (cid >= 87) {
    cid = cid - 1;
  }
  const found = CHAPTER_MAPPING[cid];
  if (found) {
    return { id: cid, ...found };
  }

  // Fallback if not specifically found in the map
  const sub = cid <= 32 ? "Physics" : cid <= 59 ? "Chemistry" : "Mathematics";
  return {
    id: cid,
    subject: sub,
    chapter: `Chapter ${cid}`,
    topic: "general"
  };
};
