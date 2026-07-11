"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { fractionToPercent } from "@/utils/scale";

interface WeaknessSignal {
  id: string;
  conceptId: number;
  conceptName: string;
  subject?: string;
  signal: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
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

function SmallRingChart({ pct }: { pct: number }) {
  const r = 24, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="gMas2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4AB2D" /><stop offset="1" stopColor="#E0701E" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(120,90,50,.14)" strokeWidth="8" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="url(#gMas2)" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset="0" transform="rotate(-90 32 32)" />
    </svg>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [rootFlaws, setRootFlaws] = useState<WeaknessSignal[]>([]);
  const [allSignals, setAllSignals] = useState<WeaknessSignal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [timeSpentStr, setTimeSpentStr] = useState("0m");
  const [loadingStats, setLoadingStats] = useState(true);

  const [liveUpdating, setLiveUpdating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  // Mobile sidebar drawer (hidden on desktop, slides in on small screens)
  const [navOpen, setNavOpen] = useState(false);
  // Domain read from localStorage (set during select-domain flow)
  const [domain, setDomain] = useState("JEE");
  // Render today's date only after mount to avoid SSR/client hydration mismatch
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    const saved = localStorage.getItem("domain");
    if (saved) setDomain(saved);
  }, []);

  const loadWeakness = useCallback((isLive = false) => {
    if (isLive) setLiveUpdating(true);
    fetch("/api/weakness").then(r => r.ok ? r.json() : { signals: [] }).then(data => {
      const signals: WeaknessSignal[] = data.signals || [];
      setAllSignals(signals);
      setRootFlaws(
        signals.filter(s => s.signal === "root_flaw")
          .sort((a, b) => (b.evidence?.root_flaw_score || 0) - (a.evidence?.root_flaw_score || 0))
      );
      setLastRefreshed(new Date());
    }).catch(() => {}).finally(() => { setLoadingSignals(false); setLiveUpdating(false); });
  }, []);

  useEffect(() => {
    loadWeakness();
    // Poll every 10 seconds for live updates
    const id = setInterval(() => loadWeakness(true), 10000);
    return () => clearInterval(id);
  }, [loadWeakness]);

  useEffect(() => {
    fetch("/api/progress").then(r => r.ok ? r.json() : { attempts: [] }).then(data => {
      const fetched: any[] = data.attempts || [];
      setAttemptsCount(fetched.length);
      if (fetched.length > 0) {
        const correct = fetched.filter(a => a.isCorrect).length;
        setAccuracyRate(Math.round((correct / fetched.length) * 100));
        const totalSecs = fetched.reduce((acc: number, a: any) => acc + (a.timeSpent || 0), 0);
        const hrs = Math.floor(totalSecs / 3600), mins = Math.floor((totalSecs % 3600) / 60);
        setTimeSpentStr(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
        const dates = [...new Set(fetched.map((a: any) => a.timestamp?.split("T")[0]).filter(Boolean))].sort().reverse() as string[];
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
      }
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, []);

  const clean = (s: string) => s ? s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

  const overallMastery = (() => {
    const ms = allSignals.map(s => s.masteryScore).filter((m): m is number => m !== null);
    return ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : accuracyRate;
  })();

  // Group root flaws by subject so the hero can show a section per subject.
  // Subject list comes straight from the data, so it adapts to JEE (Physics/
  // Chemistry/Maths) or NEET (Physics/Chemistry/Biology) automatically.
  const PREFERRED_SUBJECT_ORDER = ["Physics", "Chemistry", "Mathematics", "Maths", "Biology", "Botany", "Zoology"];
  const subjectGroups: Record<string, WeaknessSignal[]> = {};
  rootFlaws.forEach(f => { const s = f.subject || "Other"; (subjectGroups[s] ||= []).push(f); });
  const subjectOrder = Object.keys(subjectGroups).sort((a, b) => {
    const ia = PREFERRED_SUBJECT_ORDER.indexOf(a), ib = PREFERRED_SUBJECT_ORDER.indexOf(b);
    const ra = ia === -1 ? 99 : ia, rb = ib === -1 ? 99 : ib;
    if (ra !== rb) return ra - rb;
    return (subjectGroups[b][0]?.evidence?.root_flaw_score || 0) - (subjectGroups[a][0]?.evidence?.root_flaw_score || 0);
  });
  const effectiveSubject = (activeSubject && subjectGroups[activeSubject]) ? activeSubject : subjectOrder[0];
  const activeFlaws = effectiveSubject ? subjectGroups[effectiveSubject] : [];

  // Build the chain nodes for a single root flaw (MULTI-HOP via evidence.path)
  const buildChain = (f: WeaknessSignal | undefined): any[] => {
    if (!f) return [];
    const weakName = clean(f.evidence?.weak_concept_name || f.conceptName);
    const rootName = clean(f.evidence?.root_concept_name || f.conceptName);
    const weakMastery = fractionToPercent(f.evidence?.weak_mastery ?? 0);
    const rootMastery = fractionToPercent(f.evidence?.root_mastery ?? 0);
    const isSelf = f.evidence?.is_standalone_root || (f.evidence?.weak_concept_id === f.evidence?.root_concept_id);
    const unlocks: string[] = (f.evidence?.unlocks || []).map((u: string) => clean(u));
    const rootAttempts: number = f.evidence?.root_attempts ?? f.totalAttempts ?? 0;
    const rootAccuracy: number = f.evidence?.root_accuracy ?? 0;
    const weakAccuracy: number = f.evidence?.weak_accuracy ?? 0;
    const weakAttempts: number = f.evidence?.weak_attempts ?? f.totalAttempts ?? 0;

    if (isSelf) {
      return [
        {
          step: "Root Cause", name: weakName, mastery: weakMastery, root: true,
          attempts: rootAttempts, accuracy: f.evidence?.root_accuracy ?? rootAccuracy,
          unlocks,
          because: "You practiced this and struggled. This is foundational — fixing it unblocks the topics below.",
        },
      ];
    }

    // MULTI-HOP: if the engine supplied a full path (symptom → … → root), render it.
    const path = Array.isArray(f.evidence?.path) ? f.evidence.path : null;
    if (path && path.length >= 2) {
      const lastIdx = path.length - 1;
      return path.map((p: any, i: number) => {
        const isRoot = i === lastIdx;
        const nm = clean(p.name);
        if (isRoot) {
          return {
            step: "Root Cause", name: nm, mastery: p.mastery, root: true,
            attempts: p.attempts, accuracy: p.accuracy, unlocks,
            because: `This is the deepest weak foundation in the chain. Fixing ${nm} (${p.mastery}%) lifts every topic above it.`,
          };
        }
        const next = clean(path[i + 1].name);
        return {
          step: i === 0 ? "Symptom" : "Contributing", name: nm, mastery: p.mastery, root: false,
          attempts: p.attempts, accuracy: p.accuracy, unlocks: [],
          because: `${nm} (${p.mastery}%) is weak partly because ${next} beneath it is even weaker.`,
        };
      });
    }

    // Fallback: simple 2-node chain
    return [
      {
        step: "Symptom", name: weakName, mastery: weakMastery, root: false,
        attempts: weakAttempts, accuracy: weakAccuracy, unlocks: [],
        because: `${weakName} looks worse (${weakMastery}%) but it's a downstream effect — the real problem is below.`,
      },
      {
        step: "Root Cause", name: rootName, mastery: rootMastery, root: true,
        attempts: rootAttempts, accuracy: rootAccuracy,
        unlocks,
        because: `Even though ${rootName} (${rootMastery}%) looks higher than ${weakName} (${weakMastery}%), it's still weak for JEE — and since ${weakName} builds on it, fixing ${rootName} first will lift both scores.`,
      },
    ];
  };

  // Show the top 2 root causes for the active subject
  const topChains = activeFlaws.slice(0, 2).map(buildChain).filter(c => c.length > 0);
  const chain = topChains[0] || [];

  // Weak concepts list — combine root flaws + weak signals, ranked by impact
  const concepts = (() => {
    const items: { name: string; subj: string; mastery: number; gain: number; isRoot: boolean }[] = [];
    rootFlaws.slice(0, 2).forEach(f => {
      items.push({
        name: clean(f.evidence?.root_concept_name || f.conceptName),
        subj: f.subject || "",
        mastery: f.evidence?.root_mastery != null ? fractionToPercent(f.evidence.root_mastery) : (f.masteryScore ?? 0),
        gain: Math.min(15, Math.max(4, Math.round((f.masteryScore != null ? (1 - f.masteryScore / 100) * 12 : 8)))),
        isRoot: true,
      });
    });
    allSignals.filter(s => s.signal === "weakness" || s.signal === "weak_concept").slice(0, 5).forEach(s => {
      if (!items.find(i => i.name === clean(s.conceptName))) {
        items.push({
          name: clean(s.conceptName),
          subj: s.subject || "",
          mastery: s.masteryScore ?? 0,
          gain: Math.min(12, Math.max(2, Math.round((s.masteryScore != null ? (1 - s.masteryScore / 100) * 10 : 4)))),
          isRoot: false,
        });
      }
    });
    return items.sort((a, b) => a.mastery - b.mastery).slice(0, 6);
  })();

  // Micro weaknesses — detailed mistake-level
  const microWeaknesses = allSignals
    .filter(s => s.signal === "weakness" || s.signal === "weak_concept")
    .slice(0, 5)
    .map(s => {
      const lost = (s.totalAttempts || 0) - (s.totalCorrect || 0);
      const freq = s.totalAttempts > 0 ? Math.round((1 - (s.totalCorrect || 0) / s.totalAttempts) * 100) : 0;
      // Say WHY there's a gap using this concept's real numbers, instead of a
      // generic "Conceptual gap" label repeated on every card.
      const why = s.dominantErrorType
        ? `${clean(s.dominantErrorType)} errors`
        : s.totalAttempts > 0 && freq >= 60
          ? `Wrong ${freq}% of the time so far`
          : s.masteryScore != null && s.masteryScore < 40
            ? `Mastery stuck at ${s.masteryScore}%`
            : s.totalAttempts > 0
              ? `Inconsistent — right and wrong on repeat attempts`
              : "Not enough attempts yet to confirm";
      return {
        mistake: `${why} in ${clean(s.conceptName)}`,
        concept: clean(s.conceptName),
        subject: clean(s.subject || "Physics"),
        marks: lost,
        freqText: `${freq}% of attempts`,
        high: s.severity === "HIGH" || s.severity === "CRITICAL",
      };
    });

  const isNew = !loadingSignals && !loadingStats && attemptsCount < 20;
  const surfaceName = chain.length > 0 ? chain[0].name : "…";
  const rootName = chain.length > 0 ? chain[chain.length - 1].name : "…";

  // Data-derived action-bar numbers (no hardcoded marks/counts)
  const activeRootNode: any = chain.length > 0 ? chain[chain.length - 1] : null;
  const rootUnlocks: string[] = activeRootNode?.unlocks || [];
  const estGainLo = activeRootNode ? Math.max(3, Math.round((1 - (activeRootNode.mastery || 0) / 100) * 6)) : 0;
  const estGainHi = activeRootNode ? estGainLo + Math.min(10, 3 + rootUnlocks.length * 2) : 0;
  const estMinutes = activeRootNode ? 10 + Math.min(20, rootUnlocks.length * 3) : 0;

  const startPractice = (subject?: string, concept?: string) => {
    // Default to the currently-active subject's top root cause (not a hardcoded subject)
    const topFlaw = activeFlaws[0];
    const sub = subject || topFlaw?.subject || effectiveSubject || "";
    const c   = concept || topFlaw?.evidence?.root_concept_name || "";
    const p   = new URLSearchParams({ v: "questionlist", exam: domain.toLowerCase() });
    if (sub) p.set("subject", sub);
    if (c) p.set("concept", c);
    router.push(`/question_dashboard?${p.toString()}`);
  };

  const navItems = [
    { label: "Overview", active: true, path: "/dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg> },
    { label: "Root Causes", path: "/dashboard/root-causes", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg> },
    { label: "Weak Concepts", path: "/dashboard/weakness", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 16l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
    { label: "Practice", path: "/question_dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> },
  ];

  const glass = "rgba(255,255,255,0.55)";
  const glassBorder = "1px solid rgba(255,255,255,0.7)";
  const glassBlur = "blur(20px) saturate(1.2)";
  const cardShadow = "0 14px 44px -20px rgba(170,110,45,0.32)";

  // Branded full-screen loader for the initial data fetch — avoids the flash of
  // empty "…" placeholder cards before signals/stats arrive.
  if (loadingSignals && loadingStats) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading your dashboard" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, background: "linear-gradient(165deg,#FCEFDC 0%,#FBF5EB 46%,#F7E6D2 100%)" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: 1.5, background: "linear-gradient(118deg,#F4AB2D,#DE6E1C)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontFamily: "system-ui,sans-serif" }}>PAPER</div>
        <div style={{ width: 40, height: 40, border: "4px solid rgba(224,112,30,0.2)", borderTopColor: "#E0701E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "#8C7D6E", fontSize: 14, fontWeight: 600, fontFamily: "system-ui,sans-serif" }}>Tracing your root causes…</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        html,body{margin:0;padding:0;font-family:'Hanken Grotesk',system-ui,sans-serif;}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(244,171,45,0)}50%{box-shadow:0 0 40px 8px rgba(244,171,45,.2)}}
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(0.85)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .nav-btn{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:12px;color:#7C6E60;font-weight:500;font-size:14px;text-decoration:none;cursor:pointer;transition:background .15s,color .15s;background:transparent;border:none;width:100%;}
        .nav-btn:hover{background:rgba(120,90,50,0.08);color:#D5740E;}
        .nav-btn.active{background:rgba(236,138,67,0.16);color:#D5740E;font-weight:700;}
        .fix-btn{border:none;cursor:pointer;font-weight:800;font-size:14.5px;padding:14px 24px;border-radius:13px;background:linear-gradient(120deg,#F2A52A,#E0701E);color:#fff;box-shadow:0 12px 26px -10px rgba(224,112,30,.85);transition:opacity .2s;}
        .fix-btn:hover{opacity:.9;}
        .practice-btn{border:none;cursor:pointer;font-weight:700;font-size:12.5px;padding:10px 16px;border-radius:11px;background:rgba(236,138,67,0.15);color:#D5740E;transition:background .15s;}
        .practice-btn:hover{background:rgba(236,138,67,0.26);}
        .fix-sm{border:none;cursor:pointer;font-weight:800;font-size:12.5px;padding:10px 16px;border-radius:11px;background:linear-gradient(120deg,#F2A52A,#E0701E);color:#fff;box-shadow:0 10px 20px -10px rgba(224,112,30,.8);white-space:nowrap;transition:opacity .15s;}
        .fix-sm:hover{opacity:.9;}
        /* Mobile sidebar drawer — desktop default is the in-flow sidebar */
        .dash-hamburger{display:none;align-items:center;justify-content:center;width:40px;height:40px;border-radius:11px;border:1px solid rgba(255,255,255,0.8);background:rgba(255,255,255,0.5);color:#7C6E60;cursor:pointer;flex-shrink:0;}
        .dash-overlay{position:fixed;inset:0;background:rgba(40,25,10,0.38);backdrop-filter:blur(2px);z-index:55;}
        @media (max-width: 860px){
          .dash-sidebar{position:fixed !important;left:0;top:0;z-index:60 !important;transform:translateX(-100%);transition:transform .28s ease;box-shadow:0 18px 60px rgba(60,35,10,0.4);}
          .dash-sidebar.open{transform:translateX(0);}
          .dash-hamburger{display:inline-flex;}
        }
        @media (min-width: 861px){ .dash-overlay{display:none;} }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", background: "linear-gradient(165deg,#FCEFDC 0%,#FBF5EB 46%,#F7E6D2 100%)" }}>

        {/* BG GLOW BLOBS */}
        <div style={{ position: "fixed", top: -150, right: -70, width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,170,60,.4),rgba(245,170,60,0) 68%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -180, left: 150, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,138,67,.26),rgba(236,138,67,0) 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: "30%", left: "36%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,220,150,.22),rgba(255,220,150,0) 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Mobile drawer backdrop */}
        {navOpen && <div className="dash-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}

        {/* SIDEBAR */}
        <aside className={`dash-sidebar${navOpen ? " open" : ""}`} style={{ width: 236, flexShrink: 0, position: "relative", zIndex: 2, background: "rgba(255,253,248,0.72)", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, borderRight: "1px solid rgba(255,255,255,0.65)", display: "flex", flexDirection: "column", padding: "22px 16px", height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "4px 10px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 1.5, background: "linear-gradient(118deg,#F4AB2D,#DE6E1C)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", lineHeight: 1 }}>PAPER</div>
            <div style={{ fontSize: 12, color: "#B0A192", fontStyle: "italic", marginTop: 4 }}>We go deeper.</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            {navItems.map(item => (
              <button key={item.label} className={`nav-btn${item.active ? " active" : ""}`} onClick={() => { setNavOpen(false); if (item.path) router.push(item.path); }}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 14, padding: 12, border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.5)", borderRadius: 15, display: "flex", alignItems: "center", gap: 11 }}>
            <UserButton />
            {isLoaded && user && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2E2620", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName || user.firstName || "Student"}</div>
                <div style={{ fontSize: 11.5, color: "#A89A8C" }}>{domain} · Student</div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: "auto", height: "100vh", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "30px clamp(20px,3vw,48px) 80px" }}>

            {/* HEADER */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="dash-hamburger" onClick={() => setNavOpen(true)} aria-label="Open navigation menu" aria-expanded={navOpen}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                </button>
                <div>
                <h1 style={{ fontSize: "clamp(21px,2.8vw,27px)", fontWeight: 800, color: "#2E2620", margin: 0, letterSpacing: -0.3 }}>
                  Welcome back, {isLoaded ? (user?.firstName || "Student") : "…"} 👋
                </h1>
                <p style={{ margin: "6px 0 0", color: "#8C7D6E", fontSize: 14.5 }}>Here&apos;s what to fix first — and exactly why it matters.</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.5)", borderRadius: 11, color: "#7C6E60", fontSize: 13, fontWeight: 600, backdropFilter: "blur(8px)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M9 3v4M15 3v4"/></svg>
                {todayStr}
              </div>
            </header>

            {isNew ? (
              /* ── NEW USER STATE ── */
              <>
                <section style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: "48px 40px", marginBottom: 20, background: "linear-gradient(135deg,rgba(255,247,227,0.85),rgba(255,237,203,0.74))", border: "1px solid rgba(243,214,147,0.85)", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, textAlign: "center", animation: "glowPulse 6s ease-in-out infinite" }}>
                  <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: 480, height: 480, background: "radial-gradient(circle,rgba(255,196,86,.42),rgba(255,196,86,0) 70%)", pointerEvents: "none" }} />
                  <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
                    <div style={{ width: 78, height: 78, margin: "0 auto 22px", borderRadius: 24, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px -12px rgba(224,150,30,.55)" }}>
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#E0902F" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/><path d="M11 8v6M8 11h6" stroke="#F2A52A"/></svg>
                    </div>
                    <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, color: "#3A2B12", margin: 0, lineHeight: 1.25 }}>Keep solving — I&apos;m still learning your patterns.</h2>
                    <p style={{ fontSize: 16, color: "#7A5A1E", margin: "14px 0 0", lineHeight: 1.55 }}>A few more questions and I&apos;ll pinpoint exactly where you&apos;re losing marks — and trace it to the one concept causing it.</p>
                    <div style={{ maxWidth: 420, margin: "26px auto 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: "#8A6A22", marginBottom: 8 }}>
                        <span>Analysing your patterns</span><span>{attemptsCount} of 20 analysed</span>
                      </div>
                      <div style={{ height: 12, background: "rgba(180,130,40,.22)", borderRadius: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(attemptsCount / 20) * 100}%`, background: "linear-gradient(120deg,#F2A52A,#E0701E)", borderRadius: 8 }} />
                      </div>
                      <div style={{ fontSize: 12, color: "#A8852E", marginTop: 9 }}>{20 - attemptsCount} more questions until I can confidently show your root cause.</div>
                    </div>
                    <button className="fix-btn" style={{ marginTop: 26 }} onClick={() => router.push("/question_dashboard")}>Solve practice questions →</button>
                  </div>
                </section>

                {/* locked preview cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 18 }}>
                  {["Root Cause Map", "Weak Concepts", "Micro Weaknesses"].map(label => (
                    <div key={label} style={{ background: glass, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: glassBorder, borderRadius: 18, padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#9A8B7C" }}>{label}</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C3B4A2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                      </div>
                      {[80, 60, 70].map((w, i) => <div key={i} style={{ height: 11, background: "rgba(120,90,50,.1)", borderRadius: 6, width: `${w}%`, marginBottom: i < 2 ? 9 : 0 }} />)}
                      <div style={{ marginTop: 14, fontSize: 12, color: "#B0A192", fontWeight: 600 }}>Unlocks at 20 questions</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* ── ESTABLISHED USER ── */
              <>
                {/* HERO — ROOT CAUSE MAP */}
                <section style={{ position: "relative", overflow: "hidden", borderRadius: 28, padding: "36px 40px", marginBottom: 24, background: "linear-gradient(135deg,rgba(255,247,227,0.82),rgba(255,237,203,0.72))", border: "1px solid rgba(243,214,147,0.85)", backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, animation: "glowPulse 6s ease-in-out infinite" }}>
                  <div style={{ position: "absolute", top: "-40%", right: "-3%", width: 480, height: 480, background: "radial-gradient(circle,rgba(255,196,86,.5),rgba(255,196,86,0) 70%)", pointerEvents: "none" }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: "#B97A12", textTransform: "uppercase" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/></svg>
                        Here&apos;s why your marks are stuck
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {lastRefreshed && (
                          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: "#A89A8C" }}>
                            {liveUpdating
                              ? <><svg style={{ animation: "spin 1s linear infinite" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7600F" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span style={{ color: "#C7600F", fontWeight: 600 }}>Updating…</span></>
                              : <><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2FB060", animation: "livePulse 2.5s ease-in-out infinite" }} /><span style={{ fontWeight: 600 }}>Live</span></>
                            }
                          </div>
                        )}
                        <button onClick={() => router.push("/dashboard/root-causes")}
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#C7600F", background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(199,96,15,0.3)", borderRadius: 20, padding: "6px 14px", cursor: "pointer" }}>
                          See all {rootFlaws.length > 0 ? `${rootFlaws.length} ` : ""}root causes
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                        </button>
                      </div>
                    </div>
                    {/* Per-subject selector — adapts to JEE (Physics/Chem/Maths) or NEET (Physics/Chem/Bio) from the data */}
                    {subjectOrder.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                        {subjectOrder.map(subj => {
                          const active = subj === effectiveSubject;
                          const count = subjectGroups[subj].length;
                          return (
                            <button key={subj} onClick={() => setActiveSubject(subj)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20,
                                fontSize: 13, fontWeight: 700, cursor: "pointer",
                                background: active ? "linear-gradient(120deg,#F2A52A,#E0701E)" : "rgba(255,255,255,0.55)",
                                color: active ? "#fff" : "#9A7A3E",
                                border: active ? "1.5px solid transparent" : "1.5px solid rgba(199,96,15,0.25)",
                                boxShadow: active ? "0 8px 18px -8px rgba(224,112,30,.7)" : "none",
                                transition: "all .15s",
                              }}>
                              {subj}
                              <span style={{ fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 12, background: active ? "rgba(255,255,255,0.28)" : "rgba(199,96,15,0.12)", color: active ? "#fff" : "#C7600F" }}>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <h2 style={{ fontSize: "clamp(22px,2.8vw,32px)", lineHeight: 1.25, fontWeight: 800, color: "#3A2B12", margin: 0, letterSpacing: -0.4 }}>
                      {loadingSignals ? "Analysing your patterns…" : chain.length === 0 ? "No root causes detected yet." : chain.length === 1
                        ? <>Your biggest gap right now is <span style={{ color: "#C7600F" }}>{surfaceName}</span>. Fix this first.</>
                        : <>Your marks lost in <span style={{ color: "#C7600F" }}>{surfaceName}</span> trace back to <span style={{ color: "#C7600F" }}>{rootName}</span>.</>
                      }
                    </h2>
                    <p style={{ margin: "11px 0 0", fontSize: 16, color: "#7A5A1E", lineHeight: 1.55, maxWidth: 720 }}>
                      {chain.length === 1
                        ? "This is your deepest gap right now. Fixing it directly unblocks every topic built on it — you don’t need to tackle each one separately."
                        : "You’ve likely been practising the symptom, not the cause. Fix the root once and the surface weakness recovers on its own."}
                    </p>

                    {/* TOP 2 CHAINS for the active subject */}
                    {topChains.map((ch, ci) => (
                      <div key={ci} style={{ marginTop: ci === 0 ? 26 : 20 }}>
                        {topChains.length > 1 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: "#B97A12", background: "rgba(240,183,72,.22)", border: "1px solid rgba(240,183,72,.5)", borderRadius: 20, padding: "3px 11px" }}>
                              {ci === 0 ? "#1 — Biggest gap" : "#2 — Next gap"}
                            </span>
                            <div style={{ flex: 1, height: 1, background: "rgba(180,130,40,.22)" }} />
                          </div>
                        )}
                      <div style={{ display: "flex", alignItems: "stretch", gap: 0, overflowX: "auto" }}>
                        {ch.map((node, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", flex: node.root ? 1.1 : 1, minWidth: 200 }}>
                            {node.root ? (
                              <div style={{ flex: 1, alignSelf: "stretch", background: "linear-gradient(140deg,rgba(255,231,176,0.95),rgba(255,205,127,0.9))", border: "1.5px solid rgba(238,183,72,0.95)", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 11, boxShadow: "0 18px 40px -16px rgba(224,150,30,0.6)" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: .7, textTransform: "uppercase", color: "#B97A12" }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
                                  {ch.length === 1 ? "Your root gap" : "The root cause"}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#5A3D0A", lineHeight: 1.2 }}>{node.name}</div>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                  <span style={{ fontSize: 32, fontWeight: 800, color: "#5A3D0A" }}>{node.mastery}%</span>
                                  <span style={{ fontSize: 11, color: "#A8852E" }}>of the required ideas are reliable — start here</span>
                                </div>
                                <div style={{ height: 8, background: "rgba(180,130,40,.28)", borderRadius: 6, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${node.mastery}%`, background: "#E0902F", borderRadius: 6 }} />
                                </div>
                                {/* Accuracy + attempts */}
                                {(node as any).attempts > 0 && (
                                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                                    <div style={{ fontSize: 12, color: "#7A5A1E", fontWeight: 700 }}>
                                      {(node as any).attempts} attempts · {(node as any).accuracy}% accuracy
                                    </div>
                                  </div>
                                )}
                                {/* Unlocks */}
                                {(node as any).unlocks?.length > 0 && (
                                  <div style={{ borderTop: "1px dashed rgba(180,130,40,.3)", paddingTop: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "#B97A12", letterSpacing: .4, marginBottom: 7, textTransform: "uppercase" }}>
                                      Fixing this improves:
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                      {(node as any).unlocks.slice(0, 4).map((u: string) => (
                                        <span key={u} style={{ fontSize: 11.5, fontWeight: 700, color: "#5A3D0A", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(180,130,40,.35)", borderRadius: 20, padding: "3px 10px" }}>
                                          {u}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div style={{ fontSize: 12.5, color: "#7A5A1E", lineHeight: 1.4, borderTop: "1px dashed rgba(180,130,40,.3)", paddingTop: 10 }}>{node.because}</div>
                              </div>
                            ) : (
                              <>
                                <div style={{ flex: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 11 }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .6, textTransform: "uppercase", color: "#B58A52" }}>{node.step}</div>
                                  <div style={{ fontSize: 17, fontWeight: 800, color: "#3A2E26", lineHeight: 1.2 }}>{node.name}</div>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                    <span style={{ fontSize: 28, fontWeight: 800, color: "#3A2E26" }}>{node.mastery}%</span>
                                    <span style={{ fontSize: 11, color: "#9A8B7C" }}>mastery</span>
                                  </div>
                                  <div style={{ height: 8, background: "rgba(120,90,50,.13)", borderRadius: 6, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${node.mastery}%`, background: "#CDA06A", borderRadius: 6 }} />
                                  </div>
                                  {(node as any).attempts > 0 && (
                                    <div style={{ fontSize: 12, color: "#9A8B7C", fontWeight: 700 }}>
                                      {(node as any).attempts} attempts · {(node as any).accuracy}% accuracy
                                    </div>
                                  )}
                                  {node.because && <div style={{ fontSize: 12, color: "#8C7D6E", fontStyle: "italic", lineHeight: 1.4, borderTop: "1px dashed rgba(120,90,50,.18)", paddingTop: 10 }}>↓ {node.because}</div>}
                                </div>
                                {/* Arrow to next node */}
                                <div style={{ flexShrink: 0, padding: "0 8px", color: "#D8B98A", display: "flex", alignItems: "center" }}>
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      </div>
                    ))}

                    {/* INSIGHT CHIPS — purely visual, uses existing computed data */}
                    {!loadingSignals && chain.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 20 }}>
                        {rootUnlocks.length > 0 && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(180,130,40,0.28)", fontSize: 12.5, color: "#7A5A1E", fontWeight: 600, backdropFilter: "blur(8px)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B97A12" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/></svg>
                            Fixing this improves <b style={{ color: "#C7600F", marginLeft: 4 }}>{rootUnlocks.length} connected topic{rootUnlocks.length !== 1 ? "s" : ""}</b>
                          </div>
                        )}
                        {chain.length > 1 && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(180,130,40,0.28)", fontSize: 12.5, color: "#7A5A1E", fontWeight: 600, backdropFilter: "blur(8px)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B97A12" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            You&apos;ve likely been practising the symptom instead of the cause
                          </div>
                        )}
                      </div>
                    )}

                    {/* ACTION BAR */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginTop: 22, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 18, padding: "18px 24px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: "#A2937F" }}>What to do right now</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#3A2E26", marginTop: 4 }}>Fix the root, not the symptom</div>
                        </div>
                        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 12, color: "#9A8B7C", fontWeight: 600 }}>Marks you can recover</span><span style={{ fontSize: 17, fontWeight: 800, color: "#1F8A5B" }}>{estGainHi > 0 ? `+${estGainLo} to +${estGainHi}` : "—"}</span></div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 12, color: "#9A8B7C", fontWeight: 600 }}>Topics it unblocks</span><span style={{ fontSize: 17, fontWeight: 800, color: "#3A2E26" }}>{rootUnlocks.length}</span></div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 12, color: "#9A8B7C", fontWeight: 600 }}>Est. focus time</span><span style={{ fontSize: 17, fontWeight: 800, color: "#3A2E26" }}>{estMinutes > 0 ? `~${estMinutes} min` : "—"}</span></div>
                        </div>
                      </div>
                      <button className="fix-btn" onClick={() => startPractice(effectiveSubject, activeFlaws[0]?.evidence?.root_concept_name)}>Fix This Now →</button>
                    </div>
                  </div>
                </section>

                {/* WEAK CONCEPTS */}
                <section style={{ background: glass, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, borderRadius: 26, padding: "30px 32px", marginBottom: 22, boxShadow: cardShadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2E2620" }}>These concepts are holding you back</h3>
                      <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "#8C7D6E" }}>In order of impact. Fix the top one first — it&apos;s blocking everything below it.</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#A89A8C", background: "rgba(120,90,50,0.08)", padding: "6px 14px", borderRadius: 20 }}>Priority order</span>
                  </div>

                  {loadingSignals ? (
                    <div style={{ padding: "24px 0", fontSize: 14, color: "#A89A8C" }}>Scanning concept signals…</div>
                  ) : concepts.length === 0 ? (
                    <div style={{ padding: "24px 0", fontSize: 14, color: "#A89A8C", textAlign: "center" }}>🎉 No weak concepts detected yet. Keep practising!</div>
                  ) : concepts.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderTop: "1px solid rgba(120,90,50,.1)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#3A2E26" }}>{item.name}</span>
                          {item.subj && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7A6B5C", background: "rgba(120,90,50,.1)", padding: "3px 10px", borderRadius: 20 }}>{item.subj}</span>}
                          {item.isRoot && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .4, color: "#B97A12", background: "rgba(240,183,72,.25)", border: "1px solid rgba(240,183,72,.55)", padding: "3px 10px", borderRadius: 20 }}>ROOT CAUSE</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 11 }}>
                          <div style={{ flex: 1, maxWidth: 340, height: 10, background: "rgba(120,90,50,.12)", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${item.mastery}%`, background: "#D6985A", borderRadius: 6 }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#3A2E26" }}>{item.mastery}%</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 90 }}>
                        <div style={{ fontSize: 11, color: "#9A8B7C", fontWeight: 600 }}>Est. gain</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1F8A5B" }}>+{item.gain} marks</div>
                      </div>
                      {item.isRoot
                        ? <button className="fix-sm" onClick={() => startPractice(item.subj, item.name)}>Fix This Now →</button>
                        : <button className="practice-btn" onClick={() => startPractice(item.subj, item.name)}>Practice →</button>
                      }
                    </div>
                  ))}

                  {concepts.length > 0 && (
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#A89A8C", background: "rgba(250,245,236,0.6)", borderRadius: 12, padding: "11px 14px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
                    Showing concepts across all subjects — {[...new Set(concepts.map(c => c.subj).filter(Boolean))].join(", ") || domain}.
                  </div>
                  )}

                  <button
                    onClick={() => router.push("/dashboard/weakness")}
                    style={{ marginTop: 18, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px 24px", borderRadius: 16, border: "1.5px solid rgba(224,112,30,0.35)", background: "linear-gradient(135deg,rgba(255,247,227,0.85),rgba(255,237,203,0.75))", cursor: "pointer", transition: "box-shadow .2s, transform .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 28px -12px rgba(224,112,30,.45)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7600F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 16l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#C7600F", letterSpacing: -0.2 }}>See Your Full Weakness Report</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7600F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M12 5l7 7-7 7"/></svg>
                  </button>
                </section>

                {/* MICRO WEAKNESSES */}
                <section style={{ background: glass, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, borderRadius: 26, padding: "30px 32px", marginBottom: 22, boxShadow: cardShadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2E2620" }}>Where marks are leaking</h3>
                      <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "#8C7D6E" }}>Specific mistake patterns PAPER traced in your attempts, ranked by how much they&apos;re costing you.</p>
                    </div>
                    <button onClick={() => router.push("/dashboard/weakness")} style={{ fontSize: 13.5, fontWeight: 700, color: "#D5740E", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>View all</button>
                  </div>

                  {loadingSignals ? (
                    <div style={{ padding: "24px 0", fontSize: 14, color: "#A89A8C" }}>Scanning…</div>
                  ) : microWeaknesses.length === 0 ? (
                    <div style={{ padding: "24px 0", fontSize: 14, color: "#A89A8C", textAlign: "center" }}>🎉 No micro-weaknesses yet. Keep practising!</div>
                  ) : microWeaknesses.map((item, i) => (
                    <div key={i} style={{ padding: "18px 0", borderTop: "1px solid rgba(120,90,50,.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#3A2E26" }}>{item.mistake}</div>
                        {item.high
                          ? <span style={{ fontSize: 11.5, fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: "rgba(217,89,75,0.14)", color: "#C2473A", whiteSpace: "nowrap" }}>High impact</span>
                          : <span style={{ fontSize: 11.5, fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: "rgba(196,150,40,0.16)", color: "#B07D1E", whiteSpace: "nowrap" }}>Medium impact</span>
                        }
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 11, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#7A6B5C", background: "rgba(120,90,50,.1)", padding: "3px 10px", borderRadius: 20 }}>{item.concept}</span>
                        <span style={{ fontSize: 13.5, color: "#7A6B5C" }}>Est. marks lost <b style={{ color: "#C2473A" }}>−{item.marks}</b></span>
                        <span style={{ fontSize: 13.5, color: "#7A6B5C" }}>Error frequency <b style={{ color: "#3A2E26" }}>{item.freqText}</b></span>
                        <button onClick={() => startPractice(item.subject, item.concept)} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#D5740E", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Drill this →</button>
                      </div>
                    </div>
                  ))}
                </section>

                {/* ANALYTICS STRIP */}
                <section style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(18px) saturate(1.2)", WebkitBackdropFilter: "blur(18px) saturate(1.2)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 24, padding: "24px 32px", boxShadow: "0 12px 38px -22px rgba(170,110,45,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: .7, textTransform: "uppercase", color: "#A2937F" }}>Your practice, at a glance</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#B0A192" }}>This week</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", rowGap: 18 }}>
                    <div style={{ flex: "1.4 1 240px", minWidth: 220, display: "flex", alignItems: "center", gap: 18, paddingRight: 28 }}>
                      <SmallRingChart pct={overallMastery} />
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: "#A2937F" }}>Overall Mastery</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: "#2E2620", lineHeight: 1.05 }}>{loadingSignals ? "…" : `${overallMastery}%`}</div>
                        <div style={{ fontSize: 12.5, color: overallMastery < 40 ? "#C2473A" : overallMastery < 70 ? "#B07D1E" : "#1F8A5B", fontWeight: 700 }}>
                          {loadingSignals ? "" : overallMastery < 40 ? "Most ideas still need work." : overallMastery < 70 ? "Building consistency." : "Strong foundation forming."}
                        </div>
                      </div>
                    </div>
                    {[
                      { label: "Accuracy", value: loadingStats ? "…" : `${accuracyRate}%`, delta: accuracyRate >= 70 ? "On track 🎯" : "Keep practising" },
                      { label: "Questions Solved", value: loadingStats ? "…" : attemptsCount.toLocaleString(), delta: "All time" },
                      { label: "Study Streak", value: loadingStats ? "…" : `${streakDays}d`, delta: streakDays > 0 ? "Keep it up 🔥" : "Start today!" },
                      { label: "Time Spent", value: loadingStats ? "…" : timeSpentStr, delta: "All time" },
                    ].map(kpi => (
                      <div key={kpi.label} style={{ flex: "1 1 160px", minWidth: 150, padding: "6px 28px", borderLeft: "1px solid rgba(120,90,50,.14)" }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: "#A2937F" }}>{kpi.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#2E2620", marginTop: 4 }}>{kpi.value}</div>
                        <div style={{ fontSize: 12.5, color: "#9A8B7C", marginTop: 3 }}>{kpi.delta}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(165deg,#FCEFDC,#FBF5EB,#F7E6D2)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #F4AB2D", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
