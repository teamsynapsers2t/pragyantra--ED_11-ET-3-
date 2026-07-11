"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { ambiguousToPercent } from "@/utils/scale";

interface WeaknessSignal {
  id: string;
  conceptId: number;
  conceptName: string;
  signal: string;
  severity: string;
  severityScore: number;
  confidenceScore: number;
  evidence: any;
  insightMessage?: string;
  createdAt: string;
  masteryScore: number | null;
  totalAttempts: number;
  totalCorrect: number;
}

const clean = (s: string) =>
  s ? s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

// Mastery values reaching this page are on mixed scales (0–1 evidence fields,
// 0–100 masteryScore). ambiguousToPercent is the shared single source of truth.
const pct = (v: number | null | undefined) => ambiguousToPercent(v);

const severityColor = (score: number) => {
  if (score >= 85) return { bg: "rgba(217,89,75,0.12)", text: "#C2473A", border: "rgba(217,89,75,0.3)" };
  if (score >= 60) return { bg: "rgba(236,138,67,0.14)", text: "#C7600F", border: "rgba(236,138,67,0.35)" };
  return { bg: "rgba(196,160,40,0.12)", text: "#9A7A10", border: "rgba(196,160,40,0.3)" };
};

function MasteryBar({ value, color = "#D6985A" }: { value: number; color?: string }) {
  return (
    <div style={{ flex: 1, height: 8, background: "rgba(120,90,50,.13)", borderRadius: 6, overflow: "hidden", minWidth: 80 }}>
      <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
    </div>
  );
}

