"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface WeaknessSignal {
  id: string;
  conceptId: number;
  conceptName: string;
  signal: string;
  severity: string; // comes lowercase from API: "low" | "medium" | "high" | "critical"
  severityScore: number;
  confidenceScore: number;
  evidence: any;
  insightMessage?: string;
  createdAt: string;
  masteryScore: number | null;
  totalAttempts: number;
  totalCorrect: number;
  dominantErrorType: string | null;
}

interface WeaknessReport {
  text: string;
  generatedAt: string;
}

// Severity normalized to uppercase for lookup
const SEV: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  critical: { bg: "rgba(217,89,75,0.12)",  text: "#C2473A", border: "rgba(217,89,75,0.3)",  label: "Critical", dot: "#C2473A" },
  high:     { bg: "rgba(224,112,30,0.12)", text: "#C7600F", border: "rgba(224,112,30,0.3)", label: "High",     dot: "#E0701E" },
  medium:   { bg: "rgba(196,150,40,0.14)", text: "#B07D1E", border: "rgba(196,150,40,0.3)", label: "Medium",   dot: "#F2A52A" },
  low:      { bg: "rgba(120,90,50,0.08)",  text: "#7A6B5C", border: "rgba(120,90,50,0.18)", label: "Low",      dot: "#B0A192" },
};

const SIGNAL_LABEL: Record<string, string> = {
  root_flaw:    "Root Cause",
  weakness:     "Weak Concept",
  weak_concept: "Weak Concept",
  time_trap:    "Time Trap",
};

function clean(s: string) {
  return s ? s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";
}

function MasteryArc({ pct }: { pct: number }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct < 30 ? "#C2473A" : pct < 55 ? "#D5740E" : "#1F8A5B";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(120,90,50,.12)" strokeWidth="8" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset="0" transform="rotate(-90 36 36)" />
      <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{pct}%</text>
    </svg>
  );
}

function TypewriterText({ text, delay, speed = 16 }: { text: string; delay: number; speed?: number }) {
  const [shown, setShown] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    setShown("");
    ref.current = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length && ref.current) clearInterval(ref.current);
    }, speed);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [started, text, speed]);

  return (
    <span>
      {shown}
      {started && shown.length < text.length && (
        <span style={{ opacity: 0.5, animation: "blink .7s step-end infinite" }}>|</span>
      )}
    </span>
  );
}

