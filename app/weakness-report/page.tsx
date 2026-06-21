"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface WeaknessSignal {
  id: number;
  conceptId: number;
  conceptName: string;
  signal: string; // 'weak_concept' | 'time_trap' | 'root_flaw'
  severity: string; // 'low' | 'medium' | 'high'
  severityScore: number;
  confidenceScore: number;
  evidence: any;
  insightMessage: string;
  createdAt: string;
  masteryScore: number | null;
  totalAttempts: number;
  totalCorrect: number;
  dominantErrorType: string | null;
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  conceptual: "Conceptual misunderstanding",
  formula: "Wrong formula applied",
  sign: "Sign / direction error",
  unit: "Unit conversion mistake",
  calculation: "Arithmetic / calculation slip",
  misread: "Misread the question",
  partial: "Incomplete method",
};

const getSeverityStyle = (severity: string) => {
  const s = (severity || "").toLowerCase();
  switch (s) {
    case "high":
      return "bg-rose-500/10 border-rose-500/30 text-rose-400";
    case "medium":
      return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    case "low":
      return "bg-sky-500/10 border-sky-500/30 text-sky-400";
    default:
      return "bg-gray-500/10 border-gray-500/30 text-gray-400";
  }
};

const cleanLabel = (str: string) => {
  if (!str) return "";
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function WeaknessReportPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<WeaknessSignal[]>([]);
  const [report, setReport] = useState<{ text: string; generatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/weakness");
        if (res.ok) {
          const data = await res.json();
          setSignals(data.signals || []);
          setReport(data.report || null);
        } else {
          setError("Failed to load weakness data");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Categorize signals
  const rootFlaws = signals.filter((s) => s.signal === "root_flaw");
  const weakConcepts = signals.filter((s) => s.signal === "weak_concept");
  const timeTraps = signals.filter((s) => s.signal === "time_trap");
  const hasData = signals.length > 0;

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex flex-col font-sans relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute w-[800px] h-[800px] bg-orange-500/5 blur-[180px] rounded-full top-[-200px] left-[-200px] pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-blue-500/5 blur-[180px] rounded-full bottom-[-200px] right-[-200px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 bg-[#0d1527] border-b border-[#1e293b] px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-orange-500 hover:text-orange-400 transition font-bold flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </button>
          <span className="text-gray-600">|</span>
          <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-5 bg-orange-500 rounded-full inline-block" />
            Your Weakness Report
          </h1>
        </div>
        <div className="text-[10px] bg-[#16223f] border border-[#1e293b] text-gray-300 px-3 py-1.5 rounded-lg font-bold">
          🎯 WHY you lose marks
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-semibold">Analyzing your weaknesses...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-sm font-semibold text-center">
            ⚠️ {error}
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <span className="text-5xl">🧪</span>
            <h2 className="text-xl font-bold text-white">No Weakness Data Yet</h2>
            <p className="text-sm text-gray-400 max-w-md text-center leading-relaxed">
              Complete some practice sessions first. The engine needs at least 5 attempts on a concept before it can identify patterns.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-2xl transition"
            >
              Start Practicing
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {/* Narrative Summary */}
            {report && (
              <motion.div
                key="narrative-report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 rounded-3xl p-6 md:p-8 shadow-2xl"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">📋</span>
                  <div className="space-y-2 flex-1">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Engine Summary</h2>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {report.text}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-2">
                      Generated {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === SECTION 1: ROOT FLAWS (Highest Priority) === */}
            {rootFlaws.length > 0 && (
              <motion.section
                key="root-flaws-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Root Causes</h2>
                    <p className="text-[11px] text-gray-400">Prerequisite gaps causing cascading failures. Fix these FIRST.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {rootFlaws.map((flaw, idx) => {
                    const rootConcept = flaw.evidence?.root_concept_name || "Prerequisite";
                    const weakConcept = flaw.evidence?.weak_concept_name || flaw.conceptName;
                    const rootMastery = flaw.evidence?.root_mastery ?? 0;
                    const weakMastery = flaw.evidence?.weak_mastery ?? 0;
                    const strength = flaw.evidence?.relationship_strength || 8;

                    return (
                      <motion.div
                        key={flaw.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        className="bg-[#0d1527] border border-[#1e293b] hover:border-orange-500/30 rounded-2xl p-5 shadow-lg transition hover:scale-[1.005] space-y-4"
                      >
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${getSeverityStyle(flaw.severity)}`}>
                            {flaw.severity.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold">
                            Strength: {strength}/10
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Your Actual Problem</p>
                            <p className="text-sm font-black text-orange-400">{cleanLabel(rootConcept)}</p>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-xs">↓ causes weakness in</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Concept Suffering</p>
                            <p className="text-xs font-bold text-white">{cleanLabel(weakConcept)}</p>
                          </div>
                        </div>

                        <p className="text-xs text-orange-200/80 leading-relaxed italic bg-orange-950/20 border border-orange-500/10 p-3 rounded-xl whitespace-pre-wrap">
                          {flaw.insightMessage}
                        </p>

                        {/* Mastery bars */}
                        <div className="border-t border-[#1e293b] pt-3 space-y-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-gray-400">
                              <span>Root Mastery</span>
                              <span className="text-orange-400">{rootMastery}%</span>
                            </div>
                            <div className="h-1.5 bg-[#090d16] rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${rootMastery}%` }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-gray-400">
                              <span>Weak Mastery</span>
                              <span className="text-rose-400">{weakMastery}%</span>
                            </div>
                            <div className="h-1.5 bg-[#090d16] rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${weakMastery}%` }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* === SECTION 2: WEAK CONCEPTS === */}
            {weakConcepts.length > 0 && (
              <motion.section
                key="weak-concepts-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🟠</span>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Weak Concepts</h2>
                    <p className="text-[11px] text-gray-400">Concepts where your mastery is below threshold. Includes error type diagnosis.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weakConcepts.map((wc, idx) => (
                    <motion.div
                      key={wc.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + idx * 0.03 }}
                      className="bg-[#0d1527] border border-[#1e293b] hover:border-amber-500/20 rounded-2xl p-4 space-y-3 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${getSeverityStyle(wc.severity)}`}>
                          {wc.severity.toUpperCase()}
                        </span>
                        {wc.masteryScore !== null && (
                          <span className="text-[10px] font-bold text-gray-400">
                            Mastery: <span className="text-white">{Math.round(wc.masteryScore)}%</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white leading-tight">
                        {cleanLabel(wc.conceptName)}
                      </h3>

                      {wc.totalAttempts > 0 && (
                        <div className="text-[10px] text-gray-400 font-medium">
                          {wc.totalCorrect}/{wc.totalAttempts} correct ({Math.round((wc.totalCorrect / wc.totalAttempts) * 100)}%)
                        </div>
                      )}

                      {/* Mastery bar */}
                      {wc.masteryScore !== null && (
                        <div className="h-1.5 bg-[#090d16] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              wc.masteryScore > 60 ? "bg-emerald-500" : wc.masteryScore > 30 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${wc.masteryScore}%` }}
                          />
                        </div>
                      )}

                      {/* Error type tag */}
                      {wc.dominantErrorType && (
                        <div className="bg-amber-950/30 border border-amber-500/10 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">Your Error Pattern</p>
                          <p className="text-[11px] font-bold text-amber-300 mt-0.5">
                            {ERROR_TYPE_LABELS[wc.dominantErrorType] || wc.dominantErrorType}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* === SECTION 3: TIME TRAPS === */}
            {timeTraps.length > 0 && (
              <motion.section
                key="time-traps-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Time Traps</h2>
                    <p className="text-[11px] text-gray-400">Concepts where you take significantly longer than the average student.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timeTraps.map((trap, idx) => {
                    const timeRatio = trap.evidence?.time_ratio || 1.0;
                    const studentAvg = trap.evidence?.student_avg_ms;
                    const globalAvg = trap.evidence?.global_avg_ms;

                    return (
                      <motion.div
                        key={trap.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + idx * 0.03 }}
                        className="bg-[#0d1527] border border-[#1e293b] hover:border-sky-500/20 rounded-2xl p-4 space-y-3 transition"
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${getSeverityStyle(trap.severity)}`}>
                            {trap.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-black text-sky-400">
                            {parseFloat(String(timeRatio)).toFixed(1)}× slower
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white leading-tight">
                          {cleanLabel(trap.conceptName)}
                        </h3>

                        <p className="text-xs text-sky-200/80 leading-relaxed italic">
                          {trap.insightMessage}
                        </p>

                        {/* Time comparison */}
                        {studentAvg && globalAvg && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e293b]">
                            <div className="text-center bg-[#090d16] rounded-xl p-2.5">
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Your Avg</p>
                              <p className="text-sm font-black text-white mt-0.5">
                                {Math.round(studentAvg / 1000)}s
                              </p>
                            </div>
                            <div className="text-center bg-[#090d16] rounded-xl p-2.5">
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Global Avg</p>
                              <p className="text-sm font-black text-emerald-400 mt-0.5">
                                {Math.round(globalAvg / 1000)}s
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Stats Footer */}
            <motion.div
              key="stats-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0d1527] border border-[#1e293b] rounded-2xl p-4 flex flex-wrap gap-6 justify-center"
            >
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Root Causes</p>
                <p className="text-lg font-black text-orange-400">{rootFlaws.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Weak Concepts</p>
                <p className="text-lg font-black text-amber-400">{weakConcepts.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Time Traps</p>
                <p className="text-lg font-black text-sky-400">{timeTraps.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total Signals</p>
                <p className="text-lg font-black text-white">{signals.length}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
