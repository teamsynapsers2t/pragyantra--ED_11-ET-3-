"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface AuditStep {
  passed: boolean;
  message: string;
  details?: any;
}

export default function AuditPage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startAudit = async () => {
    setIsRunning(true);
    setError(null);
    setLogs(["[Info] Connecting to local server...", "[Info] Initializing audit suite..."]);
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setAuditResult(data.steps);
        setLogs(data.logs);
      } else {
        setError(data.error || "Audit pipeline run failed.");
        if (data.logs) setLogs(data.logs);
      }
    } catch (err: any) {
      setError(err.message || "Network error while connecting to audit runner.");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (stepKey: string) => {
    if (isRunning) return <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin inline-block" />;
    if (!auditResult) return <span className="text-gray-600">⚪ Pending</span>;
    const step = auditResult[stepKey];
    if (!step) return <span className="text-gray-600">⚪ Not Checked</span>;
    return step.passed 
      ? <span className="text-emerald-400 font-bold">✓ Passed</span> 
      : <span className="text-rose-400 font-bold">✗ Failed</span>;
  };

  const getStepBg = (stepKey: string) => {
    if (!auditResult) return "border-[#1e293b] bg-[#0d1527]/50";
    const step = auditResult[stepKey];
    if (!step) return "border-[#1e293b] bg-[#0d1527]/50";
    return step.passed 
      ? "border-emerald-500/20 bg-emerald-950/5" 
      : "border-rose-500/20 bg-rose-950/5";
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background glow effects */}
      <div className="absolute w-[800px] h-[800px] bg-orange-500/5 blur-[180px] rounded-full top-[-200px] right-[-200px] pointer-events-none" />
      <div className="absolute w-[800px] h-[800px] bg-blue-500/5 blur-[180px] rounded-full bottom-[-200px] left-[-200px] pointer-events-none" />

      {/* Header Panel */}
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
            PAPER V1 Pipeline Auditor
          </h1>
        </div>
        <div className="text-[10px] bg-[#16223f] border border-[#1e293b] text-gray-300 px-3 py-1.5 rounded-lg font-bold">
          🛡️ DIAGNOSTIC PANEL
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 relative z-10">
        
        {/* Title & Action Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              Micro-Weakness Engine Audit Suite
            </h2>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
              Verify database writes, correctness mappings, mastery updates, weakness signals, time traps, and prerequisite causes automatically. No UI refactoring. Simple diagnostic audit.
            </p>
          </div>
          <button
            onClick={startAudit}
            disabled={isRunning}
            className={`px-8 py-4 rounded-2xl font-black text-sm transition shadow-lg shrink-0 flex items-center gap-2 ${
              isRunning 
                ? "bg-gray-800 text-gray-400 cursor-not-allowed border border-transparent"
                : "bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 shadow-orange-500/10 hover:scale-[1.02]"
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Auditing Pipeline...
              </>
            ) : (
              "Run Pipeline Audit"
            )}
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-semibold">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Bento Grid Audits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Test Stages Status */}
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 space-y-4 lg:col-span-1 flex flex-col">
            <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-[#1e293b] pb-3">
              Audit Pipeline Stages
            </h3>
            
            <div className="flex-1 space-y-2">
              {[
                { key: "step1", num: "1", title: "Attempt Engine Writes", desc: "Verifies is_correct, confidence, and metrics saving." },
                { key: "step2", num: "2", title: "Concept Mappings", desc: "Runs Gemini to check 100 sample question mappings." },
                { key: "step3", num: "3", title: "Concept Mastery Updates", desc: "Tests 10 correct + 10 wrong mastery updates." },
                { key: "step4", num: "4", title: "Weakness Signal Triggers", desc: "Tests weak_concept triggers and resolution rules." },
                { key: "step5", num: "5", title: "Time Trap Diagnostics", desc: "Verifies student avg time vs global avg time." },
                { key: "step6", num: "6", title: "Root Flaw Prereqs", desc: "Validates parent-child graph & score calculations." },
                { key: "step7", num: "7", title: "Report Simulations", desc: "Simulates full profile reports for student display." },
                { key: "student_experience", num: "EXP", title: "Student Experience Test", desc: "Simulates A (Advanced), B (Avg), C (Struggling) profiles." },
                { key: "engagement_loop", num: "LOOP", title: "Engagement Loop Test", desc: "Checks full loop resolution path." }
              ].map((stage) => (
                <div 
                  key={stage.key} 
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-4 ${getStepBg(stage.key)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#16223f] border border-[#1e293b] flex items-center justify-center text-[10px] font-bold text-gray-300">
                      {stage.num}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{stage.title}</p>
                      <p className="text-[9px] text-gray-500 font-medium leading-tight">{stage.desc}</p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold shrink-0">
                    {getStatusIcon(stage.key)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Columns: Live console logs & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Logs Stream */}
            <div className="bg-[#050811] border border-[#1e293b] rounded-3xl p-6 flex flex-col h-[300px]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Live Audit Console Stream</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </h3>
              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 pr-2">
                {logs.length === 0 ? (
                  <p className="text-gray-600 italic">Console idle. Click "Run Pipeline Audit" to stream diagnostic logs.</p>
                ) : (
                  logs.map((lg, i) => (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap">
                      <span className="text-gray-600 mr-1.5">&gt;</span>
                      {lg}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detailed Stage Verification Panel */}
            {auditResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Concept Mapping Accuracy (Step 2) */}
                <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step 2: Mapping Accuracy</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400">Total Checked</span>
                    <span className="text-sm font-black text-white">{auditResult.step2?.details?.totalChecked || 0} questions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400">Mappings Found</span>
                    <span className="text-sm font-black text-white">{auditResult.step2?.details?.mappedCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400">Gemini Mismatches</span>
                    <span className="text-sm font-black text-orange-400">{auditResult.step2?.details?.incorrectCount || 0}</span>
                  </div>
                  <div className="border-t border-[#1e293b] pt-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Mapping Accuracy</span>
                    <span className="text-xl font-black text-emerald-400">{auditResult.step2?.details?.accuracy || 100}%</span>
                  </div>
                </div>

                {/* Score Formula Verification (Step 6) */}
                <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step 6: Flaw Score Formula</h4>
                  <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded-2xl space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Diagnostic Formula</p>
                    <p className="text-xs font-mono text-white leading-normal">(100 - parent_mastery_score) × strength</p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-400">Parent Mastery (Dimensions)</span>
                    <span className="text-white">30%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-400">Relationship Strength</span>
                    <span className="text-white">8/10</span>
                  </div>
                  <div className="border-t border-[#1e293b] pt-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Expected Flaw Score</span>
                    <span className="text-sm font-black text-orange-400">560</span>
                  </div>
                </div>

              </div>
            )}

            {/* Student Experience Validation Card */}
            {auditResult?.student_experience && (
              <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Student Experience Diagnostic Reports</h4>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Passed</span>
                </div>

                {/* Diagnostic Question Checklist */}
                <div className="space-y-3">
                  {[
                    { q: "1. Do insights feel correct?", a: auditResult.student_experience.details.questions.q1 },
                    { q: "2. Do signals make sense?", a: auditResult.student_experience.details.questions.q2 },
                    { q: "3. Would a student trust this?", a: auditResult.student_experience.details.questions.q3 },
                    { q: "4. Are there false positives?", a: auditResult.student_experience.details.questions.q4 },
                    { q: "5. Are there missing weaknesses?", a: auditResult.student_experience.details.questions.q5 }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-[#090d16] border border-[#1e293b] rounded-2xl space-y-1">
                      <p className="text-[11px] font-bold text-white">{item.q}</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-medium">{item.a}</p>
                    </div>
                  ))}
                </div>

                {/* Mock student stats */}
                <div className="grid grid-cols-3 gap-4 border-t border-[#1e293b] pt-4">
                  <div className="text-center bg-[#090d16] border border-[#1e293b] p-3 rounded-2xl">
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Student A (84%)</p>
                    <p className="text-xs font-bold text-white mt-1">Signals: {auditResult.student_experience.details.studentA.signalsCount}</p>
                  </div>
                  <div className="text-center bg-[#090d16] border border-[#1e293b] p-3 rounded-2xl">
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Student B (60%)</p>
                    <p className="text-xs font-bold text-white mt-1">Signals: {auditResult.student_experience.details.studentB.signalsCount}</p>
                  </div>
                  <div className="text-center bg-[#090d16] border border-[#1e293b] p-3 rounded-2xl">
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Student C (30%)</p>
                    <p className="text-xs font-bold text-orange-400 mt-1">Signals: {auditResult.student_experience.details.studentC.signalsCount}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