function WeaknessCard({ signal, index, visible }: { signal: WeaknessSignal; index: number; visible: boolean }) {
  const router = useRouter();
  const sev = SEV[signal.severity] || SEV.medium;

  function goPractice() {
    // For root_flaw: practice the root concept; otherwise practice the signal's own concept
    const subject = clean(signal.evidence?.subject || "Physics");
    const concept = signal.signal === "root_flaw"
      ? (signal.evidence?.root_concept_name || signal.conceptName)
      : signal.conceptName;
    const p = new URLSearchParams({ v: "questionlist", exam: "jee", subject });
    if (concept) p.set("concept", concept);
    router.push(`/question_dashboard?${p.toString()}`);
  }

  const mastery = signal.masteryScore;

  // Use real insightMessage from backend; only fall back if truly empty
  const insightText = (signal.insightMessage || "").trim() ||
    (mastery != null && mastery < 50
      ? `Mastery at ${mastery}% — below the threshold for consistent performance. Repeated errors suggest a conceptual gap that needs direct attention.`
      : `Error patterns in ${clean(signal.conceptName)} indicate inconsistent understanding across question variants.`);

  const signalLabel = SIGNAL_LABEL[signal.signal] || signal.signal;
  const subject = clean(signal.evidence?.subject || "");

  // For root_flaw signals, show root concept name too
  const rootConceptName = signal.signal === "root_flaw"
    ? clean(signal.evidence?.root_concept_name || "")
    : null;

  // Typewriter starts after the card fades in (index * 350ms) + 300ms buffer
  const twDelay = index * 350 + 300;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(20px)",
      transition: `opacity .45s ease ${index * 0.1}s, transform .45s ease ${index * 0.1}s`,
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(20px) saturate(1.2)",
      WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: 22,
      padding: "24px 28px",
      boxShadow: "0 14px 44px -20px rgba(170,110,45,0.28)",
    }}>

      {/* ── Top row ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          {/* Name + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#2E2620" }}>
              {clean(signal.conceptName)}
            </h3>
            {subject && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7A6B5C", background: "rgba(120,90,50,.1)", padding: "3px 9px", borderRadius: 20 }}>
                {subject}
              </span>
            )}
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .4, padding: "3px 10px", borderRadius: 20, background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
              {sev.label}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(120,90,50,.08)", color: "#8C7D6E", border: "1px solid rgba(120,90,50,.15)" }}>
              {signalLabel}
            </span>
          </div>

          {/* Stats — attempts/correct only (no percentages) */}
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "#8C7D6E" }}>
            {signal.totalAttempts > 0 && (
              <span><b style={{ color: "#3A2E26" }}>{signal.totalAttempts}</b> attempts · <b style={{ color: "#3A2E26" }}>{signal.totalCorrect}</b> correct</span>
            )}
            {signal.dominantErrorType && (
              <span>Error type: <b style={{ color: "#3A2E26" }}>{clean(signal.dominantErrorType)}</b></span>
            )}
          </div>
        </div>
      </div>

      {/* ── Root cause detail (only for root_flaw) ── */}
      {rootConceptName && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 14, background: "rgba(255,237,203,0.6)", border: "1px solid rgba(240,183,72,.3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B97A12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#B97A12", textTransform: "uppercase", letterSpacing: .6 }}>Foundation gap</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#5A3D0A", marginTop: 2 }}>
              {rootConceptName}
            </div>
          </div>
        </div>
      )}

      {/* ── Engine Prediction block (real insightMessage from backend) ── */}
      <div style={{ marginTop: 16, background: "rgba(252,242,226,0.7)", border: "1px solid rgba(240,183,72,.35)", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: sev.dot, flexShrink: 0, animation: visible ? "liveBlip 1.6s ease-in-out infinite" : "none" }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: .8, color: "#B97A12", textTransform: "uppercase" }}>
            Engine Prediction
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 14.5, color: "#5A3D0A", lineHeight: 1.7, fontWeight: 500, whiteSpace: "pre-line" }}>
          {visible ? <TypewriterText text={insightText} delay={twDelay} /> : ""}
        </p>
      </div>

      {/* ── Action ── */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={goPractice}
          style={{ fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 12, background: "linear-gradient(120deg,#F2A52A,#E0701E)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 20px -10px rgba(224,112,30,.8)" }}>
          Practice this →
        </button>
      </div>
    </div>
  );
}

