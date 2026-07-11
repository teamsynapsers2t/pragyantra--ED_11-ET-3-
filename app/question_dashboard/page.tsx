"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { ambiguousToPercent } from "@/utils/scale";
import MathHtml from "@/app/components/MathHtml";

// ─── types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string; subject: string; chapter: string; topic: string;
  question: string; options: string[];
  difficulty: string; exam: string; year: number; question_type: string;
}
interface Chapter { name: string; topics: string[]; questionCount?: number; }
interface WeaknessSignal {
  id: string; conceptId: number; conceptName: string; signal: string;
  severity: string; evidence: any; masteryScore?: number | null; createdAt: string;
}

// ─── design tokens ────────────────────────────────────────────────────────────
const T = {
  brand500: "#FF6B00", brand600: "#E2540B", brand700: "#C2410C",
  brand50: "#FFF3EA", brand200: "#FFD0A8", brand400: "#FF8A3D",
  brandGrad: "linear-gradient(135deg, #FF8A3D, #FF6B00 55%, #E2540B)",
  green500: "#16A34A", green700: "#15803D",
  amber500: "#F59E0B", red500: "#EF4444", violet500: "#8B5CF6",
  bg: "#FFF8F3", surface: "#FFFFFF", ink: "#1A1A1A",
  muted: "#6B7280", faint: "#9CA3AF", line: "#F0E6DD",
  shadowCard: "0 8px 24px rgba(255,107,0,.08)",
  shadowHover: "0 16px 36px rgba(255,107,0,.14)",
  shadowBrand: "0 8px 20px rgba(255,107,0,.30)",
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function clean(s: string) { return s ? s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ") : ""; }
const DIFF = {
  Easy: { color: "#16A34A", bars: 1 }, Medium: { color: "#F59E0B", bars: 2 },
  Hard: { color: "#EF4444", bars: 3 }, Expert: { color: "#8B5CF6", bars: 4 },
};

function DiffBars({ diff, size = 5 }: { diff: string; size?: number }) {
  const d = DIFF[diff as keyof typeof DIFF] || DIFF.Medium;
  const heights = [7, 10, 13, 16];
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 16 }}>
      {heights.map((h, i) => (
        <span key={i} style={{ width: size, height: h, borderRadius: 2, background: i < d.bars ? d.color : T.line, display: "block" }} />
      ))}
    </div>
  );
}

function MasteryRing({ pct, size = 46 }: { pct: number; size?: number }) {
  const r = 15.9155, dash = `${pct}, 100`;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke={T.line} strokeWidth="3.4" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={T.brand500} strokeWidth="3.4" strokeLinecap="round" strokeDasharray={dash} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 40 ? 12 : 10, fontWeight: 800, color: T.ink }}>{pct}%</div>
    </div>
  );
}

// SVG icon helper so we don't repeat stroke/fill boilerplate
const CI = (path: React.JSX.Element) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.brand500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