export default function RootCausesPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [signals, setSignals] = useState<WeaknessSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<"root" | "weak" | "all">("root");
  const [navOpen, setNavOpen] = useState(false); // mobile sidebar drawer

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch("/api/weakness");
      if (r.ok) {
        const data = await r.json();
        setSignals(data.signals || []);
        setLastUpdated(new Date());
      }
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch("/api/weakness/refresh", { method: "POST" });
      await fetchData(false);
    } finally {
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, [fetchData]);

  useEffect(() => {
    // Always refresh on page load so data appears without a manual reload.
    fetch("/api/weakness/refresh", { method: "POST" })
      .finally(() => fetchData());
    const id = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  const rootFlaws = signals
    .filter(s => s.signal === "root_flaw")
    .sort((a, b) => (b.evidence?.root_flaw_score || b.severityScore) - (a.evidence?.root_flaw_score || a.severityScore));

  const weakConcepts = signals
    .filter(s => s.signal === "weak_concept")
    .sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));

  const displayed = tab === "root" ? rootFlaws : tab === "weak" ? weakConcepts : signals.sort((a, b) => b.severityScore - a.severityScore);

  const glassBlur = "blur(20px) saturate(1.2)";
  const glass = "rgba(255,255,255,0.55)";
  const glassBorder = "1px solid rgba(255,255,255,0.7)";
  const cardShadow = "0 14px 44px -20px rgba(170,110,45,0.32)";

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg> },
    { label: "Root Causes", active: true, path: "/dashboard/root-causes", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg> },
    { label: "Weak Concepts", path: "/dashboard/weakness", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 16l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
    { label: "Practice", path: "/question_dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> },
    { label: "Mock Tests", path: "/question_dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8 10h8M8 14h6"/></svg> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        html,body{margin:0;padding:0;font-family:'Hanken Grotesk',system-ui,sans-serif;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .nav-btn{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:12px;color:#7C6E60;font-weight:500;font-size:14px;text-decoration:none;cursor:pointer;transition:background .15s,color .15s;background:transparent;border:none;width:100%;}
        .nav-btn:hover{background:rgba(120,90,50,0.08);color:#D5740E;}
        .nav-btn.active{background:rgba(236,138,67,0.16);color:#D5740E;font-weight:700;}
        .tab-btn{padding:8px 20px;border-radius:20px;font-size:13.5px;font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all .15s;}
        .signal-card{animation:slideIn 0.35s ease both;}
        .practice-btn{border:none;cursor:pointer;font-weight:700;font-size:12.5px;padding:10px 16px;border-radius:11px;background:rgba(236,138,67,0.15);color:#D5740E;transition:background .15s;white-space:nowrap;}
        .practice-btn:hover{background:rgba(236,138,67,0.26);}
        .fix-btn{border:none;cursor:pointer;font-weight:800;font-size:13px;padding:11px 18px;border-radius:12px;background:linear-gradient(120deg,#F2A52A,#E0701E);color:#fff;box-shadow:0 10px 22px -10px rgba(224,112,30,.8);white-space:nowrap;transition:opacity .15s;}
        .fix-btn:hover{opacity:.9;}
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
        {/* BG BLOBS */}
        <div style={{ position: "fixed", top: -150, right: -70, width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,170,60,.4),rgba(245,170,60,0) 68%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -180, left: 150, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,138,67,.26),rgba(236,138,67,0) 70%)", pointerEvents: "none", zIndex: 0 }} />

        {navOpen && <div className="dash-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}

        {/* SIDEBAR */}
        <aside className={`dash-sidebar${navOpen ? " open" : ""}`} style={{ width: 236, flexShrink: 0, position: "relative", zIndex: 2, background: "rgba(255,253,248,0.72)", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, borderRight: "1px solid rgba(255,255,255,0.65)", display: "flex", flexDirection: "column", padding: "22px 16px", height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "4px 10px 20px" }}>
            <div onClick={() => router.push("/dashboard")} style={{ fontWeight: 800, fontSize: 30, letterSpacing: 1.5, background: "linear-gradient(118deg,#F4AB2D,#DE6E1C)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", lineHeight: 1, cursor: "pointer" }}>PAPER</div>
            <div style={{ fontSize: 12, color: "#B0A192", fontStyle: "italic", marginTop: 4 }}>We go deeper.</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            {navItems.map(item => (
              <button key={item.label} className={`nav-btn${(item as any).active ? " active" : ""}`} onClick={() => { setNavOpen(false); if (item.path) router.push(item.path); }}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 14, padding: 12, border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.5)", borderRadius: 15, display: "flex", alignItems: "center", gap: 11 }}>
            <UserButton />
            {isLoaded && user && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2E2620", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName || user.firstName || "Student"}</div>
                <div style={{ fontSize: 11.5, color: "#A89A8C" }}>JEE · Pro Plan</div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: "auto", height: "100vh", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "30px clamp(20px,3vw,48px) 80px" }}>

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <button className="dash-hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation menu" aria-expanded={navOpen}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                  </button>
                  <button onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#9A8B7C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Dashboard
                  </button>
                </div>
                <h1 style={{ margin: 0, fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 800, color: "#2E2620", letterSpacing: -0.3 }}>Why you&apos;re losing marks</h1>
                <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "#8C7D6E" }}>PAPER traced every mistake in your practice back to its source. Updated live.</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {lastUpdated && (
                  <div style={{ fontSize: 12.5, color: "#A89A8C", display: "flex", alignItems: "center", gap: 5 }}>
                    {refreshing
                      ? <><svg style={{ animation: "spin 1s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C7600F" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span style={{ color: "#C7600F" }}>Updating…</span></>
                      : <><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2FB060", animation: "pulse 2.5s ease-in-out infinite" }} /><span>Live · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></>
                    }
                  </div>
                )}
                <button
                  onClick={triggerRefresh}
                  disabled={refreshing}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 12, border: "1.5px solid rgba(199,96,15,0.35)", background: "rgba(255,247,227,0.85)", cursor: refreshing ? "default" : "pointer", fontSize: 13, fontWeight: 700, color: "#C7600F", opacity: refreshing ? 0.6 : 1 }}>
                  <svg style={refreshing ? { animation: "spin 1s linear infinite" } : {}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
                  Refresh Now
                </button>
              </div>
            </div>

            {/* STATS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Root causes found", value: rootFlaws.length, icon: "🎯" },
                { label: "Concepts holding you back", value: weakConcepts.length, icon: "⚡" },
                { label: "Signals tracked", value: signals.length, icon: "📊" },
              ].map(stat => (
                <div key={stat.label} style={{ background: glass, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: glassBorder, borderRadius: 18, padding: "18px 20px", boxShadow: cardShadow }}>
                  <div style={{ fontSize: 22 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#3A2E26", marginTop: 6 }}>{loading ? "…" : stat.value}</div>
                  <div style={{ fontSize: 13, color: "#9A8B7C", fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* TABS */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["root", "weak", "all"] as const).map(t => {
                const labels = { root: `Root Causes (${rootFlaws.length})`, weak: `Weak Concepts (${weakConcepts.length})`, all: `All Signals (${signals.length})` };
                const active = tab === t;
                return (
                  <button key={t} className="tab-btn" onClick={() => setTab(t)}
                    style={{ background: active ? "linear-gradient(120deg,#F2A52A,#E0701E)" : "rgba(255,255,255,0.55)", color: active ? "#fff" : "#8C7D6E", border: active ? "1.5px solid transparent" : "1.5px solid rgba(255,255,255,0.7)", backdropFilter: active ? "none" : "blur(8px)" }}>
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {/* SIGNAL LIST */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#A89A8C", fontSize: 15 }}>
                <svg style={{ animation: "spin 1s linear infinite", marginBottom: 14 }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C7600F" strokeWidth="2.2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <div>Scanning all signals…</div>
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 42, marginBottom: 14 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#3A2E26", marginBottom: 8 }}>No signals yet</div>
                <div style={{ fontSize: 14.5, color: "#8C7D6E", marginBottom: 22 }}>Solve some questions and hit "Refresh Now" to see your root causes appear here.</div>
                <button className="fix-btn" onClick={() => router.push("/question_dashboard")}>Go Practice →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {displayed.map((sig, idx) => {
                  const isRoot = sig.signal === "root_flaw";
                  const rootName = clean(sig.evidence?.root_concept_name || sig.conceptName);
                  const weakName = clean(sig.evidence?.weak_concept_name || sig.conceptName);
                  const rootMastery = pct(sig.evidence?.root_mastery);
                  const weakMastery = pct(sig.evidence?.weak_mastery ?? (sig.masteryScore != null ? sig.masteryScore / 100 : null));
                  const sc = severityColor(sig.severityScore);
                  const isSelf = sig.evidence?.is_standalone_root;

                  return (
                    <div key={sig.id || idx} className="signal-card" style={{ animationDelay: `${idx * 40}ms`, background: glass, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: isRoot ? "1.5px solid rgba(238,183,72,0.6)" : glassBorder, borderRadius: 20, padding: "22px 24px", boxShadow: isRoot ? "0 14px 40px -18px rgba(224,150,30,0.45)" : cardShadow }}>

                      {/* TOP ROW */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          {isRoot && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: "#B97A12", background: "rgba(240,183,72,.25)", border: "1px solid rgba(240,183,72,.55)", padding: "3px 10px", borderRadius: 20 }}>
                              {isSelf ? "ROOT CAUSE" : "ROOT FLAW"}
                            </span>
                          )}
                          {!isRoot && sig.signal === "missing_foundation" && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: "#1E6FA8", background: "rgba(60,140,210,0.12)", border: "1px solid rgba(60,140,210,0.35)", padding: "3px 10px", borderRadius: 20 }}>MISSING FOUNDATION</span>
                          )}
                          {!isRoot && sig.signal !== "missing_foundation" && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, padding: "3px 10px", borderRadius: 20 }}>WEAK CONCEPT</span>
                          )}
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, padding: "3px 10px", borderRadius: 20 }}>
                            Score {sig.severityScore}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="practice-btn" onClick={() => router.push(`/question_dashboard?v=questionlist&exam=jee&subject=Physics&concept=${encodeURIComponent(rootName)}`)}>
                            Practice →
                          </button>
                          {isRoot && (
                            <button className="fix-btn" onClick={() => router.push(`/question_dashboard?v=questionlist&exam=jee&subject=Physics&concept=${encodeURIComponent(rootName)}`)}>
                              Fix Now →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CHAIN DISPLAY — multi-hop aware */}
                      {isRoot && !isSelf ? (
                        (() => {
                          // Use the full path from the engine when present, else fall back to 2 nodes
                          const rawPath = Array.isArray(sig.evidence?.path) && sig.evidence.path.length >= 2
                            ? sig.evidence.path
                            : [
                                { name: weakName, mastery: weakMastery },
                                { name: rootName, mastery: rootMastery },
                              ];
                          const lastIdx = rawPath.length - 1;
                          const hops = sig.evidence?.hops ?? lastIdx;
                          return (
                            <>
                              {hops > 1 && (
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#B97A12", marginBottom: 10, letterSpacing: 0.3 }}>
                                  ⛓ PAPER traced this {hops} levels deep — most students only see the symptom
                                </div>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                                {rawPath.map((node: any, i: number) => {
                                  const isLast = i === lastIdx;
                                  const nm = clean(node.name);
                                  const mv = Math.round(node.mastery ?? 0);
                                  return (
                                    <div key={i} style={{ display: "contents" }}>
                                      <div style={{
                                        flex: 1, minWidth: 150,
                                        background: isLast ? "linear-gradient(140deg,rgba(255,231,176,0.95),rgba(255,205,127,0.88))" : "rgba(255,255,255,0.6)",
                                        border: isLast ? "1.5px solid rgba(238,183,72,0.85)" : "1px solid rgba(255,255,255,0.85)",
                                        borderRadius: 14, padding: "14px 16px",
                                      }}>
                                        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: isLast ? "#B97A12" : "#B58A52", marginBottom: 6, textTransform: "uppercase" }}>
                                          {isLast ? "Fix this first" : i === 0 ? "Where you lose marks" : "Weak link"}
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: isLast ? "#5A3D0A" : "#3A2E26", marginBottom: 10 }}>{nm}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <MasteryBar value={mv} color={isLast ? "#E0902F" : "#D6985A"} />
                                          <span style={{ fontSize: 13, fontWeight: 800, color: isLast ? "#5A3D0A" : "#3A2E26", flexShrink: 0 }}>{mv}%</span>
                                        </div>
                                      </div>
                                      {!isLast && (
                                        <div style={{ padding: "0 10px", color: "#D8B98A", flexShrink: 0 }}>
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        /* Standalone / weak concept display */
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#3A2E26", marginBottom: 12 }}>{clean(sig.conceptName)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <MasteryBar value={sig.masteryScore ?? weakMastery} color={isRoot ? "#E0902F" : "#D6985A"} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#3A2E26", flexShrink: 0 }}>{sig.masteryScore ?? weakMastery}%</span>
                          </div>
                          {sig.totalAttempts > 0 && (
                            <div style={{ marginTop: 10, fontSize: 12.5, color: "#8C7D6E" }}>
                              {sig.totalCorrect} / {sig.totalAttempts} correct · {Math.round((sig.totalCorrect / sig.totalAttempts) * 100)}% accuracy
                            </div>
                          )}
                        </div>
                      )}

                      {/* INSIGHT */}
                      {sig.insightMessage && (
                        <div style={{ marginTop: 14, fontSize: 13, color: "#7A5A1E", background: "rgba(255,231,176,0.5)", border: "1px dashed rgba(200,160,60,.35)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.5 }}>
                          {sig.insightMessage.split("\n\n")[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* FOOTER NOTE */}
            {!loading && displayed.length > 0 && (
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#A89A8C", background: "rgba(250,245,236,0.6)", borderRadius: 12, padding: "11px 14px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
                Signals update live every 10 seconds. Hit "Refresh Now" after finishing a practice session for the latest analysis.
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