export default function WeaknessPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<WeaknessSignal[]>([]);
  const [report, setReport] = useState<WeaknessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "revealing" | "done">("scanning");
  const [navOpen, setNavOpen] = useState(false); // mobile sidebar drawer

  useEffect(() => {
    fetch("/api/weakness/refresh", { method: "POST" }).catch(() => {}).finally(() =>
    fetch("/api/weakness")
      .then(r => r.ok ? r.json() : { signals: [], report: null })
      .then(data => {
        // De-duplicate: a concept can emit multiple signals (root_flaw + weak_concept +
        // missing_foundation). Show each concept ONCE, keeping the most informative signal.
        const typePriority: Record<string, number> = { root_flaw: 0, missing_foundation: 1, weak_concept: 2, time_trap: 3 };
        const byConcept = new Map<number, WeaknessSignal>();
        for (const s of (data.signals || []) as WeaknessSignal[]) {
          const existing = byConcept.get(s.conceptId);
          if (!existing || (typePriority[s.signal] ?? 9) < (typePriority[existing.signal] ?? 9)) {
            byConcept.set(s.conceptId, s);
          }
        }
        const sigs: WeaknessSignal[] = [...byConcept.values()]
          .sort((a: WeaknessSignal, b: WeaknessSignal) => {
            const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
            return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
          });
        setSignals(sigs);
        if (data.report) setReport(data.report);
        setLoading(false);

        // Brief "scanning" pause then reveal cards one by one
        setTimeout(() => {
          setPhase("revealing");
          sigs.forEach((_, i) => {
            setTimeout(() => {
              setVisibleCount(i + 1);
              if (i === sigs.length - 1) setPhase("done");
            }, i * 350);
          });
          if (sigs.length === 0) setPhase("done");
        }, 900);
      })
      .catch(() => { setLoading(false); setPhase("done"); })
    );
  }, []);

  const glass = "rgba(255,255,255,0.55)";
  const glassBlur = "blur(20px) saturate(1.2)";
  const glassBorder = "1px solid rgba(255,255,255,0.7)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        html,body{margin:0;padding:0;font-family:'Hanken Grotesk',system-ui,sans-serif;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes liveBlip{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
        @keyframes scanShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .nav-btn{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:12px;color:#7C6E60;font-weight:500;font-size:14px;cursor:pointer;transition:background .15s,color .15s;background:transparent;border:none;width:100%;}
        .nav-btn:hover{background:rgba(120,90,50,0.08);color:#D5740E;}
        .nav-btn.active{background:rgba(236,138,67,0.16);color:#D5740E;font-weight:700;}
        .dash-hamburger{display:none;align-items:center;justify-content:center;width:40px;height:40px;border-radius:11px;border:1px solid rgba(255,255,255,0.8);background:rgba(255,255,255,0.5);color:#7C6E60;cursor:pointer;flex-shrink:0;}
        .dash-overlay{position:fixed;inset:0;background:rgba(40,25,10,0.38);backdrop-filter:blur(2px);z-index:55;}
        @media (max-width: 860px){
          .dash-sidebar{position:fixed !important;left:0;top:0;z-index:60 !important;transform:translateX(-100%);transition:transform .28s ease;box-shadow:0 18px 60px rgba(60,35,10,0.4);}
          .dash-sidebar.open{transform:translateX(0);}
          .dash-hamburger{display:inline-flex;}
        }
        @media (min-width: 861px){ .dash-overlay{display:none;} }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "linear-gradient(165deg,#FCEFDC 0%,#FBF5EB 46%,#F7E6D2 100%)" }}>

        {/* BG blobs */}
        <div style={{ position: "fixed", top: -150, right: -70, width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,170,60,.4),rgba(245,170,60,0) 68%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -180, left: 150, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,138,67,.26),rgba(236,138,67,0) 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* SIDEBAR */}
        {navOpen && <div className="dash-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}

        <aside className={`dash-sidebar${navOpen ? " open" : ""}`} style={{ width: 236, flexShrink: 0, position: "relative", zIndex: 2, background: "rgba(255,253,248,0.72)", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, borderRight: "1px solid rgba(255,255,255,0.65)", display: "flex", flexDirection: "column", padding: "22px 16px", height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "4px 10px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 1.5, background: "linear-gradient(118deg,#F4AB2D,#DE6E1C)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", lineHeight: 1 }}>PAPER</div>
            <div style={{ fontSize: 12, color: "#B0A192", fontStyle: "italic", marginTop: 4 }}>We go deeper.</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            {[
              { label: "Overview",      path: "/dashboard",          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg> },
              { label: "Full Weakness", path: "/dashboard/weakness", active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 16l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
              { label: "Practice",      path: "/question_dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> },
            ].map(item => (
              <button key={item.label} className={`nav-btn${(item as any).active ? " active" : ""}`} onClick={() => { setNavOpen(false); router.push(item.path); }}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: "auto", height: "100vh", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "30px clamp(20px,3vw,48px) 80px" }}>

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <button className="dash-hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation menu" aria-expanded={navOpen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              </button>
              <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 12, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#7A6B5C", backdropFilter: "blur(8px)", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: "clamp(20px,2.8vw,26px)", fontWeight: 800, color: "#2E2620", letterSpacing: -0.3 }}>Your Full Weakness Report</h1>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#8C7D6E" }}>Real predictions from our engine based on your attempt patterns.</p>
              </div>
            </div>

            {/* LIVE STATUS BAR */}
            <div style={{ marginBottom: 22, padding: "12px 18px", borderRadius: 14, background: glass, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: loading || phase === "scanning" ? "#F2A52A" : phase === "revealing" ? "#E0701E" : "#1F8A5B",
                animation: phase !== "done" ? "liveBlip 1.2s ease-in-out infinite" : "none",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#5A3D0A" }}>
                {loading
                  ? "Connecting to analysis engine…"
                  : phase === "scanning"
                  ? "Scanning your attempt patterns…"
                  : phase === "revealing"
                  ? `Revealing weakness ${visibleCount} of ${signals.length}…`
                  : signals.length === 0
                  ? "No weaknesses detected yet — keep practising!"
                  : `Analysis complete · ${signals.length} weak area${signals.length !== 1 ? "s" : ""} found`}
              </span>
              {phase === "done" && signals.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#1F8A5B", background: "rgba(31,138,91,.1)", padding: "3px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>✓ Live data</span>
              )}
            </div>

            {/* AI REPORT TEXT (from weakness_reports table — real generated report) */}
            {report && phase === "done" && (
              <div style={{ marginBottom: 22, padding: "22px 26px", borderRadius: 20, background: "linear-gradient(135deg,rgba(255,247,227,0.9),rgba(255,237,203,0.8))", border: "1px solid rgba(240,183,72,.45)", boxShadow: "0 14px 44px -20px rgba(170,110,45,0.28)", animation: "fadeIn .5s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B97A12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: .8, color: "#B97A12", textTransform: "uppercase" }}>AI Weakness Report</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#CDA870", fontWeight: 600 }}>
                    {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14.5, color: "#5A3D0A", lineHeight: 1.75, whiteSpace: "pre-line", fontWeight: 500 }}>
                  {report.text}
                </p>
              </div>
            )}

            {/* SKELETON while loading / scanning */}
            {(loading || phase === "scanning") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: glass, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: glassBorder, borderRadius: 22, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%)", animation: "scanShimmer 1.6s ease-in-out infinite", pointerEvents: "none" }} />
                    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(120,90,50,.1)" }} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ width: "55%", height: 18, borderRadius: 8, background: "rgba(120,90,50,.1)" }} />
                        <div style={{ width: "38%", height: 13, borderRadius: 6, background: "rgba(120,90,50,.07)" }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 18, height: 78, borderRadius: 12, background: "rgba(120,90,50,.07)" }} />
                  </div>
                ))}
              </div>
            )}

            {/* WEAKNESS CARDS — real data */}
            {!loading && phase !== "scanning" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {signals.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: glass, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, borderRadius: 22 }}>
                    <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: "#2E2620", margin: "0 0 8px" }}>No weaknesses detected yet!</h3>
                    <p style={{ color: "#8C7D6E", fontSize: 15, maxWidth: 380, margin: "0 auto 22px" }}>Solve at least 20 questions so our engine can detect your patterns.</p>
                    <button onClick={() => router.push("/question_dashboard")} style={{ padding: "12px 28px", borderRadius: 14, background: "linear-gradient(120deg,#F2A52A,#E0701E)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 12px 26px -10px rgba(224,112,30,.85)" }}>
                      Start Practising →
                    </button>
                  </div>
                ) : signals.map((sig, i) => (
                  <WeaknessCard key={sig.id} signal={sig} index={i} visible={i < visibleCount} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