// Per-chapter icons keyed by EXACT chapter name from chapterMapping.ts
const CHAPTER_ICON_MAP: Record<string, React.JSX.Element> = {
  // ── Physics ──────────────────────────────────────────────────────────────
  "Math in Physics":       CI(<><path d="M4 7h16M4 12h10M4 17h7"/><path d="M19 12l2 2-2 2"/></>),
  "Units & Dimensions":    CI(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>),
  "Motion in 1D":          CI(<><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/><circle cx="5" cy="12" r="1.5" fill={T.brand500}/></>),
  "Motion in 2D":          CI(<><path d="M3 20 C6 10 12 4 20 4"/><path d="M20 4l-3 1.5M20 4l-1.5 3"/></>),
  "Laws of Motion":        CI(<><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M12 8v4l3 2"/></>),
  "Work Power Energy":     CI(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>),
  "COM & Collisions":      CI(<><circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M11 12h2"/></>),
  "Rotational Motion":     CI(<><circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/><circle cx="12" cy="12" r="2" fill={T.brand500}/></>),
  "Gravitation":           CI(<><circle cx="12" cy="12" r="4"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M22 12a10 10 0 0 1-10 10"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M2 12a10 10 0 0 0 10 10"/></>),
  "Properties of Solids":  CI(<><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M7 8V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"/><path d="M12 12v5M9 14.5h6"/></>),
  "Properties of Fluids":  CI(<><path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z"/><path d="M8 18a4 4 0 0 0 8 0"/></>),
  "Thermal Properties":    CI(<><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><line x1="9" y1="7" x2="7" y2="7"/><line x1="9" y1="10" x2="7" y2="10"/></>),
  "Thermodynamics":        CI(<><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></>),
  "KTG":                   CI(<><circle cx="12" cy="12" r="1.5" fill={T.brand500}/><circle cx="6" cy="7" r="1.5" fill={T.brand500}/><circle cx="18" cy="7" r="1.5" fill={T.brand500}/><circle cx="6" cy="17" r="1.5" fill={T.brand500}/><circle cx="18" cy="17" r="1.5" fill={T.brand500}/><path d="M7 8l4 3.5M13 11.5l4-4M7 16l4-3.5M13 12.5l4 4"/><rect x="2" y="2" width="20" height="20" rx="3"/></>),
  "Oscillations":          CI(<><path d="M2 12h4l3-8 4 16 3-8h6"/></>),
  "Waves & Sound":         CI(<><path d="M2 12s2-6 5-6 5 12 8 12 5-6 5-6"/></>),
  "Electrostatics":        CI(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>),
  "Capacitance":           CI(<><line x1="7" y1="5" x2="7" y2="19"/><line x1="17" y1="5" x2="17" y2="19"/><line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/><line x1="7" y1="8" x2="7" y2="16" strokeWidth="5" stroke={T.brand200}/><line x1="17" y1="8" x2="17" y2="16" strokeWidth="5" stroke={T.brand200}/></>),
  "Current Electricity":   CI(<><rect x="3" y="8" width="5" height="8" rx="1"/><path d="M8 12h8M16 8h2a2 2 0 0 1 0 8h-2"/><path d="M3 12H1M21 12h2"/></>),
  "Magnetic Properties":   CI(<><path d="M12 22V12"/><path d="M7 2v7a5 5 0 0 0 10 0V2"/><line x1="7" y1="2" x2="17" y2="2"/></>),
  "Magnetism & Current":   CI(<><path d="M5 12a7 7 0 0 1 14 0"/><path d="M5 12a7 7 0 0 0 14 0"/><path d="M12 5V2M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12"/></>),
  "EMI":                   CI(<><path d="M4 12c0-4.4 3.6-8 8-8"/><path d="M20 12c0 4.4-3.6 8-8 8"/><path d="M6 9l-2-3-3 2"/><path d="M18 15l2 3 3-2"/><path d="M12 9v6M9 12h6"/></>),
  "AC Circuits":           CI(<><path d="M2 12 C5 6 7 18 10 12 C13 6 15 18 18 12 C21 6 22 10 22 12"/></>),
  "EM Waves":              CI(<><path d="M2 10 C5 4 7 16 10 10 C13 4 15 16 18 10"/><path d="M2 14 C5 8 7 20 10 14 C13 8 15 20 18 14"/><path d="M22 6l-4 4 4 4"/></>),
  "Ray Optics":            CI(<><path d="M2 12h6"/><path d="M16 12h6"/><path d="M9 6l3 6-3 6"/><ellipse cx="12" cy="12" rx="3" ry="6"/></>),
  "Wave Optics":           CI(<><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 1 0 20M12 6a6 6 0 0 1 0 12M12 10a2 2 0 0 1 0 4"/></>),
  "Dual Nature":           CI(<><path d="M2 12 C5 6 7 18 10 12"/><circle cx="16" cy="12" r="4"/><path d="M12 12h2"/></>),
  "Atomic Physics":        CI(<><circle cx="12" cy="12" r="2" fill={T.brand500}/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></>),
  "Nuclear Physics":       CI(<><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6" strokeDasharray="3 2"/><circle cx="12" cy="12" r="9" strokeDasharray="2 3"/></>),
  "Semiconductors":        CI(<><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></>),
  "Communication Systems": CI(<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20" strokeWidth="3"/></>),
  "Experimental Physics":  CI(<><path d="M9 3h6l2 6-5 10-5-10 2-6z"/><path d="M9 3a5 5 0 0 0 6 0"/><circle cx="12" cy="17" r="1" fill={T.brand500}/></>),

  // ── Chemistry ────────────────────────────────────────────────────────────
  "Mole Concept":                    CI(<><circle cx="12" cy="12" r="4"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><line x1="6" y1="7" x2="9" y2="10"/><line x1="18" y1="7" x2="15" y2="10"/><line x1="6" y1="17" x2="9" y2="14"/><line x1="18" y1="17" x2="15" y2="14"/></>),
  "Atomic Structure":                CI(<><circle cx="12" cy="12" r="2" fill={T.brand500}/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></>),
  "Periodic Table":                  CI(<><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="16" y="2" width="6" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/><rect x="16" y="9" width="6" height="5" rx="1"/><rect x="2" y="16" width="5" height="6" rx="1"/><rect x="9" y="16" width="5" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/></>),
  "Chemical Bonding":                CI(<><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><line x1="10" y1="11" x2="14" y2="11"/><line x1="10" y1="13" x2="14" y2="13"/></>),
  "States of Matter":                CI(<><rect x="3" y="16" width="18" height="5" rx="1" fill={T.brand50}/><path d="M5 16 C7 10 17 10 19 16"/><path d="M8 10 C9 6 15 6 16 10"/><circle cx="12" cy="5" r="2" fill={T.brand50}/></>),
  "Chemical Equilibrium":            CI(<><path d="M5 9h14M7 9l-2-3M17 9l2-3"/><path d="M19 15H5M17 15l2 3M7 15l-2 3"/></>),
  "Ionic Equilibrium":               CI(<><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M6 10l-2-2M6 14l-2 2"/><path d="M18 10l2-2M18 14l2 2"/><text x="7" y="13.5" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">+</text><text x="15" y="13.5" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">-</text></>),
  "Redox Reaction":                  CI(<><path d="M4 12h7"/><path d="M4 8l3 4-3 4"/><path d="M20 12h-7"/><path d="M20 16l-3-4 3-4"/><line x1="11" y1="12" x2="13" y2="12" strokeDasharray="2 1"/></>),
  "Hydrogen":                        CI(<><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><line x1="10" y1="12" x2="14" y2="12"/><text x="5.5" y="13.5" fontSize="6" fill={T.brand500} stroke="none" fontWeight="800">H</text><text x="15.5" y="13.5" fontSize="6" fill={T.brand500} stroke="none" fontWeight="800">H</text></>),
  "S Block":                         CI(<><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><text x="5" y="9" fontSize="6" fill={T.brand500} stroke="none" fontWeight="700">s¹</text><text x="5" y="20" fontSize="6" fill={T.brand500} stroke="none" fontWeight="700">s²</text><path d="M14 6h6M14 9h4M14 17h6M14 20h4"/></>),
  "P Block (13-14)":                 CI(<><rect x="3" y="3" width="8" height="18" rx="2"/><text x="5.5" y="14" fontSize="7" fill={T.brand500} stroke="none" fontWeight="700">p</text><path d="M14 7h6M14 11h4M14 15h6M14 19h4"/></>),
  "General Organic Chemistry (GOC)": CI(<><path d="M4 17 C6 12 10 8 14 8 C18 8 20 12 20 12"/><circle cx="4" cy="17" r="2" fill={T.brand50}/><circle cx="20" cy="12" r="2" fill={T.brand50}/><path d="M9 10l1-4 4 1"/></>),
  "Hydrocarbons":                    CI(<><path d="M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z"/><circle cx="12" cy="12" r="3"/></>),
  "Solutions":                       CI(<><path d="M5 8h14l-2 12H7L5 8z"/><path d="M3 8h18"/><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><circle cx="10" cy="14" r="1" fill={T.brand500}/><circle cx="14" cy="12" r="1" fill={T.brand500}/><circle cx="12" cy="16" r="1" fill={T.brand500}/></>),
  "Electrochemistry":                CI(<><rect x="3" y="6" width="8" height="12" rx="2"/><rect x="13" y="6" width="8" height="12" rx="2"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="17" y1="2" x2="17" y2="6"/><path d="M5 10l2 2-2 2M17 14l2-2-2-2"/><line x1="11" y1="12" x2="13" y2="12" strokeDasharray="1.5 1"/></>),
  "Chemical Kinetics":               CI(<><path d="M2 20 C4 14 8 4 12 4 C16 4 18 12 22 8"/><circle cx="12" cy="4" r="2" fill={T.brand500}/><circle cx="22" cy="8" r="2" fill={T.brand50}/><path d="M22 4v8h-8"/></>),
  "P Block (15-18)":                 CI(<><rect x="3" y="3" width="8" height="18" rx="2"/><text x="5.5" y="14" fontSize="7" fill={T.brand500} stroke="none" fontWeight="700">p</text><path d="M14 5h6M14 9h4M14 13h6M14 17h4M14 21h2"/></>),
  "d & f Block":                     CI(<><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7V5M10 7V5M14 7V5M18 7V5"/><path d="M6 17v2M10 17v2M14 17v2M18 17v2"/><line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 2"/></>),
  "Coordination Compounds":          CI(<><circle cx="12" cy="12" r="3" fill={T.brand50}/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><line x1="12" y1="6" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="18"/><line x1="6" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="18" y2="12"/></>),
  "Haloalkanes & Haloarenes":        CI(<><path d="M4 12h4l2-4 2 4 2-4 2 4h4"/><circle cx="20" cy="16" r="3"/><text x="18.5" y="17.5" fontSize="5" fill={T.brand500} stroke="none" fontWeight="800">X</text></>),
  "Alcohols, Phenols & Ethers":      CI(<><path d="M6 12h12"/><circle cx="18" cy="12" r="3"/><path d="M6 12 C5 8 5 6 8 5C11 4 13 6 12 9"/><text x="15.5" y="13.5" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">OH</text></>),
  "Aldehydes & Ketones":             CI(<><path d="M4 18V8l4-4 4 4 4-4 4 4v10H4z"/><line x1="8" y1="18" x2="8" y2="12"/><line x1="16" y1="18" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="10"/><line x1="9" y1="12" x2="15" y2="12"/></>),
  "Carboxylic Acids":                CI(<><path d="M5 12h6"/><circle cx="14" cy="12" r="5"/><text x="11.5" y="13.5" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">OOH</text></>),
  "Amines":                          CI(<><circle cx="12" cy="14" r="5"/><path d="M5 7l7 7M19 7l-7 7"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><text x="9.5" y="15.5" fontSize="5" fill={T.brand500} stroke="none" fontWeight="800">NH₂</text></>),
  "Biomolecules":                    CI(<><path d="M4 4 C8 4 8 10 12 10 C16 10 16 4 20 4"/><path d="M4 20 C8 20 8 14 12 14 C16 14 16 20 20 20"/><line x1="8" y1="4" x2="8" y2="20" strokeDasharray="3 2"/><line x1="16" y1="4" x2="16" y2="20" strokeDasharray="3 2"/></>),
  "Practical Chemistry":             CI(<><path d="M9 3h6l2 6-5 10-5-10 2-6z"/><path d="M9 3a5 5 0 0 0 6 0"/><path d="M9 9h6"/><circle cx="12" cy="17" r="1.5" fill={T.brand500}/></>),

  // ── Mathematics ──────────────────────────────────────────────────────────
  "Basic Mathematics":              CI(<><path d="M4 8h16M4 12h10M4 16h7"/><path d="M18 10l2 2-2 2"/></>),
  "Quadratic Equations":            CI(<><path d="M3 18 C6 4 18 4 21 18"/><line x1="3" y1="18" x2="21" y2="18"/><circle cx="8" cy="18" r="1.5" fill={T.brand500}/><circle cx="16" cy="18" r="1.5" fill={T.brand500}/><circle cx="12" cy="6" r="1.5" fill={T.brand50}/></>),
  "Complex Numbers":                CI(<><path d="M4 12h16M12 4v16"/><text x="13" y="11" fontSize="7" fill={T.brand500} stroke="none" fontWeight="800">i</text><text x="5" y="11" fontSize="6" fill={T.brand500} stroke="none">a</text><text x="5" y="18" fontSize="6" fill={T.brand500} stroke="none">b</text></>),
  "Permutation & Combination":      CI(<><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6M9 18h6M6 9v6M18 9v6"/></>),
  "Sequence & Series":              CI(<><circle cx="4" cy="12" r="2" fill={T.brand500}/><circle cx="9" cy="8" r="2" fill={T.brand500}/><circle cx="14" cy="5" r="2" fill={T.brand500}/><circle cx="19" cy="3" r="2" fill={T.brand50}/><path d="M6 12 C8 8 11 5 16 3"/></>),
  "Binomial Theorem":               CI(<><path d="M5 18 L12 4 L19 18"/><path d="M7.5 13h9"/><text x="9.5" y="11" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">n</text><text x="11.5" y="8" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">C</text><text x="13" y="11" fontSize="5" fill={T.brand500} stroke="none" fontWeight="700">r</text></>),
  "Trigonometry":                   CI(<><path d="M2 20 L12 4 L22 20 L2 20"/><path d="M12 4v16M2 20h20"/><text x="7" y="17" fontSize="6" fill={T.brand500} stroke="none">θ</text></>),
  "Trigonometric Equations":        CI(<><path d="M2 12 C4 6 6 18 8 12 C10 6 12 18 14 12 C16 6 18 18 20 12"/><line x1="2" y1="15" x2="22" y2="15" strokeDasharray="3 2"/></>),
  "Straight Lines":                 CI(<><path d="M3 20 L21 4"/><circle cx="3" cy="20" r="2" fill={T.brand50}/><circle cx="21" cy="4" r="2" fill={T.brand50}/><path d="M3 4h4M3 4v4" strokeDasharray="2 2"/></>),
  "Circle":                         CI(<><circle cx="12" cy="12" r="9"/><line x1="12" y1="12" x2="19" y2="12"/><text x="13.5" y="11" fontSize="5" fill={T.brand500} stroke="none">r</text><circle cx="12" cy="12" r="1.5" fill={T.brand500}/></>),
  "Parabola":                       CI(<><path d="M12 3 C5 6 5 18 12 21 C19 18 19 6 12 3"/><line x1="12" y1="3" x2="12" y2="21"/><circle cx="12" cy="12" r="1.5" fill={T.brand500}/></>),
  "Ellipse":                        CI(<><ellipse cx="12" cy="12" rx="10" ry="6"/><circle cx="7" cy="12" r="1.5" fill={T.brand500}/><circle cx="17" cy="12" r="1.5" fill={T.brand500}/><line x1="7" y1="12" x2="17" y2="12" strokeDasharray="2 2"/></>),
  "Hyperbola":                      CI(<><path d="M3 4 C5 8 5 16 3 20"/><path d="M21 4 C19 8 19 16 21 20"/><line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 2"/><line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 2"/></>),
  "Limits":                         CI(<><path d="M4 16 C7 10 9 14 12 12 C15 10 17 8 20 8"/><path d="M20 8l-3 1M20 8l-1 3"/><line x1="4" y1="20" x2="20" y2="20" strokeDasharray="2 2"/></>),
  "Statistics":                     CI(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>),
  "Sets & Relations":               CI(<><circle cx="9" cy="12" r="7"/><circle cx="15" cy="12" r="7"/></>),
  "Matrices":                       CI(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v18M16 3v18M3 8h18M3 16h18"/></>),
  "Determinants":                   CI(<><path d="M5 3v18M19 3v18"/><path d="M5 3h4M5 21h4M15 3h4M15 21h4"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></>),
  "Inverse Trigonometric Functions":CI(<><path d="M2 16 C6 6 10 6 12 12 C14 18 18 18 22 8"/><circle cx="2" cy="16" r="2" fill={T.brand50}/><circle cx="22" cy="8" r="2" fill={T.brand50}/></>),
  "Functions":                      CI(<><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><path d="M10 6.5h1a3 3 0 0 1 3 3v1"/><path d="M14 17.5l1.5-1.5 1.5 1.5"/></>),
  "Continuity & Differentiability": CI(<><path d="M2 16 C5 16 6 8 9 8 C12 8 12 12 12 12 C12 12 12 8 15 8 C18 8 19 16 22 16"/><circle cx="12" cy="12" r="2" fill={T.brand500}/></>),
  "Differentiation":                CI(<><path d="M4 18 C8 18 10 4 12 4 C14 4 16 18 20 18"/><path d="M8 10l8 0" strokeDasharray="2 2"/><path d="M12 4v6"/><text x="13.5" y="10" fontSize="6" fill={T.brand500} stroke="none" fontWeight="700">dy/dx</text></>),
  "Application of Derivatives":     CI(<><path d="M3 18 C6 10 9 4 12 4 C15 4 18 10 21 18"/><path d="M7 7l10 0" strokeDasharray="2 2"/><circle cx="12" cy="4" r="2" fill={T.brand500}/><text x="13" y="8" fontSize="5" fill={T.brand500} stroke="none">max</text></>),
  "Indefinite Integration":         CI(<><path d="M7 4 C5 4 4 6 5 8 C6 10 8 10 8 12 C8 14 6 14 5 16 C4 18 5 20 7 20"/><path d="M12 12h6"/><path d="M16 9l3 3-3 3"/></>),
  "Definite Integration":           CI(<><path d="M7 4 C5 4 4 6 5 8 C6 10 8 10 8 12 C8 14 6 14 5 16 C4 18 5 20 7 20"/><line x1="5" y1="4" x2="9" y2="4"/><line x1="5" y1="20" x2="9" y2="20"/><text x="10" y="8" fontSize="5" fill={T.brand500} stroke="none">b</text><text x="10" y="21" fontSize="5" fill={T.brand500} stroke="none">a</text></>),
  "Area Under Curves":              CI(<><path d="M2 20 L5 12 C8 4 16 4 19 12 L22 20 Z" fill={T.brand50}/><path d="M2 20 L5 12 C8 4 16 4 19 12 L22 20"/><line x1="2" y1="20" x2="22" y2="20"/></>),
  "Differential Equations":         CI(<><text x="2" y="14" fontSize="8" fill={T.brand500} stroke="none" fontWeight="700">dy</text><line x1="2" y1="15" x2="12" y2="15"/><text x="2" y="21" fontSize="8" fill={T.brand500} stroke="none" fontWeight="700">dx</text><text x="13" y="16" fontSize="8" fill={T.brand500} stroke="none" fontWeight="700">= f(x)</text></>),
  "Vector Algebra":                 CI(<><line x1="4" y1="18" x2="18" y2="6"/><path d="M13 6l5 0 0 5"/><line x1="4" y1="18" x2="12" y2="6"/><path d="M8.5 6l3.5 0 0 3.5" strokeDasharray="2 1.5"/></>),
  "3D Geometry":                    CI(<><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="19" x2="19" y2="5"/><path d="M12 2l1 2M22 12l-2-1M19 5l-2 1"/></>),
  "Linear Programming":             CI(<><path d="M3 3h18v18H3z" fill="none"/><path d="M3 21 L3 8 L10 3 L21 3 L21 15 L14 21 Z" fill={T.brand50}/><line x1="3" y1="21" x2="21" y2="3" strokeDasharray="3 2"/><circle cx="10" cy="3" r="1.5" fill={T.brand500}/><circle cx="3" cy="8" r="1.5" fill={T.brand500}/></>),
  "Probability":                    CI(<><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><circle cx="7" cy="7" r="1.5" fill={T.brand500}/><circle cx="17" cy="7" r="1.5" fill={T.brand500}/><circle cx="7" cy="17" r="1.5" fill={T.brand500}/><circle cx="17" cy="17" r="1.5" fill={T.brand500}/></>),
};

// Static difficulty for every chapter (based on JEE/NEET syllabus standards)
const CHAPTER_DIFFICULTY: Record<string, "Easy" | "Medium" | "Hard"> = {
  // Physics
  "Math in Physics": "Easy", "Units & Dimensions": "Medium", "Motion in 1D": "Easy",
  "Motion in 2D": "Medium", "Laws of Motion": "Medium", "Work Power Energy": "Medium",
  "COM & Collisions": "Hard", "Rotational Motion": "Hard", "Gravitation": "Medium",
  "Properties of Solids": "Easy", "Properties of Fluids": "Medium", "Thermal Properties": "Easy",
  "Thermodynamics": "Hard", "KTG": "Medium", "Oscillations": "Medium",
  "Waves & Sound": "Medium", "Electrostatics": "Hard", "Capacitance": "Hard",
  "Current Electricity": "Hard", "Magnetic Properties": "Medium", "Magnetism & Current": "Hard",
  "EMI": "Hard", "AC Circuits": "Medium", "EM Waves": "Easy",
  "Ray Optics": "Medium", "Wave Optics": "Medium", "Dual Nature": "Easy",
  "Atomic Physics": "Easy", "Nuclear Physics": "Easy", "Semiconductors": "Easy",
  "Communication Systems": "Easy", "Experimental Physics": "Medium",
  // Chemistry
  "Mole Concept": "Medium", "Atomic Structure": "Medium", "Periodic Table": "Easy",
  "Chemical Bonding": "Medium", "States of Matter": "Medium", "Chemical Equilibrium": "Hard",
  "Ionic Equilibrium": "Hard", "Redox Reaction": "Medium", "Hydrogen": "Easy",
  "S Block": "Easy", "P Block (13-14)": "Medium", "General Organic Chemistry (GOC)": "Hard",
  "Hydrocarbons": "Medium", "Solutions": "Hard", "Electrochemistry": "Hard",
  "Chemical Kinetics": "Hard", "P Block (15-18)": "Medium", "d & f Block": "Medium",
  "Coordination Compounds": "Hard", "Haloalkanes & Haloarenes": "Medium",
  "Alcohols, Phenols & Ethers": "Medium", "Aldehydes & Ketones": "Hard",
  "Carboxylic Acids": "Medium", "Amines": "Medium", "Biomolecules": "Easy",
  "Practical Chemistry": "Medium",
  // Mathematics
  "Basic Mathematics": "Easy", "Quadratic Equations": "Medium", "Complex Numbers": "Hard",
  "Permutation & Combination": "Hard", "Sequence & Series": "Medium", "Binomial Theorem": "Medium",
  "Trigonometry": "Medium", "Trigonometric Equations": "Medium", "Straight Lines": "Easy",
  "Circle": "Medium", "Parabola": "Hard", "Ellipse": "Hard", "Hyperbola": "Hard",
  "Limits": "Medium", "Statistics": "Easy", "Sets & Relations": "Easy",
  "Matrices": "Medium", "Determinants": "Medium", "Inverse Trigonometric Functions": "Easy",
  "Functions": "Medium", "Continuity & Differentiability": "Hard", "Differentiation": "Medium",
  "Application of Derivatives": "Hard", "Indefinite Integration": "Hard",
  "Definite Integration": "Hard", "Area Under Curves": "Hard", "Differential Equations": "Hard",
  "Vector Algebra": "Medium", "3D Geometry": "Hard", "Linear Programming": "Easy",
  "Probability": "Hard",
};

function getChapterIcon(name: string): React.JSX.Element {
  if (CHAPTER_ICON_MAP[name]) return CHAPTER_ICON_MAP[name];
  // fuzzy fallback
  const l = name.toLowerCase();
  if (l.includes("wave") || l.includes("sound")) return CHAPTER_ICON_MAP["Waves & Sound"];
  if (l.includes("thermo")) return CHAPTER_ICON_MAP["Thermodynamics"];
  if (l.includes("motion")) return CHAPTER_ICON_MAP["Motion in 1D"];
  if (l.includes("electric")) return CHAPTER_ICON_MAP["Electrostatics"];
  if (l.includes("magnet")) return CHAPTER_ICON_MAP["Magnetic Properties"];
  if (l.includes("optic")) return CHAPTER_ICON_MAP["Ray Optics"];
  if (l.includes("atom")) return CHAPTER_ICON_MAP["Atomic Physics"];
  if (l.includes("integr")) return CHAPTER_ICON_MAP["Indefinite Integration"];
  if (l.includes("differ")) return CHAPTER_ICON_MAP["Differentiation"];
  return CI(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>);
}

function getStaticDifficulty(name: string): "Easy" | "Medium" | "Hard" {
  return CHAPTER_DIFFICULTY[name] || "Medium";
}

const SUBJECTS_JEE  = ["Physics", "Chemistry", "Mathematics"];
const SUBJECTS_NEET = ["Physics", "Chemistry", "Botany", "Zoology"];

const NAV_ITEMS = [
  { label: "Home",        icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: "Mock Tests",  icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M8 10h8M8 14h6"/></svg> },
  { label: "Bookmarks",   icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
  { label: "Analytics",   icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: "Leaderboard", icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
  { label: "Settings",    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

// ─── Coming Soon panel ────────────────────────────────────────────────────────
function ComingSoon({ title, emoji, desc }: { title: string; emoji: string; desc: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 72, lineHeight: 1 }}>{emoji}</div>
      <div style={{ background: "linear-gradient(135deg,#FF8A3D,#FF6B00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
      <div style={{ background: T.brand50, border: `1.5px solid ${T.brand200}`, borderRadius: 999, padding: "7px 20px", fontSize: 13, fontWeight: 700, color: T.brand600, letterSpacing: 0.3 }}>Coming Soon</div>
      <p style={{ color: T.muted, fontSize: 15, maxWidth: 380, lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ─── NEET: not live yet ────────────────────────────────────────────────────────
// The question bank, practice engine, and analysis dashboard only have JEE
// content today. Any NEET selection — from the exam picker, settings toggle,
// or a direct link — lands here instead of a broken/empty JEE-shaped screen.
function NeetComingSoon({ onBackToJee }: { onBackToJee: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 460, width: "100%", textAlign: "center", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 24, padding: "48px 36px", boxShadow: T.shadowCard }}>
        <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 18 }}>🧬</div>
        <div style={{ background: "linear-gradient(135deg,#5FBF7E,#16834A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>NEET</div>
        <div style={{ display: "inline-block", marginTop: 12, background: "#E6F4EA", border: "1.5px solid #BEE3C8", borderRadius: 999, padding: "7px 20px", fontSize: 13, fontWeight: 700, color: T.green700, letterSpacing: 0.3 }}>Coming Soon</div>
        <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.65, margin: "18px 0 0" }}>
          We&apos;re building PAPER&apos;s root-cause engine and question bank for NEET UG. It isn&apos;t ready yet — but JEE is fully live right now.
        </p>
        <button onClick={onBackToJee} style={{ marginTop: 28, display: "inline-flex", alignItems: "center", gap: 8, background: T.brandGrad, border: "none", borderRadius: 14, padding: "13px 26px", fontSize: 14.5, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: T.shadowBrand }}>
          Continue with JEE
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Bookmarks page ───────────────────────────────────────────────────────────
function BookmarksPage({ bookmarks, onPracticeBookmark, onRemove }: {
  bookmarks: Record<string, Question>;
  onPracticeBookmark: (q: Question) => void;
  onRemove: (id: string) => void;
}) {
  const list = Object.values(bookmarks);
  if (list.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>🔖</div>
        <h2 style={{ fontWeight: 800, fontSize: 24, margin: 0, color: T.ink }}>No bookmarks yet</h2>
        <p style={{ color: T.muted, fontSize: 15, maxWidth: 340, margin: 0 }}>Tap the bookmark icon on any question while practising to save it here.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: "4px 0 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, color: T.ink }}>Saved Questions</h2>
          <p style={{ color: T.muted, fontSize: 13, margin: "4px 0 0" }}>{list.length} bookmark{list.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.map(q => (
          <div key={q.id} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: "18px 22px", boxShadow: T.shadowCard }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: T.brand50, color: T.brand600, border: `1px solid ${T.brand200}`, padding: "3px 10px", borderRadius: 6 }}>{q.subject}</span>
              <span style={{ fontSize: 11, color: T.muted, background: "#F3F4F6", padding: "3px 10px", borderRadius: 6 }}>{q.chapter}</span>
              {q.year && <span style={{ fontSize: 11, color: T.muted, background: "#F3F4F6", padding: "3px 10px", borderRadius: 6 }}>{q.exam?.toUpperCase()} {q.year}</span>}
              {q.difficulty && <DiffBars diff={q.difficulty} />}
            </div>
            <MathHtml stripOptions style={{ fontSize: 14, color: T.ink, lineHeight: 1.65, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }} html={q.question} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => onPracticeBookmark(q)} style={{ flex: 1, background: T.brandGrad, color: "#fff", border: "none", borderRadius: 12, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Practice this question →
              </button>
              <button onClick={() => onRemove(q.id)} style={{ padding: "9px 14px", background: "#FEF2F2", color: T.red500, border: `1px solid #FECACA`, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────
function SettingsPage({ exam, onExamChange }: { exam: string; onExamChange: (e: string) => void }) {
  const { user, isLoaded } = useUser();
  const [notifPractice, setNotifPractice] = useState(() => localStorage.getItem("notif_practice") !== "false");
  const [notifStreak, setNotifStreak]   = useState(() => localStorage.getItem("notif_streak") !== "false");
  const [darkPractice, setDarkPractice] = useState(() => localStorage.getItem("dark_practice") !== "false");
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem("notif_practice", String(notifPractice));
    localStorage.setItem("notif_streak", String(notifStreak));
    localStorage.setItem("dark_practice", String(darkPractice));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: on ? T.brand500 : "#D1D5DB", transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.line}`, background: T.brand50 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0, color: T.brand600, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  const Row = ({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${T.line}`, gap: 20 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );

  return (
    <div style={{ maxWidth: 640, padding: "4px 0 80px" }}>
      <h2 style={{ fontWeight: 800, fontSize: 22, margin: "0 0 22px", color: T.ink }}>Settings</h2>

      <Section title="Account">
        <Row label="Name" sub="From your Clerk account" right={
          <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{isLoaded ? (user?.fullName || user?.firstName || "—") : "…"}</span>
        } />
        <Row label="Email" sub="Primary email address" right={
          <span style={{ fontSize: 13, color: T.muted }}>{isLoaded ? (user?.primaryEmailAddress?.emailAddress || "—") : "…"}</span>
        } />
        <div style={{ padding: "14px 22px" }}>
          <UserButton />
        </div>
      </Section>

      <Section title="Exam Preference">
        <Row label="Default Exam" sub="Which exam to pre-select on the dashboard" right={
          <div style={{ display: "flex", gap: 8 }}>
            {["jee", "neet"].map(e => (
              <button key={e} onClick={() => onExamChange(e)} style={{ padding: "7px 16px", borderRadius: 10, border: `1.5px solid ${exam === e ? T.brand500 : T.line}`, background: exam === e ? T.brand50 : T.surface, color: exam === e ? T.brand600 : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {e.toUpperCase()}
              </button>
            ))}
          </div>
        } />
      </Section>

      <Section title="Notifications">
        <Row label="Practice reminders" sub="Daily reminders to keep your streak going" right={<Toggle on={notifPractice} onChange={setNotifPractice} />} />
        <Row label="Streak alerts" sub="Notify me before my streak breaks" right={<Toggle on={notifStreak} onChange={setNotifStreak} />} />
      </Section>

      <Section title="Practice Mode">
        <Row label="Dark mode for questions" sub="Use dark background when solving questions" right={<Toggle on={darkPractice} onChange={setDarkPractice} />} />
      </Section>

      <button onClick={save} style={{ background: T.brandGrad, color: "#fff", border: "none", borderRadius: 14, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: T.shadowBrand, display: "flex", alignItems: "center", gap: 8 }}>
        {saved ? "✓ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── PracticeEndEffect ────────────────────────────────────────────────────────
function PracticeEndEffect({ sessionId, answers }: { sessionId: string | null; answers: any[] }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !sessionId) return;
    done.current = true;
    const c = answers.filter(a => a.correct).length;
    fetch("/api/sessions/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, questionsAttempted: answers.length, questionsCorrect: c, questionsSkipped: 0 }) }).catch(() => {});
    // Refresh weakness signals so dashboard root causes update immediately after this session
    fetch("/api/weakness/refresh", { method: "POST" }).catch(() => {});
  }, [sessionId, answers]);
  return null;
}

// ─── Filters: reusable button + slide-in panel ───────────────────────────────
// Shared by the chapter-selection screen and the questions-list screen so the
// same filter UI (sort / year / level / difficulty) is available in both.
function FilterPanel({
  filterSort, onFilterSortChange,
  filterYears, onFilterYearsChange,
  filterDifficulty, onFilterDifficultyChange,
  filterLevel, onFilterLevelChange,
  buttonStyle,
}: {
  filterSort: "newest"|"oldest";
  onFilterSortChange: (v: "newest"|"oldest") => void;
  filterYears: number[];
  onFilterYearsChange: (v: number[]) => void;
  filterDifficulty: string[];
  onFilterDifficultyChange: (v: string[]) => void;
  filterLevel: string;
  onFilterLevelChange: (v: string) => void;
  buttonStyle?: React.CSSProperties;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingSort, setPendingSort] = useState<"newest"|"oldest">(filterSort);
  const [pendingYears, setPendingYears] = useState<number[]>(filterYears);
  const [pendingDifficulty, setPendingDifficulty] = useState<string[]>(filterDifficulty);
  const [pendingLevel, setPendingLevel] = useState<string>(filterLevel);

  const activeCount = filterYears.length + filterDifficulty.length + (filterLevel ? 1 : 0);
  const hasActive = filterYears.length > 0 || filterDifficulty.length > 0 || !!filterLevel;

  return (
    <>
      <button
        onClick={() => { setPendingSort(filterSort); setPendingYears(filterYears); setPendingDifficulty(filterDifficulty); setPendingLevel(filterLevel); setFilterOpen(true); }}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, background: hasActive ? T.brandGrad : T.surface, border: `1px solid ${hasActive ? "transparent" : T.line}`, color: hasActive ? "#fff" : T.ink, transition: "all .25s", position: "relative", flexShrink: 0, ...buttonStyle }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
        Filters
        {activeCount > 0 && (
          <span style={{ position: "absolute", top: -7, right: -7, minWidth: 20, height: 20, padding: "0 4px", borderRadius: 999, background: "#fff", color: T.brand500, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.brand500}` }}>
            {activeCount}
          </span>
        )}
      </button>

      {filterOpen && (
        <>
          <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,12,4,0.45)", backdropFilter: "blur(2px)", zIndex: 70 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, maxWidth: "100vw", background: "#fff", zIndex: 80, boxShadow: "-8px 0 40px rgba(40,20,0,0.18)", display: "flex", flexDirection: "column", fontFamily: T.font }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px 16px", borderBottom: `1px solid ${T.line}` }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>Filters</span>
              <button onClick={() => setFilterOpen(false)} style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Sort By */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Sort By</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["newest", "oldest"] as const).map(s => (
                    <button key={s} onClick={() => setPendingSort(s)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${pendingSort === s ? T.brand500 : T.line}`, background: pendingSort === s ? T.brandGrad : "#fff", color: pendingSort === s ? "#fff" : T.ink, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{s === "newest" ? <path d="M12 5v14M5 12l7 7 7-7"/> : <path d="M12 19V5M5 12l7-7 7 7"/>}</svg>
                      {s === "newest" ? "Newest to Oldest" : "Oldest to Newest"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year Filter */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Year Filter</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015].map(y => {
                    const on = pendingYears.includes(y);
                    return (
                      <button key={y} onClick={() => setPendingYears(on ? pendingYears.filter(x => x !== y) : [...pendingYears, y])}
                        style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${on ? T.brand500 : T.line}`, background: on ? T.brandGrad : "#fff", color: on ? "#fff" : T.ink, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        {y}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  {[["Last 5 Years", 5], ["Last 10 Years", 10], ["All Years", 0]].map(([label, n]) => (
                    <button key={label as string} onClick={() => {
                      if (n === 0) { setPendingYears([]); }
                      else { const cur = new Date().getFullYear(); setPendingYears(Array.from({length: n as number}, (_, i) => cur - i)); }
                    }}
                      style={{ padding: "7px 12px", borderRadius: 10, border: `1px solid ${T.line}`, background: "#fff", color: T.ink, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Level */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Student Level</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Beginner", icon: "🌱", diff: "Easy" },
                    { label: "Intermediate", icon: "🔥", diff: "Medium" },
                    { label: "Advanced", icon: "👑", diff: "Hard" },
                  ].map(lv => {
                    const on = pendingLevel === lv.label;
                    return (
                      <button key={lv.label} onClick={() => { setPendingLevel(on ? "" : lv.label); if (!on) setPendingDifficulty([lv.diff]); else setPendingDifficulty([]); }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 10px", borderRadius: 16, border: `2px solid ${on ? T.brand500 : T.line}`, background: on ? "#FFF5EC" : "#fff", cursor: "pointer" }}>
                        <span style={{ fontSize: 26 }}>{lv.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: on ? T.brand500 : T.ink }}>{lv.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Level */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Difficulty Level</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Easy", color: "#22c55e", bars: [1,1,0,0] },
                    { label: "Medium", color: "#f59e0b", bars: [1,1,1,0] },
                    { label: "Hard", color: "#ef4444", bars: [1,1,1,1] },
                    { label: "Expert", color: "#7c3aed", bars: [1,1,1,1] },
                  ].map(d => {
                    const on = pendingDifficulty.includes(d.label);
                    return (
                      <button key={d.label} onClick={() => { setPendingDifficulty(on ? pendingDifficulty.filter(x => x !== d.label) : [...pendingDifficulty, d.label]); setPendingLevel(""); }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px", borderRadius: 14, border: `2px solid ${on ? d.color : T.line}`, background: on ? `${d.color}15` : "#fff", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                          {d.bars.map((h, i) => <div key={i} style={{ width: 4, height: 6 + i * 4, borderRadius: 2, background: on ? d.color : (i < (d.label === "Easy" ? 2 : d.label === "Medium" ? 3 : 4) ? d.color : T.line) }} />)}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: on ? d.color : T.ink }}>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${T.line}`, padding: "16px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.brand500, textAlign: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 800 }}>Filters ready to apply</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setPendingSort("newest"); setPendingYears([]); setPendingDifficulty([]); setPendingLevel(""); onFilterSortChange("newest"); onFilterYearsChange([]); onFilterDifficultyChange([]); onFilterLevelChange(""); }}
                  style={{ flex: 1, padding: "13px", borderRadius: 14, border: `1.5px solid ${T.line}`, background: "#fff", color: T.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Reset
                </button>
                <button onClick={() => { onFilterSortChange(pendingSort); onFilterYearsChange(pendingYears); onFilterDifficultyChange(pendingDifficulty); onFilterLevelChange(pendingLevel); setFilterOpen(false); }}
                  style={{ flex: 2, padding: "13px", borderRadius: 14, border: "none", background: T.brandGrad, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 20px rgba(255,107,0,.35)" }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Question List view ───────────────────────────────────────────────────────
function QuestionListView({
  subject, chapter, topic, exam,
  onSelectQuestion, onBack,
  filterSort, filterYears, filterDifficulty, filterLevel,
  onFilterSortChange, onFilterYearsChange, onFilterDifficultyChange, onFilterLevelChange,
}: {
  subject: string; chapter: string | null; topic: string | null; exam: string;
  onSelectQuestion: (startAt: number) => void;
  onBack: () => void;
  filterSort: "newest"|"oldest";
  filterYears: number[];
  filterDifficulty: string[];
  filterLevel: string;
  onFilterSortChange: (v: "newest"|"oldest") => void;
  onFilterYearsChange: (v: number[]) => void;
  onFilterDifficultyChange: (v: string[]) => void;
  onFilterLevelChange: (v: string) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    setLoading(true);
    let url = `/api/questions?subject=${encodeURIComponent(subject)}`;
    if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
    if (topic)   url += `&topic=${encodeURIComponent(topic)}`;
    fetch(url).then(r => r.ok ? r.json() : null)
      .then(d => setQuestions(d?.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subject, chapter, topic]);

  const filtered = (() => {
    let qs = [...questions];
    if (search.trim()) {
      const s = search.toLowerCase();
      qs = qs.filter(q => q.question?.toLowerCase().includes(s) || String(q.year).includes(s));
    }
    if (filterYears && filterYears.length > 0) {
      qs = qs.filter(q => filterYears.includes(Number(q.year)));
    }
    if (filterDifficulty && filterDifficulty.length > 0) {
      const lowerDiffs = filterDifficulty.map(d => d.toLowerCase());
      qs = qs.filter(q => lowerDiffs.includes((q.difficulty || "").toLowerCase()));
    }
    if (filterSort === "oldest") {
      qs = [...qs].sort((a, b) => Number(a.year) - Number(b.year));
    } else {
      qs = [...qs].sort((a, b) => Number(b.year) - Number(a.year));
    }
    return qs;
  })();

  // ── Energy background canvas ─────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvas.getContext("2d")!;
    const cv = canvas as HTMLCanvasElement;
    let raf: number;
    let W = 0, H = 0, curves: any[] = [], particles: any[] = [], lastT = 0;
    const R = 224, G = 105, B = 38;

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function makeArc(cx: number, cy: number, r: number, op: number, lw: number) {
      const d0 = r*r - cy*cy;
      if (d0 < 0) return null;
      const xTop = cx - Math.sqrt(d0);
      if (xTop > W + 50 || xTop < -50) return null;
      const angStart = Math.atan2(-cy, xTop - cx);
      const dr = r*r - (W - cx)*(W - cx);
      let angEnd: number | null = null;
      if (dr >= 0) {
        const yR = cy + Math.sqrt(dr);
        if (yR >= -20 && yR <= H + 20) angEnd = Math.atan2(yR - cy, W - cx);
      }
      if (angEnd === null) {
        const db = r*r - (H - cy)*(H - cy);
        if (db < 0) return null;
        const xB = cx - Math.sqrt(db);
        if (xB < -20 || xB > W + 20) return null;
        angEnd = Math.atan2(H - cy, xB - cx);
      }
      return { type:"arc", cx, cy, r, as: angStart, ae: angEnd, op, lw,
        pt(t: number) { const a = angStart + (angEnd! - angStart)*t; return { x: cx+r*Math.cos(a), y: cy+r*Math.sin(a) }; } };
    }

    function makeBez(p: number[], op: number, lw: number) {
      return { type:"bz", p, op, lw,
        pt(t: number) { const m=1-t; return { x: m*m*m*p[0]+3*m*m*t*p[2]+3*m*t*t*p[4]+t*t*t*p[6], y: m*m*m*p[1]+3*m*m*t*p[3]+3*m*t*t*p[5]+t*t*t*p[7] }; } };
    }

    function setup() {
      const dpr = Math.min(window.devicePixelRatio||1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W*dpr; cv.height = H*dpr;
      cv.style.width = W+"px"; cv.style.height = H+"px";
      ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr);
      const CX = W*1.011, CY = H*-0.444;
      curves = [];
      [[0.430,0.038,0.50],[0.497,0.068,0.82],[0.560,0.052,0.66],[0.625,0.036,0.52],[0.700,0.024,0.42]]
        .forEach(([rf,op,lw]) => { const a = makeArc(CX,CY,rf*W,op,lw); if (a) curves.push(a); });
      curves.push(makeBez([W*-.03,H*.27,W*.08,H*.41,W*.11,H*.57,W*.01,H*.77], 0.052, 0.65));
      curves.push(makeBez([W*-.06,H*.20,W*.04,H*.35,W*.08,H*.53,W*-.03,H*.72], 0.034, 0.48));
      curves.push(makeBez([W*.80,H*1.06,W*.93,H*.88,W*1.05,H*.79,W*1.10,H*.68], 0.026, 0.44));
      particles = [];
      [[1,5],[2,4],[3,3],[0,2],[4,2],[5,3],[6,2]].forEach(([ci,cnt]) => {
        const c = curves[ci]; if (!c) return;
        for (let i=0; i<cnt; i++) particles.push({ c, t: Math.random(), spd: lerp(0.000045,0.000110,Math.random()), r: lerp(1.7,3.2,Math.random()), op: lerp(0.42,0.84,Math.random()) });
      });
    }

    function tick(ts: number) {
      raf = requestAnimationFrame(tick);
      const dt = lastT ? Math.min(ts-lastT, 50) : 16; lastT = ts;
      ctx.clearRect(0,0,W,H); ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,W,H);
      curves.forEach(c => {
        ctx.save(); ctx.lineCap="round"; ctx.beginPath();
        if (c.type==="arc") ctx.arc(c.cx,c.cy,c.r,c.as,c.ae,true);
        else { ctx.moveTo(c.p[0],c.p[1]); ctx.bezierCurveTo(c.p[2],c.p[3],c.p[4],c.p[5],c.p[6],c.p[7]); }
        ctx.lineWidth=c.lw*7; ctx.strokeStyle=`rgba(${R},${G},${B},${c.op*0.08})`; ctx.stroke();
        ctx.lineWidth=c.lw*3; ctx.strokeStyle=`rgba(${R},${G},${B},${c.op*0.22})`; ctx.stroke();
        ctx.lineWidth=c.lw;   ctx.strokeStyle=`rgba(${R},${G},${B},${c.op})`; ctx.stroke();
        ctx.restore();
      });
      particles.forEach(p => {
        p.t = (p.t + p.spd*dt) % 1;
        const pos = p.c.pt(p.t);
        if (pos.x < -8||pos.x > W+8||pos.y < -8||pos.y > H+8) return;
        ctx.save(); ctx.shadowColor=`rgba(${R},${G},${B},0.8)`; ctx.shadowBlur=8;
        ctx.fillStyle=`rgba(${R},${G},${B},${p.op})`; ctx.beginPath(); ctx.arc(pos.x,pos.y,p.r,0,Math.PI*2); ctx.fill(); ctx.restore();
      });
    }

    setup();
    raf = requestAnimationFrame(tick);
    const onResize = () => { cancelAnimationFrame(raf); lastT=0; setup(); raf = requestAnimationFrame(tick); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  // ── Difficulty color (light theme) ───────────────────────────────────────
  function diffColor(d: string) {
    const l = (d||"").toLowerCase();
    if (l === "hard" || l === "expert") return "#ef4444";
    if (l === "easy") return "#16a34a";
    return "#d97706";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#111", fontFamily: T.font, position: "relative" }}>
      {/* Animated energy canvas */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />

      {/* All content sits above the canvas */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header style={{ height: 54, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid rgba(224,122,56,0.13)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>Back
            </button>
            <span style={{ color: "#e0e0e0" }}>|</span>
            <span style={{ fontSize: 12, color: "#E07A38", fontWeight: 700 }}>{subject}</span>
            {chapter && <><span style={{ color: "#ccc", fontSize: 12 }}>/</span><span style={{ fontSize: 12, color: "#555" }}>{chapter}</span></>}
            {topic   && <><span style={{ color: "#ccc", fontSize: 12 }}>/</span><span style={{ fontSize: 12, color: "#111", fontWeight: 700 }}>{clean(topic)}</span></>}
          </div>
          <span style={{ fontSize: 10, color: "#E07A38", background: "rgba(224,122,56,0.09)", border: "1px solid rgba(224,122,56,0.2)", padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>🎓 {exam.toUpperCase()}</span>
        </header>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 20px 100px" }}>
          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111", letterSpacing: -0.5, margin: "0 0 4px" }}>
              {topic ? clean(topic) : chapter || subject}
            </h2>
            {!loading && (
              <p style={{ fontSize: 14, color: "#999", margin: "0 0 18px" }}>
                {filtered.length} question{filtered.length !== 1 ? "s" : ""}{filterYears && filterYears.length > 0 || filterDifficulty && filterDifficulty.length > 0 ? " (filtered)" : " · click any to start practice"}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search questions or filter by year…"
                style={{ flex: 1, minWidth: 0, boxSizing: "border-box", padding: "11px 16px", borderRadius: 14, border: "1.5px solid #f0f0f0", background: "rgba(255,255,255,0.9)", color: "#111", fontSize: 14, outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              />
              <FilterPanel
                filterSort={filterSort} onFilterSortChange={onFilterSortChange}
                filterYears={filterYears} onFilterYearsChange={onFilterYearsChange}
                filterDifficulty={filterDifficulty} onFilterDifficultyChange={onFilterDifficultyChange}
                filterLevel={filterLevel} onFilterLevelChange={onFilterLevelChange}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 80 }}>
              <div style={{ width: 38, height: 38, border: "4px solid #E07A38", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              <p style={{ color: "#999", fontSize: 13 }}>Loading questions…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <p style={{ fontSize: 40, marginBottom: 10 }}>🔍</p>
              <p style={{ color: "#888", fontSize: 15, fontWeight: 600 }}>{search ? "No questions match your search." : "No questions found for these filters."}</p>
              <p style={{ color: "#bbb", fontSize: 13, marginTop: 6 }}>Try adjusting your year or difficulty filters.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((q) => {
                const origIdx = questions.indexOf(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(origIdx)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderRadius: 14, background: "#fff", border: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left", width: "100%", transition: "box-shadow .15s, border-color .15s", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#E07A38"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(224,122,56,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0f0f0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; }}>
                    {/* Index badge */}
                    <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: "rgba(224,122,56,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#E07A38" }}>{origIdx + 1}</span>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7, flexWrap: "wrap" }}>
                        {q.year && <span style={{ fontSize: 11, fontWeight: 600, color: "#E07A38" }}>{q.exam?.toUpperCase()} {q.year}</span>}
                        {q.difficulty && <span style={{ fontSize: 10, fontWeight: 700, color: diffColor(q.difficulty), background: `${diffColor(q.difficulty)}12`, border: `1px solid ${diffColor(q.difficulty)}33`, padding: "2px 8px", borderRadius: 5 }}>{q.difficulty}</span>}
                        {q.topic && <span style={{ fontSize: 10, color: "#999", background: "#f5f5f5", border: "1px solid #eee", padding: "2px 8px", borderRadius: 5 }}>{clean(q.topic)}</span>}
                      </div>
                      <MathHtml
                        stripOptions
                        style={{ fontSize: 13.5, color: "#333", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                        html={q.question}
                      />
                    </div>
                    {/* Arrow */}
                    <svg style={{ flexShrink: 0, marginTop: 6 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M12 5l7 7-7 7"/></svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Practice view ────────────────────────────────────────────────────────────
function PracticeView({
  subject, chapter, topic, exam, onExit, startAt,
  bookmarks, onToggleBookmark,
}: {
  subject: string; chapter: string | null; topic: string | null; exam: string;
  onExit: () => void; startAt?: number;
  bookmarks: Record<string, Question>;
  onToggleBookmark: (q: Question) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [numInput, setNumInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [checking, setChecking] = useState(false); // waiting on the submit round-trip
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showExp, setShowExp] = useState(false);
  // Reveal data comes from the server AFTER submitting (never pre-loaded → no answer leak)
  const [revealIndex, setRevealIndex] = useState<number | null>(null);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const [revealExp, setRevealExp] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<any[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const sr = await fetch("/api/sessions/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, chapter, topic }) });
        if (sr.ok) { const d = await sr.json(); setSessionId(d.sessionId); }
        let url = `/api/questions?subject=${encodeURIComponent(subject)}`;
        if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
        if (topic) url += `&topic=${encodeURIComponent(topic)}`;
        const qr = await fetch(url);
        const all: Question[] = qr.ok ? ((await qr.json()).questions || []) : [];
        // If startAt is set, start from that question and go to end (no random)
        // Otherwise shuffle and pick 10 for a quick session
        setQuestions(startAt != null && startAt >= 0 ? all.slice(startAt) : all.sort(() => 0.5 - Math.random()).slice(0, 10));
      } catch { setQuestions([]); } finally { setLoading(false); }
    })();
  }, [subject, chapter, topic]);

  useEffect(() => {
    if (!loading && !answered && questions.length > 0 && cur < questions.length) {
      timerRef.current = setInterval(() => setTimeSpent(p => p + 1), 1000);
    } else { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [loading, answered, cur, questions]);

  const checkAnswer = async () => {
    const q = questions[cur];
    setAnswered(true);
    setChecking(true);
    // Server is authoritative for correctness. MCQ → send the option LETTER (A/B/C/D),
    // numerical → send the typed value, both via `selectedOption` (the field the API reads).
    const selectedOption = q.question_type === "numerical"
      ? numInput.trim()
      : (selected != null ? String.fromCharCode(65 + selected) : "");
    try {
      const res = await fetch("/api/attempts/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: q.id, timeTakenMs: timeSpent * 1000, selectedOption }),
      });
      const d = res.ok ? await res.json() : null;
      const isCorrect = !!d?.isCorrect;
      setCorrect(isCorrect);
      setRevealIndex(d?.correctIndex ?? null);
      setRevealAnswer(d?.correctOption ?? null);
      setRevealExp(d?.explanation ?? null);
      histRef.current[cur] = { selected, numInput, correct: isCorrect, revealIndex: d?.correctIndex ?? null, revealAnswer: d?.correctOption ?? null, revealExp: d?.explanation ?? null };
      setPracticeAnswers(p => [...p, { questionId: q.id, topic: q.topic, correct: isCorrect, time: timeSpent }]);
    } catch {
      setCorrect(false);
      histRef.current[cur] = { selected, numInput, correct: false, revealIndex: null, revealAnswer: null, revealExp: null };
    } finally {
      setChecking(false);
    }
  };

  // Per-question snapshots so Previous/Next can revisit answered questions
  // without re-submitting attempts.
  const histRef = useRef<Record<number, { selected: number | null; numInput: string; correct: boolean | null; revealIndex: number | null; revealAnswer: string | null; revealExp: string | null }>>({});
  const loadIdx = (idx: number) => {
    const h = histRef.current[idx];
    setSelected(h?.selected ?? null);
    setNumInput(h?.numInput ?? "");
    setAnswered(!!h);
    setCorrect(h?.correct ?? null);
    setRevealIndex(h?.revealIndex ?? null);
    setRevealAnswer(h?.revealAnswer ?? null);
    setRevealExp(h?.revealExp ?? null);
    setShowExp(false);
    setTimeSpent(0);
    setCur(idx);
  };
  const nextQ = () => { if (!checking) loadIdx(cur + 1); };
  const prevQ = () => { if (!checking && cur > 0) loadIdx(cur - 1); };
  const q = questions[cur];

  const OR = "#D4780A";
  const OR_SOFT = "rgba(212,120,10,0.07)";
  const OR_MID  = "rgba(212,120,10,0.28)";

  // ── Render ──
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg,#FCEFDC 0%,#FBF5EB 46%,#F7E6D2 100%)", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", position: "relative", overflowX: "hidden" }}>
      {/* ── Top bar ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, height: 52, background: "rgba(255,253,248,0.88)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,120,10,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onExit} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 500, color: "#6b6b6b", padding: "4px 0" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>Back
          </button>
          <span style={{ color: "rgba(0,0,0,0.12)" }}>|</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: OR }}>{subject}</span>
          {chapter && <><span style={{ color: "rgba(0,0,0,0.2)", fontSize: 12 }}>/</span><span style={{ fontSize: 12, color: "#6b6b6b" }}>{chapter}</span></>}
          {topic   && <><span style={{ color: "rgba(0,0,0,0.2)", fontSize: 12 }}>/</span><span style={{ fontSize: 12, color: "#0e0e0e", fontWeight: 600 }}>{clean(topic)}</span></>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {!loading && questions.length > 0 && cur < questions.length && (
            <span style={{ fontSize: 11.5, fontWeight: 500, color: OR, background: "rgba(212,120,10,0.08)", padding: "4px 11px", borderRadius: 20, letterSpacing: "0.04em" }}>
              {cur+1} / {questions.length}
            </span>
          )}
          <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", color: "#b0a08a", textTransform: "uppercase" }}>{exam.toUpperCase()}</span>
        </div>
      </header>

      {/* ── Main content ── */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "76px 24px 48px" }}>

        {/* LOADING */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, border: `3px solid rgba(212,120,10,0.15)`, borderTopColor: OR, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <p style={{ fontSize: 13.5, color: "#b0b0b0", fontWeight: 400 }}>Loading questions…</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && questions.length === 0 && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 44, marginBottom: 14 }}>🔍</p>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0e0e0e", marginBottom: 8 }}>No Questions Found</h3>
            <p style={{ fontSize: 14, color: "#8a8a8a", marginBottom: 28 }}>Try a different chapter or topic.</p>
            <button onClick={onExit} style={{ background: OR, color: "#fff", border: "none", borderRadius: 12, padding: "11px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back</button>
          </div>
        )}

        {/* SESSION COMPLETE */}
        {!loading && questions.length > 0 && cur >= questions.length && (() => {
          const c   = practiceAnswers.filter(a => a.correct).length;
          const tot = practiceAnswers.length;
          const pct = tot ? Math.round(c/tot*100) : 0;
          return (
            <div style={{ width: "100%", maxWidth: 680 }}>
              <PracticeEndEffect sessionId={sessionId} answers={practiceAnswers} />
              {/* floating result card */}
              <div style={{ background: "rgba(255,251,246,0.92)", border: "1px solid rgba(255,165,0,0.12)", borderRadius: 28, padding: "48px 52px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85),0 8px 28px rgba(200,110,10,0.07),0 32px 72px rgba(0,0,0,0.07)", backdropFilter: "blur(2px)", animation: "pvCardFloat 7s ease-in-out infinite" }}>
                <h2 style={{ fontSize: 26, fontWeight: 600, color: "#0e0e0e", textAlign: "center", marginBottom: 8 }}>Session Complete</h2>
                <p style={{ textAlign: "center", color: "#6b6b6b", fontSize: 14, marginBottom: 32 }}>Here's how you did</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 14, marginBottom: 28 }}>
                  {([["Accuracy", `${pct}%`, OR], ["Correct", `${c}/${tot}`, "#0e0e0e"], ["Time", fmt(practiceAnswers.reduce((a,b)=>a+b.time,0)), "#0e0e0e"]] as [string,string,string][]).map(([l,v,col]) => (
                    <div key={l} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", color: "#b0b0b0", textTransform: "uppercase", marginBottom: 8 }}>{l}</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: col }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                  {practiceAnswers.map((a,i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 18px", borderTop: i>0?"1px solid rgba(0,0,0,0.06)":"none", fontSize: 13 }}>
                      <span style={{ color: "#6b6b6b" }}>{clean(a.topic)}</span>
                      <span style={{ fontWeight: 600, color: a.correct?"#16a34a":"#dc2626", fontSize: 12 }}>{a.correct ? "✓ Correct" : "✕ Wrong"}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={onExit} style={{ flex: 1, background: "#fff", border: "1px solid rgba(0,0,0,0.1)", color: "#0e0e0e", borderRadius: 14, padding: "13px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>← Back to Chapters</button>
                  <button onClick={() => { histRef.current = {}; setCur(0); setSelected(null); setNumInput(""); setAnswered(false); setCorrect(null); setShowExp(false); setRevealIndex(null); setRevealAnswer(null); setRevealExp(null); setPracticeAnswers([]); setTimeSpent(0); setQuestions(qq=>[...qq].sort(()=>0.5-Math.random())); }} style={{ flex: 1, background: OR, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Try Again →</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* QUESTION CARD */}
        {!loading && questions.length > 0 && cur < questions.length && (
          <div style={{ width: "100%", maxWidth: 940 }}>
            {/* Elevated paper card so the question stands out from the page background */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(212,120,10,0.16)", borderRadius: 24, padding: "clamp(24px, 4vw, 44px)", boxShadow: "0 24px 60px -28px rgba(150,100,30,0.35), 0 3px 10px rgba(120,80,20,0.06)" }}>

              {/* header row: Q number + source | timer | bookmark */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "start", gap: 16, marginBottom: 30 }}>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "#2E2620", letterSpacing: "0.01em" }}>Q {cur + 1}</div>
                  <div style={{ fontSize: 13, color: "#8C7D6E", marginTop: 5 }}>
                    {q?.exam ? q.exam.toUpperCase().replace(/-/g, " ") : "JEE"}{q?.year ? ` ${q.year}` : ""}
                    {q?.difficulty ? ` · ${q.difficulty[0].toUpperCase()}${q.difficulty.slice(1)}` : ""}
                    {q?.question_type === "numerical" ? " · Numerical" : ""}
                  </div>
                </div>
                {/* timer pill (center) */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1.5px dashed rgba(212,120,10,0.5)", borderRadius: 999, padding: "7px 17px", color: "#C7600F", fontSize: 14.5, fontWeight: 600, fontVariantNumeric: "tabular-nums", background: "rgba(212,120,10,0.05)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  {fmt(timeSpent)}
                </div>
                {/* bookmark (right) */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {q && (
                    <button onClick={() => onToggleBookmark(q)} aria-label="Bookmark question"
                      style={{ width: 42, height: 42, borderRadius: 11, border: "1px solid rgba(120,85,30,0.2)", background: "#FBF7EF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarks[q.id] ? OR : "none"} stroke={bookmarks[q.id] ? OR : "#b0b0b0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* question text */}
              <MathHtml stripOptions style={{ fontSize: 19.5, fontWeight: 500, lineHeight: 1.75, color: "#1F1A13", letterSpacing: "-0.005em", marginBottom: 36, textWrap: "pretty" } as React.CSSProperties}
                html={q?.question || ""} />

              {/* options or numerical */}
              {q?.question_type === "numerical" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#8C7D6E", letterSpacing: "0.04em", textTransform: "uppercase" }}>Enter your answer</p>
                  <input type="text" disabled={answered} placeholder="e.g. 4, −1.5" value={numInput} onChange={e => setNumInput(e.target.value)}
                    style={{ maxWidth: 320, padding: "16px 20px", borderRadius: 12, border: `1.5px solid ${answered && correct != null ? (correct ? "#16a34a" : "#dc2626") : "rgba(0,0,0,0.1)"}`, background: answered && correct != null ? (correct ? "rgba(22,163,74,0.05)" : "rgba(220,38,38,0.05)") : "#fff", color: "#0e0e0e", fontSize: 16, fontFamily: "monospace", outline: "none", transition: "border-color .2s, background .2s" }} />
                  {answered && revealAnswer != null && <p style={{ fontSize: 13, color: "#6b6b6b" }}>Correct answer: <span style={{ color: "#16a34a", fontWeight: 600 }}>{revealAnswer}</span></p>}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
                  {q?.options?.map((opt, i) => {
                    // Colors only change once the server verdict is in — until then the
                    // selection stays orange (no red→green flash while the request runs).
                    const resolved = answered && !checking && (revealIndex != null || correct != null);
                    const sel = selected === i, ok = resolved && revealIndex === i, wrong = resolved && sel && !ok;
                    let bg  = "#FBF7EF", brd = "rgba(120,85,30,0.16)", col = "#2E2620";
                    let bdgBrd = "rgba(120,85,30,0.25)", bdgCol = "#7a6a55", bdgBg = "#fff";
                    if (!resolved && sel) { bg = "rgba(212,120,10,0.06)"; brd = "rgba(212,120,10,0.55)"; bdgBrd = OR; bdgCol = "#fff"; bdgBg = OR; }
                    if (ok)    { bg = "rgba(22,163,74,0.07)";  brd = "rgba(22,163,74,0.5)";  col = "#14532d"; bdgBrd = "#16a34a"; bdgCol = "#fff"; bdgBg = "#16a34a"; }
                    if (wrong) { bg = "rgba(220,38,38,0.06)";  brd = "rgba(220,38,38,0.45)"; col = "#7f1d1d"; bdgBrd = "#dc2626"; bdgCol = "#fff"; bdgBg = "#dc2626"; }
                    if (resolved && !ok && !wrong) { col = "#b0b0b0"; bdgCol = "#b0b0b0"; }
                    return (
                      <button key={i} disabled={answered} onClick={() => setSelected(i)}
                        style={{ display: "flex", alignItems: "center", gap: 16, padding: "22px 22px", background: bg, border: `1px solid ${brd}`, borderRadius: 13, cursor: answered ? "default" : "pointer", textAlign: "left", transition: "transform .18s,border-color .18s,background .18s", width: "100%", minHeight: 76 }}
                        onMouseEnter={e => { if (!answered && selected !== i) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor="rgba(212,120,10,0.4)"; e.currentTarget.style.boxShadow="0 8px 20px -12px rgba(212,120,10,0.3)"; } }}
                        onMouseLeave={e => { if (!answered && selected !== i) { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="rgba(120,85,30,0.16)"; e.currentTarget.style.boxShadow=""; } }}>
                        {/* letter badge */}
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${bdgBrd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, color: bdgCol, background: bdgBg, flexShrink: 0, transition: "border-color .18s,color .18s,background .18s" }}>
                          {"ABCDE"[i]}
                        </div>
                        {/* option text */}
                        <MathHtml style={{ flex: 1, fontSize: 16, lineHeight: 1.55, color: col, padding: "2px 0" }}
                          html={opt} />
                        {/* correct tick after answer */}
                        {answered && ok && (
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,9 6.5,13 13,4"/></svg>
                          </div>
                        )}
                        {/* wrong cross */}
                        {answered && wrong && (
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* explanation toggle */}
              {answered && revealExp && (
                <div style={{ marginTop: 22 }}>
                  <button onClick={() => setShowExp(p => !p)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", color: "#6b6b6b", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                    {showExp ? "Hide explanation ▲" : "Show explanation ▼"}
                  </button>
                </div>
              )}

              {/* ── Explanation panel ── */}
              {showExp && revealExp && (
                <div style={{ marginTop: 14, background: "#FBF7EF", border: "1px solid rgba(212,120,10,0.22)", borderRadius: 14, padding: "26px 30px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>📝 Explanation</p>
                  <MathHtml className="pv-exp" html={revealExp} />
                </div>
              )}

              {/* ── Bottom bar: Previous | Check Answer | Next ── */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 48, flexWrap: "wrap" }}>
                <button disabled={cur === 0} onClick={prevQ}
                  style={{ minWidth: 150, padding: "14px 30px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: cur === 0 ? "#c4c4c4" : "#6b6b6b", fontSize: 14, fontWeight: 600, cursor: cur === 0 ? "default" : "pointer", opacity: cur === 0 ? 0.6 : 1, transition: "background .18s" }}>
                  Previous
                </button>
                <button
                  disabled={answered || (q?.question_type === "numerical" ? !numInput.trim() : selected === null)}
                  onClick={checkAnswer}
                  style={(() => {
                    const off = answered || (q?.question_type === "numerical" ? !numInput.trim() : selected === null);
                    return { minWidth: 190, padding: "14px 34px", borderRadius: 12, border: "none", background: checking ? "linear-gradient(120deg,#F2A52A,#E0701E)" : off ? "rgba(0,0,0,0.06)" : "linear-gradient(120deg,#F2A52A,#E0701E)", color: checking ? "#fff" : off ? "#b0b0b0" : "#fff", fontSize: 14, fontWeight: 700, cursor: off ? "default" : "pointer", boxShadow: off && !checking ? "none" : "0 10px 24px -10px rgba(224,112,30,0.7)", transition: "background .18s,color .18s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 };
                  })()}>
                  {checking && <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin .7s linear infinite", flexShrink: 0 }} />}
                  {checking ? "Checking…" : "Check Answer"}
                </button>
                <button onClick={nextQ}
                  style={{ minWidth: 150, padding: "14px 30px", borderRadius: 12, border: "1px solid rgba(212,120,10,0.35)", background: "#fff", color: "#C7600F", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,120,10,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                  {cur + 1 < questions.length ? "Next" : "Finish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pvCardFloat { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-10px); } }
        /* Explanation typography — readable prose + breathing room around formulas */
        .pv-exp {
          font-size: 15.5px;
          line-height: 2;
          color: #3A2E26;
          word-spacing: 0.02em;
          overflow-x: auto;
        }
        .pv-exp p { margin: 0 0 14px; }
        .pv-exp p:last-child { margin-bottom: 0; }
        .pv-exp b, .pv-exp strong { color: #2E2620; }
        .pv-exp sup, .pv-exp sub { line-height: 0; }
        .pv-exp mjx-container {
          margin: 3px 2px;
          font-size: 108% !important;
          vertical-align: middle;
        }
        .pv-exp mjx-container[display="true"] { margin: 14px 0; }
        /* Question + option math: consistent inline spacing */
        mjx-container { padding: 1px 0; }
      `}</style>
    </div>
  );
}

// ─── Screen 1: Exam Selection ─────────────────────────────────────────────────
function ExamSelect({ streakDays, onSelect }: { streakDays: number; onSelect: (exam: string) => void }) {
  const { user, isLoaded } = useUser();
  const initial = isLoaded && user?.firstName ? user.firstName[0].toUpperCase() : "A";

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: T.font, background: T.bg, color: T.ink, animation: "screenIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
      <div style={{ position: "absolute", top: -120, left: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,.22), transparent 70%)", animation: "blobFloat 14s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -140, right: -60, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,179,71,.30), transparent 70%)", animation: "blobFloat 18s ease-in-out infinite reverse", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", right: "22%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,138,61,.18), transparent 70%)", animation: "blobFloat 22s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "28px 40px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>PA<span style={{ color: T.brand500 }}>P</span>ER</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 999, padding: "7px 13px" }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{streakDays}</div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Day Streak</div>
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.brandGrad, border: 0, borderRadius: 999, padding: "7px 13px", boxShadow: "0 6px 18px rgba(255,107,0,.28)" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>Practice Mode</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.9)", textTransform: "uppercase", letterSpacing: 0.4 }}>JEE · NEET</div>
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#FFB347,#FF6B00)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>{initial}</div>
          </div>
        </header>

        <div style={{ textAlign: "center", marginTop: 54, animation: "fadeUp .6s cubic-bezier(.34,1.56,.64,1) both" }}>
          <h1 style={{ fontSize: 52, lineHeight: 1.08, fontWeight: 800, letterSpacing: -1.5, margin: 0, color: T.ink }}>
            Choose Your Exam,<br />Begin Your{" "}
            <span style={{ background: T.brandGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Mastery!</span>
          </h1>
          <p style={{ color: T.muted, fontSize: 16, margin: "16px 0 0", fontWeight: 500 }}>
            Thousands of PYQs. Endless Practice. One Goal — Your Success.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, maxWidth: 760, margin: "44px auto 0" }}>
          {/* JEE */}
          <article onClick={() => onSelect("jee")} style={{ position: "relative", borderRadius: 22, overflow: "hidden", background: "linear-gradient(160deg,#FFE2CC,#FFD0A8)", border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 14px 40px rgba(255,107,0,.18)", cursor: "pointer", transition: "transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-10px) scale(1.015)"; e.currentTarget.style.boxShadow = "0 26px 60px rgba(255,107,0,.32)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(255,107,0,.18)"; }}>
            <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2, background: "rgba(255,255,255,.85)", backdropFilter: "blur(8px)", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: T.brand600, textTransform: "uppercase", letterSpacing: 0.5 }}>Most Popular</div>
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#FF8A3D,#FF6B00 60%,#E2540B)" }}>
              <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.4),transparent 70%)" }} />
              <svg width="92" height="92" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", filter: "drop-shadow(0 8px 16px rgba(194,65,12,.4))" }}>
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
            </div>
            <div style={{ padding: "22px 22px 24px" }}>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, color: T.ink }}>JEE</div>
              <div style={{ color: "#7c4a2a", fontSize: 14, fontWeight: 600, marginTop: 2 }}>Crack JEE Main &amp; Advanced</div>
            </div>
          </article>

          {/* NEET */}
          <article onClick={() => onSelect("neet")} style={{ position: "relative", borderRadius: 22, overflow: "hidden", background: "linear-gradient(160deg,#E6F4EA,#D2EBDA)", border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 14px 40px rgba(22,163,74,.14)", cursor: "pointer", transition: "transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-10px) scale(1.015)"; e.currentTarget.style.boxShadow = "0 26px 60px rgba(22,163,74,.26)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(22,163,74,.14)"; }}>
            <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2, background: "rgba(255,255,255,.85)", backdropFilter: "blur(8px)", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: T.green700, textTransform: "uppercase", letterSpacing: 0.5 }}>Medical Path</div>
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#5FBF7E,#2E9E5B 60%,#16834A)" }}>
              <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.4),transparent 70%)" }} />
              <svg width="92" height="92" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", filter: "drop-shadow(0 8px 16px rgba(22,131,74,.4))" }}>
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>
              </svg>
            </div>
            <div style={{ padding: "22px 22px 24px" }}>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, color: T.ink }}>NEET</div>
              <div style={{ color: "#357a52", fontSize: 14, fontWeight: 600, marginTop: 2 }}>Crack NEET UG</div>
            </div>
          </article>
        </div>
      </div>

      <style>{`
        @keyframes blobFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(36px,-28px) scale(1.12)}}
        @keyframes screenIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
      `}</style>
    </div>
  );
}

// ─── Screen 2: App Shell ──────────────────────────────────────────────────────
function AppShell({
  exam, streakDays, attemptsCount, accuracy, timeStr, loadingStats,
  onPractice, onShowList, bookmarks, onToggleBookmark, onExamChange,
  filterSort, onFilterSortChange,
  filterYears, onFilterYearsChange,
  filterDifficulty, onFilterDifficultyChange,
  filterLevel, onFilterLevelChange,
}: {
  exam: string;
  streakDays: number; attemptsCount: number; accuracy: number; timeStr: string; loadingStats: boolean;
  onPractice: (subject: string, chapter: string | null, topic: string | null) => void;
  onShowList: (subject: string, chapter: string | null, topic: string | null) => void;
  bookmarks: Record<string, Question>;
  onToggleBookmark: (q: Question) => void;
  onExamChange: (e: string) => void;
  filterSort: "newest"|"oldest";
  onFilterSortChange: (v: "newest"|"oldest") => void;
  filterYears: number[];
  onFilterYearsChange: (v: number[]) => void;
  filterDifficulty: string[];
  onFilterDifficultyChange: (v: string[]) => void;
  filterLevel: string;
  onFilterLevelChange: (v: string) => void;
}) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const initial  = isLoaded && user?.firstName ? user.firstName[0].toUpperCase() : "A";
  const firstName = isLoaded ? (user?.firstName || "Student") : "…";

  const subjects = exam === "neet" ? SUBJECTS_NEET : SUBJECTS_JEE;
  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  const [activeNav, setActiveNav] = useState("Home");
  const [navOpen, setNavOpen] = useState(false); // mobile sidebar drawer
  const [pyqType, setPyqType] = useState<"all" | "topic">("all");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [signals, setSignals] = useState<WeaknessSignal[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [hasNewAnalysis, setHasNewAnalysis] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);

  useEffect(() => {
    setLoadingChapters(true); setShowAll(false); setSelectedChapter(null); setPyqType("all");
    fetch(`/api/chapters?subject=${encodeURIComponent(activeSubject)}`)
      .then(r => r.ok ? r.json() : null).then(d => setChapters(d?.chapters || [])).catch(() => {}).finally(() => setLoadingChapters(false));
  }, [activeSubject]);

  useEffect(() => {
    fetch("/api/weakness").then(r => r.ok ? r.json() : null).then(d => {
      const sigs: WeaknessSignal[] = d?.signals || [];
      setSignals(sigs);
      if (sigs.length > 0) {
        const latest = sigs.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
        const lastSeen = localStorage.getItem("weakness_last_seen");
        if (!lastSeen || new Date(latest.createdAt) > new Date(lastSeen)) {
          setHasNewAnalysis(true);
        }
      }
    }).catch(() => {});
  }, []);

  function getChapterMastery(name: string): number | null {
    const sig = signals.find(s => s.conceptName?.toLowerCase().includes(name.toLowerCase().split(" ")[0]) || name.toLowerCase().includes((s.conceptName || "").toLowerCase().split(" ")[0]));
    if (!sig || sig.masteryScore == null) return null;
    return ambiguousToPercent(sig.masteryScore);
  }
  // Always return static difficulty; weakness signal can upgrade Easy→Hard
  function getChapterDiff(name: string): "Easy" | "Medium" | "Hard" {
    const base = getStaticDifficulty(name);
    const sig = signals.find(s => s.conceptName?.toLowerCase().includes(name.toLowerCase().split(" ")[0]));
    if (sig && (sig.severity === "CRITICAL" || sig.severity === "HIGH") && base !== "Hard") return "Hard";
    return base;
  }

  const displayed = showAll ? chapters : chapters.slice(0, 4);

  const subjectIcon = (s: string) => {
    if (s === "Physics")     return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    if (s === "Chemistry")   return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    if (s === "Mathematics") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    if (s === "Botany")      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>;
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
  };

  // ── sidebar nav handler ───────────────────────────────────────────────────
  function handleNav(label: string) {
    setNavOpen(false);
    if (label === "Analytics") { router.push("/dashboard"); return; }
    setActiveNav(label);
  }

  // ── main content based on activeNav ──────────────────────────────────────
  function renderMain() {
    if (activeNav === "Mock Tests") {
      return <ComingSoon title="Mock Tests" emoji="🧪" desc="Full-length timed mock exams with real JEE & NEET patterns — landing soon. Keep practising PYQs in the meantime!" />;
    }
    if (activeNav === "Leaderboard") {
      return <ComingSoon title="Leaderboard" emoji="🏆" desc="Compete with thousands of JEE & NEET aspirants across India. Rankings, streaks, and weekly battles — launching soon!" />;
    }
    if (activeNav === "Bookmarks") {
      return (
        <BookmarksPage
          bookmarks={bookmarks}
          onPracticeBookmark={q => onPractice(q.subject, q.chapter, q.topic)}
          onRemove={id => onToggleBookmark({ id } as Question)}
        />
      );
    }
    if (activeNav === "Settings") {
      return <SettingsPage exam={exam} onExamChange={onExamChange} />;
    }

    // Home — chapter + PYQ selection
    return (
      <>
        {/* Welcome */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26, gap: 24 }}>
          <div>
            <div style={{ color: T.muted, fontSize: 15, fontWeight: 500 }}>Welcome back, {firstName}! 👋</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, margin: "6px 0 0", color: T.ink }}>Let's Practice &amp; Improve</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 10, background: T.brandGrad, border: "none", borderRadius: 16, padding: "14px 24px", cursor: "pointer", boxShadow: "0 8px 24px rgba(255,107,0,.35)", flexShrink: 0, transition: "transform .2s, box-shadow .2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(255,107,0,.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,107,0,.35)"; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: -0.2 }}>See Your Analysis</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          {subjects.map(s => {
            const active = s === activeSubject;
            return (
              <button key={s} onClick={() => setActiveSubject(s)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 14, cursor: "pointer", fontWeight: 600, fontSize: 14, background: active ? T.brandGrad : T.surface, border: `1px solid ${active ? "transparent" : T.line}`, color: active ? "#fff" : T.ink, boxShadow: active ? T.shadowBrand : "none", transition: "all .25s cubic-bezier(.34,1.56,.64,1)" }}>
                <span style={{ color: active ? "#fff" : T.brand500 }}>{subjectIcon(s)}</span>{s}
              </button>
            );
          })}
        </div>

        {/* Chapters */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 30 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{activeSubject} Chapters</h2>
          {chapters.length > 4 && <button onClick={() => setShowAll(p => !p)} style={{ color: T.brand500, fontWeight: 600, fontSize: 14, cursor: "pointer", background: "none", border: "none" }}>{showAll ? "Show Less" : "View All"}</button>}
        </div>

        {loadingChapters ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 18, marginTop: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 22, padding: 18, height: 190, animation: "pulse 1.5s ease-in-out infinite" }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, background: T.line, marginBottom: 14 }} />
                <div style={{ width: "70%", height: 14, background: T.line, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: "45%", height: 11, background: T.line, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 14 }}>No chapters for {activeSubject}.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 18, marginTop: 16 }}>
            {displayed.map((ch, i) => {
              const mastery = getChapterMastery(ch.name);
              const diff: "Easy" | "Medium" | "Hard" = getChapterDiff(ch.name);
              const isSelected = selectedChapter?.name === ch.name;
              return (
                <article key={ch.name}
                  onClick={() => { setSelectedChapter(isSelected ? null : ch); setPyqType("all"); }}
                  style={{ position: "relative", background: T.surface, border: `2px solid ${isSelected ? T.brand500 : T.line}`, borderRadius: 22, padding: 18, cursor: "pointer", transition: "transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease, border-color .15s", animation: `fadeUp .5s ease both`, animationDelay: `${i * 0.06}s`, boxShadow: isSelected ? `0 0 0 4px rgba(255,107,0,0.12), ${T.shadowHover}` : "none" }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = T.shadowHover; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; } }}>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", background: T.brand500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                  <div style={{ width: 52, height: 52, borderRadius: 15, background: isSelected ? `rgba(255,107,0,0.15)` : T.brand50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getChapterIcon(ch.name)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 14, minHeight: 40, color: isSelected ? T.brand600 : T.ink }}>{ch.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.muted, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {ch.questionCount != null ? ch.questionCount.toLocaleString() : "—"} PYQs
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                    <div>
                      <DiffBars diff={diff} />
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 5, color: DIFF[diff as keyof typeof DIFF].color }}>{diff}</div>
                    </div>
                    {mastery != null && <MasteryRing pct={mastery} size={46} />}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!selectedChapter && !loadingChapters && chapters.length > 0 && (
          <p style={{ marginTop: 10, fontSize: 13, color: T.muted, fontStyle: "italic" }}>↑ Select a chapter to enable practice modes</p>
        )}

        {/* PYQ type */}
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "32px 0 3px" }}>Choose PYQ Type</h2>
        <div style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>
          {selectedChapter ? `Practicing: ${selectedChapter.name}` : "Select a chapter above first"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14, maxWidth: 720 }}>
          {[
            { key: "all",   label: "All PYQs",        sub: "All questions from this chapter", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
            { key: "topic", label: "Topic-wise PYQs", sub: "Practice a specific topic",        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
          ].map(card => {
            const active  = pyqType === card.key && !!selectedChapter;
            const disabled = !selectedChapter;
            return (
              <div key={card.key}
                onClick={() => {
                  if (disabled) return;
                  setPyqType(card.key as "all" | "topic");
                  if (card.key === "all") onShowList(activeSubject, selectedChapter!.name, null);
                }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 18, cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${active ? "transparent" : T.line}`, background: disabled ? "#F8F4F0" : active ? T.brandGrad : T.surface, color: disabled ? T.faint : active ? "#fff" : T.ink, transition: "all .25s", boxShadow: active ? "0 10px 26px rgba(255,107,0,.28)" : "none", opacity: disabled ? 0.55 : 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: disabled ? T.line : active ? "rgba(255,255,255,.22)" : T.brand50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: disabled ? T.faint : active ? "#fff" : T.brand500 }}>{card.icon}</span>
                </div>
                <div>
                  <b style={{ fontWeight: 700, fontSize: 15 }}>{card.label}</b>
                  <div><small style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>{disabled ? "Select a chapter first" : card.sub}</small></div>
                </div>
              </div>
            );
          })}
        </div>

        {pyqType === "topic" && selectedChapter && (
          <div style={{ marginTop: 14, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: "16px 20px", animation: "slideDown .25s ease both" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 12 }}>
              Topics in <span style={{ color: T.brand500 }}>{selectedChapter.name}</span>
            </p>
            {selectedChapter.topics.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted }}>No sub-topics available — practising all questions in this chapter.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {selectedChapter.topics.map(t => (
                  <button key={t} onClick={() => onShowList(activeSubject, selectedChapter.name, t)}
                    style={{ fontSize: 13, fontWeight: 600, color: T.ink, background: T.brand50, border: `1.5px solid ${T.brand200}`, borderRadius: 10, padding: "9px 16px", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.brand500; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = T.brand500; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.brand50; e.currentTarget.style.color = T.ink; e.currentTarget.style.borderColor = T.brand200; }}>
                    {clean(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress strip */}
        <div style={{ marginTop: 26, background: "linear-gradient(160deg,#FFF8F3,#FFEFE2)", border: `1px solid ${T.line}`, borderRadius: 18, padding: "20px 24px" }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, margin: "0 0 14px" }}>Your Overall Progress</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16 }}>
            {([
              {
                ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.brand500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                bg: T.brand50, color: T.brand500,
                val: loadingStats ? "—" : String(attemptsCount),
                label: "Questions Solved",
              },
              {
                ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green500} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                bg: "#E6F4EA", color: T.green500,
                val: loadingStats ? "—" : `${accuracy}%`,
                label: "Accuracy",
                valColor: attemptsCount > 0 ? (accuracy >= 70 ? T.green500 : accuracy >= 40 ? T.amber500 : T.red500) : T.ink,
              },
              {
                ico: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.brand500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
                bg: T.brand50, color: T.brand500,
                val: loadingStats ? "—" : timeStr,
                label: "Time Spent",
              },
              {
                ico: <span style={{ fontSize: 20 }}>🔥</span>,
                bg: T.brand50, color: T.brand500,
                val: loadingStats ? "—" : `${streakDays} day${streakDays !== 1 ? "s" : ""}`,
                label: "Current Streak",
                valColor: streakDays >= 7 ? T.brand500 : streakDays >= 3 ? T.amber500 : T.ink,
              },
            ] as { ico: React.ReactNode; bg: string; color: string; val: string; label: string; valColor?: string }[]).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: s.bg, color: s.color, flexShrink: 0 }}>{s.ico}</div>
                <div>
                  <b style={{ fontWeight: 800, fontSize: 20, display: "block", color: s.valColor || T.ink }}>{s.val}</b>
                  <span style={{ fontSize: 11, color: T.muted }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: T.font, color: T.ink, animation: "screenIn .45s ease both" }}>
      {/* Sidebar */}
      {navOpen && <div className="qd-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={`qd-sidebar${navOpen ? " open" : ""}`} style={{ width: 230, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.line}`, padding: "26px 18px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, padding: "0 10px 26px" }}>
          PA<span style={{ color: T.brand500 }}>P</span>ER
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.label === activeNav;
            return (
              <button key={item.label}
                onClick={() => handleNav(item.label)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: isActive ? T.brand50 : "transparent", color: isActive ? T.brand500 : T.muted, textAlign: "left", width: "100%", transition: "background .2s, color .2s" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.brand50; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ color: isActive ? T.brand500 : T.faint }}>{item.icon}</span>
                {item.label}
                {(item.label === "Mock Tests" || item.label === "Leaderboard") && (
                  <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, background: T.brand50, color: T.brand500, border: `1px solid ${T.brand200}`, borderRadius: 6, padding: "2px 6px", letterSpacing: 0.3 }}>SOON</span>
                )}
              </button>
            );
          })}
        </nav>
        {/* Bottom: user + analysis link */}
        <div style={{ marginTop: "auto" }}>
          {isLoaded && user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 14, cursor: "pointer" }}>
              <UserButton />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</span>
            </div>
          )}
          <button onClick={() => router.push("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: T.muted, textAlign: "left", width: "100%" }}
            onMouseEnter={e => { e.currentTarget.style.background = T.brand50; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Analysis Dashboard
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, background: T.bg, overflowY: "auto", position: "relative", color: T.ink }}>
        <div style={{ padding: "24px 34px 80px", maxWidth: 1180 }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="qd-hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation menu" aria-expanded={navOpen}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: "9px 16px", fontWeight: 700, fontSize: 15, cursor: "default" }}>
              {exam.toUpperCase()}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 999, padding: "7px 13px" }}>
                <span style={{ fontSize: 16 }}>🔥</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{loadingStats ? "—" : `${streakDays}`}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>Day Streak</div>
                </div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 999, padding: "7px 13px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.green500} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: T.green500 }}>{loadingStats ? "—" : `${accuracy}%`}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>Accuracy</div>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowNotifPopup(p => !p)}
                  title={hasNewAnalysis ? "New analysis update!" : "Notifications"}
                  style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", background: T.surface, border: `1.5px solid ${hasNewAnalysis ? T.brand500 : T.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .2s" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={hasNewAnalysis ? T.brand500 : T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {hasNewAnalysis && (
                    <span style={{ position: "absolute", top: 2, right: 2, width: 9, height: 9, borderRadius: "50%", background: "#E53E3E", border: "2px solid #FFF8F3", animation: "pulse 1.8s ease-in-out infinite" }} />
                  )}
                </button>

                {showNotifPopup && (
                  <>
                    {/* backdrop */}
                    <div onClick={() => setShowNotifPopup(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
                    {/* popup */}
                    <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 300, background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)", border: `1px solid ${T.line}`, zIndex: 99, overflow: "hidden", animation: "slideDown .18s ease" }}>
                      {/* header */}
                      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: T.ink }}>Notifications</span>
                        {hasNewAnalysis && <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: T.brand500, borderRadius: 20, padding: "2px 8px" }}>1 new</span>}
                      </div>

                      {hasNewAnalysis ? (
                        <div style={{ padding: "16px" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#FFE5CC,#FFD0A0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.brand500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: 13.5, color: T.ink, lineHeight: 1.3 }}>Your analysis is ready</div>
                              <div style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>We've found new weak concepts and root causes from your recent sessions.</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              localStorage.setItem("weakness_last_seen", new Date().toISOString());
                              setHasNewAnalysis(false);
                              setShowNotifPopup(false);
                              router.push("/dashboard");
                            }}
                            style={{ marginTop: 14, width: "100%", padding: "10px", borderRadius: 12, background: T.brandGrad, color: "#fff", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(255,107,0,.3)" }}>
                            See Now →
                          </button>
                          <button
                            onClick={() => setShowNotifPopup(false)}
                            style={{ marginTop: 8, width: "100%", padding: "8px", borderRadius: 12, background: "transparent", color: T.muted, fontWeight: 600, fontSize: 12, border: "none", cursor: "pointer" }}>
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: "28px 16px", textAlign: "center" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>You're all caught up!</div>
                          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>New analysis updates will appear here.</div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#FFB347,#FF6B00)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{initial}</div>
            </div>
          </div>

          {renderMain()}
        </div>

      </main>


      <style>{`
        @keyframes screenIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @keyframes flamePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .qd-hamburger{display:none;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;border:1px solid #eee;background:#fff;color:#6b6b6b;cursor:pointer;flex-shrink:0;}
        .qd-overlay{position:fixed;inset:0;background:rgba(20,12,4,0.4);backdrop-filter:blur(2px);z-index:55;}
        @media (max-width: 880px){
          .qd-sidebar{position:fixed !important;left:0;top:0;z-index:60 !important;transform:translateX(-100%);transition:transform .28s ease;box-shadow:0 18px 60px rgba(40,25,5,0.35);}
          .qd-sidebar.open{transform:translateX(0);}
          .qd-hamburger{display:inline-flex;}
        }
        @media (min-width: 881px){ .qd-overlay{display:none;} }
      `}</style>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function QDContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive everything from the URL — this is the single source of truth so
  // the browser back/forward buttons work correctly.
  const screen: "exam" | "app" | "questionlist" | "practice" = (() => {
    const v = searchParams.get("v");
    if (v === "practice"     && searchParams.get("subject")) return "practice";
    if (v === "questionlist" && searchParams.get("subject")) return "questionlist";
    if (v === "app") return "app";
    return "exam";
  })();

  const practiceSubject = searchParams.get("subject");
  const practiceChapter = searchParams.get("chapter");
  const practiceTopic   = searchParams.get("concept") || searchParams.get("topic");
  const exam            = searchParams.get("exam") || "jee";
  const startAt         = parseInt(searchParams.get("startAt") || "0", 10);

  // ── live stats (refreshed whenever screen changes) ──
  const [streakDays,    setStreakDays]    = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [accuracy,      setAccuracy]      = useState(0);
  const [timeStr,       setTimeStr]       = useState("0h 0m");
  const [loadingStats,  setLoadingStats]  = useState(true);

  // Mark user as signed-in so landing page shows correct button on back-navigation.
  useEffect(() => { try { localStorage.setItem("paper_signed_in", "true"); } catch {} }, []);

  // bookmarks persisted in localStorage
  const [bookmarks, setBookmarks] = useState<Record<string, Question>>(() => {
    try { return JSON.parse(localStorage.getItem("paper_bookmarks") || "{}"); } catch { return {}; }
  });

  const [filterSort, setFilterSort] = useState<"newest"|"oldest">("newest");
  const [filterYears, setFilterYears] = useState<number[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<string[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>("");

  function toggleBookmark(q: Question) {
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[q.id]) delete next[q.id];
      else if (q.question) next[q.id] = q;
      localStorage.setItem("paper_bookmarks", JSON.stringify(next));
      return next;
    });
  }

  // Navigation helpers — each pushes a real history entry
  function goApp(newExam?: string) {
    router.push(`/question_dashboard?v=app&exam=${encodeURIComponent(newExam || exam)}`);
  }
  function goQuestionList(subject: string, chapter: string | null, topic: string | null) {
    const p = new URLSearchParams({ v: "questionlist", exam, subject });
    if (chapter) p.set("chapter", chapter);
    if (topic)   p.set("concept", topic);
    router.push(`/question_dashboard?${p.toString()}`);
  }
  function goPractice(subject: string, chapter: string | null, topic: string | null, at?: number) {
    const p = new URLSearchParams({ v: "practice", exam, subject });
    if (chapter) p.set("chapter", chapter);
    if (topic)   p.set("concept", topic);
    if (at != null) p.set("startAt", String(at));
    router.push(`/question_dashboard?${p.toString()}`);
  }
  useEffect(() => {
    setLoadingStats(true);
    fetch("/api/progress").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      const attempts: any[] = d.attempts || [];
      setAttemptsCount(attempts.length);
      if (attempts.length > 0) {
        const correct = attempts.filter(a => a.isCorrect).length;
        setAccuracy(Math.round(correct / attempts.length * 100));
        const totalSecs = attempts.reduce((acc: number, a: any) => acc + (a.timeSpent || 0), 0);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        setTimeStr(h > 0 ? `${h}h ${m}m` : `${m}m`);
      }
      const dates = [...new Set(attempts.map((a: any) => a.timestamp?.split("T")[0]).filter(Boolean))].sort().reverse() as string[];
      let streak = 0;
      if (dates.length > 0) {
        const today = new Date(Date.now()).toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        // Grace until end of today: the streak holds if the last practice day is
        // today OR yesterday. Anchor from that day and count consecutive days back.
        if (dates[0] === today || dates[0] === yesterday) {
          const anchor = new Date(dates[0] + "T00:00:00Z").getTime();
          for (let i = 0; i < dates.length; i++) {
            const expected = new Date(anchor - i * 86400000).toISOString().split("T")[0];
            if (dates[i] === expected) streak++; else break;
          }
        }
      }
      setStreakDays(streak);
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, [screen]);

  // NEET has no question bank / practice engine / analysis yet — catch every
  // entry point (exam picker, settings toggle, or a direct link with
  // exam=neet) before it reaches an app/practice/questionlist screen built
  // only for JEE data.
  if (exam.toLowerCase() === "neet") {
    return <NeetComingSoon onBackToJee={() => goApp("jee")} />;
  }

  if (screen === "practice" && practiceSubject) {
    return (
      <PracticeView
        subject={practiceSubject} chapter={practiceChapter} topic={practiceTopic} exam={exam}
        startAt={startAt}
        bookmarks={bookmarks} onToggleBookmark={toggleBookmark}
        onExit={() => router.back()}
      />
    );
  }

  if (screen === "questionlist" && practiceSubject) {
    return (
      <QuestionListView
        subject={practiceSubject} chapter={practiceChapter} topic={practiceTopic} exam={exam}
        onBack={() => router.back()}
        onSelectQuestion={at => goPractice(practiceSubject, practiceChapter, practiceTopic, at)}
        filterSort={filterSort} onFilterSortChange={setFilterSort}
        filterYears={filterYears} onFilterYearsChange={setFilterYears}
        filterDifficulty={filterDifficulty} onFilterDifficultyChange={setFilterDifficulty}
        filterLevel={filterLevel} onFilterLevelChange={setFilterLevel}
      />
    );
  }

  if (screen === "app") {
    return (
      <AppShell
        exam={exam}
        streakDays={streakDays} attemptsCount={attemptsCount}
        accuracy={accuracy} timeStr={timeStr} loadingStats={loadingStats}
        bookmarks={bookmarks} onToggleBookmark={toggleBookmark}
        onExamChange={e => goApp(e)}
        onPractice={goPractice}
        onShowList={goQuestionList}
        filterSort={filterSort} onFilterSortChange={setFilterSort}
        filterYears={filterYears} onFilterYearsChange={setFilterYears}
        filterDifficulty={filterDifficulty} onFilterDifficultyChange={setFilterDifficulty}
        filterLevel={filterLevel} onFilterLevelChange={setFilterLevel}
      />
    );
  }

  return (
    <ExamSelect
      streakDays={streakDays}
      onSelect={e => goApp(e)}
    />
  );
}

export default function QuestionDashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8F3" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #FF6B00", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <QDContent />
    </Suspense>
  );
}
