"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from "recharts";

const defaultSubjectPerformance = [
  { subject: "Mechanics", mastery: 72, accuracy: 74 },
  { subject: "Electromagn.", mastery: 68, accuracy: 63 },
  { subject: "Inorganic", mastery: 58, accuracy: 65 },
  { subject: "Algebra", mastery: 63, accuracy: 71 },
  { subject: "Geometry", mastery: 65, accuracy: 67 },
];

const defaultStudyProgress = [
  { month: "1 May", mastery: 48, accuracy: 52 },
  { month: "15 May", mastery: 53, accuracy: 56 },
  { month: "1 Jun", mastery: 59, accuracy: 62 },
  { month: "15 Jun", mastery: 63, accuracy: 64 },
  { month: "1 Jul", mastery: 66, accuracy: 68 },
  { month: "17 Jul", mastery: 70, accuracy: 71 },
];

const defaultWeaknessData = [
  { topic: "Electromagnetism", score: 48 },
  { topic: "Geometry", score: 36 },
  { topic: "Thermodynamics", score: 30 },
  { topic: "Calculus", score: 25 },
  { topic: "Algebra", score: 12 },
];

const defaultHeatmapTopics = [
  { label: "Mechanics (9M)", score: 72, col: 1, row: 1 },
  { label: "Thermodynamics (7M)", score: 55, col: 2, row: 1 },
  { label: "Inorganic Chem. (6M)", score: 68, col: 3, row: 1 },
  { label: "Geometry (6M)", score: 64, col: 4, row: 1 },
  { label: "Calculus (7M)", score: 60, col: 2, row: 2 },
  { label: "Trigonometry (6M)", score: 61, col: 3, row: 2 },
  { label: "Algebra (8M)", score: 75, col: 1, row: 3 },
  { label: "Organic Chem. (7M)", score: 48, col: 2, row: 3 },
  { label: "Physical Chem. (6M)", score: 82, col: 3, row: 3 },
  { label: "Electromag. (6M)", score: 40, col: 4, row: 3 },
];

const defaultMicroWeakness = [
  { topic: "Electromagnetism", mastery: 58, accuracy: 62, attempted: 84 },
  { topic: "Physical Chemistry", mastery: 62, accuracy: 65, attempted: 79 },
  { topic: "Geometry", mastery: 64, accuracy: 67, attempted: 82 },
  { topic: "Trigonometry", mastery: 61, accuracy: 64, attempted: 76 },
];

const defaultActionPlan = [
  { task: "MCQ Practice – Electromagnetism", count: 15, duration: 45, priority: "Critical" },
  { task: "Revision – Physical Chemistry Concepts", count: 8, duration: 30, priority: "High" },
  { task: "MCQ Practice – Trigonometry", count: 12, duration: 35, priority: "High" },
];

const defaultRoadmapSteps = [
  {
    phase: "Phase 1", title: "Foundation", done: true,
    desc: "Cover NCERT basics for all subjects thoroughly",
    date: "1 May – 15 May",
    tasks: ["NCERT Physics Ch. 1–8", "NCERT Chemistry Ch. 1–6", "NCERT Maths Ch. 1–5"],
    badge: "Completed", progress: 100,
    color: "#16a34a", lightColor: "#f0fdf4", borderColor: "#bbf7d0",
  },
  {
    phase: "Phase 2", title: "Topic Mastery", done: true,
    desc: "Deep dive into each chapter with MCQ practice",
    date: "16 May – 15 Jun",
    tasks: ["500+ MCQs solved", "Chapter-wise tests done", "Formula sheets prepared"],
    badge: "Completed", progress: 100,
    color: "#16a34a", lightColor: "#f0fdf4", borderColor: "#bbf7d0",
  },
  {
    phase: "Phase 3", title: "Weak Area Fix", done: false,
    desc: "Focused practice on flagged weak topics",
    date: "16 Jun – 5 Jul",
    tasks: ["Electromagnetism deep dive", "Geometry problem sets", "Thermodynamics revision"],
    badge: "In Progress", progress: 45,
    color: "#f97316", lightColor: "#fff7ed", borderColor: "#fed7aa",
  },
  {
    phase: "Phase 4", title: "Mock Tests", done: false,
    desc: "Full-length JEE / NEET simulations with analysis",
    date: "6 Jul – 20 Jul",
    tasks: ["10 full mock tests", "Detailed analysis per test", "Time management practice"],
    badge: "Upcoming", progress: 0,
    color: "#94a3b8", lightColor: "#f8fafc", borderColor: "#e2e8f0",
  },
  {
    phase: "Phase 5", title: "Final Revision", done: false,
    desc: "Formula sheets, rapid revision & mental prep",
    date: "21 Jul – Exam Day",
    tasks: ["Formula sheet revision", "Last 5 year papers", "Mental & health prep"],
    badge: "Upcoming", progress: 0,
    color: "#94a3b8", lightColor: "#f8fafc", borderColor: "#e2e8f0",
  },
];

const defaultTodayPlan = [
  { time: "7:00 AM", task: "Electromagnetism – Faraday's Law", subject: "Physics", duration: "60 min", type: "Study" },
  { time: "8:30 AM", task: "MCQ Practice – Electromagnetism (15 Qs)", subject: "Physics", duration: "45 min", type: "Practice" },
  { time: "10:00 AM", task: "Physical Chemistry – Equilibrium", subject: "Chemistry", duration: "60 min", type: "Revision" },
  { time: "11:30 AM", task: "Trigonometry Problem Set", subject: "Mathematics", duration: "45 min", type: "Practice" },
  { time: "2:00 PM", task: "Geometry – Coordinate Geometry", subject: "Mathematics", duration: "60 min", type: "Study" },
  { time: "4:00 PM", task: "Full Chapter Test – Thermodynamics", subject: "Physics", duration: "30 min", type: "Test" },
];

const defaultKpiStats = [
  { label: "Overall Mastery Score (%)", value: 62, prev: "58", change: "+4%" },
  { label: "Questions Attempted", value: 847, prev: "723", change: "+17%" },
  { label: "Current Accuracy Rate (%)", value: 68, prev: "64", change: "+6%" },
  { label: "Est. Score Improvement (pts)", value: 42, prev: "28", change: "+50%" }
];

const defaultRevisionTopics = [
  { topic: "Electromagnetism", subject: "Physics", day: "Today", status: "pending", priority: "Critical", progress: 0 },
  { topic: "Thermodynamics", subject: "Physics", day: "Today", status: "pending", priority: "High", progress: 0 },
  { topic: "Organic Chemistry", subject: "Chemistry", day: "Tomorrow", status: "pending", priority: "High", progress: 30 },
  { topic: "Calculus", subject: "Mathematics", day: "Tomorrow", status: "pending", priority: "Medium", progress: 50 },
  { topic: "Trigonometry", subject: "Mathematics", day: "19 Jul", status: "pending", priority: "Medium", progress: 60 },
  { topic: "Physical Chemistry", subject: "Chemistry", day: "19 Jul", status: "completed", priority: "High", progress: 100 },
  { topic: "Mechanics", subject: "Physics", day: "20 Jul", status: "completed", priority: "Low", progress: 100 },
  { topic: "Algebra", subject: "Mathematics", day: "20 Jul", status: "pending", priority: "Low", progress: 75 },
];

const navItems = [
  { icon: "⊞", label: "Dashboard", id: "dashboard" },
  { icon: "📈", label: "Performance", id: "performance" },
  { icon: "🗺️", label: "Roadmap", id: "roadmap" },
  { icon: "🔁", label: "Revision", id: "revision" },
  { icon: "📋", label: "Action Plan", id: "action" },
  { icon: "📚", label: "Subjects", id: "subjects" },
  { icon: "🧪", label: "Mock Tests", id: "mock" },
  { icon: "⚙️", label: "Settings", id: "settings" },
];

function heatColor(score: number) {
  if (score >= 70) return { bg: "#15803d", text: "#fff" };
  if (score >= 55) return { bg: "#b45309", text: "#fff" };
  return { bg: "#b91c1c", text: "#fff" };
}

function priorityBadge(p: string) {
  if (p === "Critical") return "bg-red-100 text-red-700 border border-red-300 font-bold";
  if (p === "High") return "bg-orange-100 text-orange-700 border border-orange-300 font-semibold";
  if (p === "Medium") return "bg-yellow-100 text-yellow-700 border border-yellow-300 font-semibold";
  return "bg-green-100 text-green-700 border border-green-300";
}

function taskTypeBadge(t: string) {
  if (t === "Study") return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
  if (t === "Practice") return { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" };
  if (t === "Revision") return { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" };
  if (t === "Test") return { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" };
  return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
      <h2 className="text-[13px] font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-orange-500 rounded-full inline-block shrink-0" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function KpiCard({ label, value, prev, change }: { label: string; value: string | number; prev: string; change: string }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-snug">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-black text-gray-900 leading-none">{value}</span>
        <span className="text-orange-500 text-base mb-0.5">▲</span>
      </div>
      <p className="text-xs text-gray-500">
        vs prev <span className="text-gray-700 font-semibold">{prev}</span>{" "}
        <span className="text-emerald-600 font-bold">({change})</span>
      </p>
    </div>
  );
}

function RoadmapView({ roadmapSteps, todayPlan }: { roadmapSteps: any[], todayPlan: any[] }) {
  const completedCount = roadmapSteps.filter((s) => s.badge === "Completed").length;
  const inProgressCount = roadmapSteps.filter((s) => s.badge === "In Progress").length;
  const totalDays = 82, daysDone = 47;

  return (
    <div className="p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Study Roadmap</h1>
          <p className="text-sm text-gray-500">Your complete structured path from foundation to exam day.</p>
        </div>
        <div className="flex gap-3">
          {[
            { count: completedCount, label: "Completed", bg: "bg-emerald-50", border: "border-emerald-200", color: "text-emerald-600", subColor: "text-emerald-500" },
            { count: inProgressCount, label: "In Progress", bg: "bg-orange-50", border: "border-orange-200", color: "text-orange-500", subColor: "text-orange-400" },
            { count: roadmapSteps.length - completedCount - inProgressCount, label: "Upcoming", bg: "bg-slate-50", border: "border-slate-200", color: "text-slate-600", subColor: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-4 py-2 text-center`}>
              <p className={`text-xl font-black ${s.color}`}>{s.count}</p>
              <p className={`text-[10px] font-bold ${s.subColor} uppercase tracking-wide`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-extrabold text-gray-800">Overall Roadmap Progress</p>
            <p className="text-xs text-gray-400 mt-0.5">Day {daysDone} of {totalDays} · Exam approaching fast!</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-orange-500">{Math.round((daysDone / totalDays) * 100)}%</p>
            <p className="text-[10px] text-gray-400 font-semibold">{totalDays - daysDone} days left</p>
          </div>
        </div>
        <div className="h-3 bg-orange-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{ width: `${(daysDone / totalDays) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
          <span>1 May</span><span>15 May</span><span>15 Jun</span><span>5 Jul</span><span>20 Jul</span><span>Exam Day</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 space-y-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Study Phases</p>
          {roadmapSteps.map((step, i) => (
            <div key={i} className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ backgroundColor: step.lightColor, borderColor: step.borderColor }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-sm border-2" style={{ backgroundColor: step.color, borderColor: step.color, color: "#fff" }}>
                  {step.badge === "Completed" ? "✓" : step.badge === "In Progress" ? "▶" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color: step.color }}>{step.phase}</span>
                      <span className="text-base font-extrabold text-gray-900">{step.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-semibold">{step.date}</span>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold border" style={{
                        backgroundColor: step.badge === "Completed" ? "#dcfce7" : step.badge === "In Progress" ? "#fff7ed" : "#f1f5f9",
                        color: step.badge === "Completed" ? "#15803d" : step.badge === "In Progress" ? "#f97316" : "#64748b",
                        borderColor: step.badge === "Completed" ? "#bbf7d0" : step.badge === "In Progress" ? "#fed7aa" : "#e2e8f0",
                      }}>{step.badge}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{step.desc}</p>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden mb-3 border border-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${step.progress}%`, backgroundColor: step.color }} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step.tasks && step.tasks.map((task: string, j: number) => (
                      <span key={j} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border" style={{ backgroundColor: "#fff", borderColor: step.borderColor, color: step.badge === "Upcoming" ? "#94a3b8" : "#374151" }}>
                        {step.badge === "Completed" ? "✓ " : ""}{task}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Today's Schedule · 17 Jul</p>
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="bg-orange-500 px-5 py-3 flex items-center justify-between">
              <p className="text-white font-extrabold text-sm">📅 Daily Study Plan</p>
              <span className="text-orange-100 text-xs font-semibold">{todayPlan.reduce((acc, t) => acc + parseInt(t.duration), 0)} min total</span>
            </div>
            <div className="divide-y divide-orange-50">
              {todayPlan.map((item, i) => {
                const badge = taskTypeBadge(item.type);
                return (
                  <div key={i} className="px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50/40 transition-colors">
                    <div className="shrink-0 w-16 text-right">
                      <p className="text-[11px] font-black text-orange-500">{item.time}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-center pt-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.text }} />
                      {i < todayPlan.length - 1 && <div className="w-0.5 h-8 bg-orange-100 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-800 leading-snug mb-1">{item.task}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-gray-400">{item.subject}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] font-semibold text-gray-400">{item.duration}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold border" style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}>{item.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 bg-orange-50 border-t border-orange-100 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-500">6 sessions planned</p>
              <div className="flex gap-2 text-[10px] font-bold">
                {["Study", "Practice", "Revision", "Test"].map((t) => {
                  const b = taskTypeBadge(t);
                  return <span key={t} className="px-2 py-0.5 rounded-md border" style={{ backgroundColor: b.bg, color: b.text, borderColor: b.border }}>{t}</span>;
                })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Study Hours Today", value: "5.5 hrs", icon: "📖", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { label: "Sessions Done", value: "2 / 6", icon: "✅", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "Topics Due Today", value: "3", icon: "📌", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
              { label: "Streak", value: "12 days 🔥", icon: "⚡", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 font-semibold leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevisionView({ onNavigate, revisionTopics }: { onNavigate: (id: string) => void, revisionTopics: any[] }) {
  const total = revisionTopics.length;
  const completed = revisionTopics.filter((r) => r.status === "completed").length;
  const remaining = total - completed;
  const overallPercent = Math.round((completed / total) * 100);
  const todayTopics = revisionTopics.filter((r) => r.day === "Today");
  const tomorrowTopics = revisionTopics.filter((r) => r.day === "Tomorrow");
  const upcomingTopics = revisionTopics.filter((r) => r.day !== "Today" && r.day !== "Tomorrow");

  const subjectStats = ["Physics", "Chemistry", "Mathematics"].map((subj) => {
    const subjTopics = revisionTopics.filter((r) => r.subject === subj);
    const subjDone = subjTopics.filter((r) => r.status === "completed").length;
    const subjPct = Math.round((subjDone / subjTopics.length) * 100);
    const color = subj === "Physics" ? "#f97316" : subj === "Chemistry" ? "#3b82f6" : "#8b5cf6";
    const bgColor = subj === "Physics" ? "#fff7ed" : subj === "Chemistry" ? "#eff6ff" : "#f5f3ff";
    const borderColor = subj === "Physics" ? "#fed7aa" : subj === "Chemistry" ? "#bfdbfe" : "#ddd6fe";
    return { subj, subjDone, subjTotal: subjTopics.length, subjPct, color, bgColor, borderColor };
  });

  const TopicCard = ({ r, barColor }: { r: typeof revisionTopics[0]; barColor: string }) => (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${r.status === "completed" ? "border-emerald-100" : "border-orange-100"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className={`text-[13px] font-bold ${r.status === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>{r.topic}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${priorityBadge(r.priority)}`}>{r.priority}</span>
          {r.status === "completed" && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold">Done ✓</span>}
        </div>
        <p className="text-[11px] text-gray-400 font-semibold mb-2">{r.subject}{r.day !== "Today" && r.day !== "Tomorrow" ? ` · ${r.day}` : ""}</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${r.progress}%`, backgroundColor: r.status === "completed" ? "#34d399" : barColor }} />
        </div>
      </div>
      <div className="text-right shrink-0 w-16">
        <p className={`text-xl font-black ${r.status === "completed" ? "text-emerald-500" : "text-gray-900"}`}>{r.progress}%</p>
        <p className="text-[10px] text-gray-400 font-semibold">Progress</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">Revision Planner</h1>
          <p className="text-sm text-gray-500">Track your revision topics, schedule and overall progress.</p>
        </div>
        <button onClick={() => onNavigate("dashboard")} className="text-xs font-bold text-orange-500 border border-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition">← Back to Dashboard</button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Topics", value: total, color: "text-gray-900" },
          { label: "Completed", value: completed, color: "text-emerald-600" },
          { label: "Remaining", value: remaining, color: "text-orange-500" },
          { label: "Overall Progress", value: `${overallPercent}%`, color: "text-gray-900" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-5">
        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
          <span>Revision Completion</span>
          <span className="text-orange-600">{completed} of {total} topics done</span>
        </div>
        <div className="h-3 bg-orange-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${overallPercent}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {subjectStats.map(({ subj, subjDone, subjTotal, subjPct, color, bgColor, borderColor }) => (
            <div key={subj} className="rounded-xl p-3" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[13px] font-bold text-gray-800">{subj}</p>
                <p className="text-[13px] font-black" style={{ color }}>{subjPct}%</p>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full transition-all" style={{ width: `${subjPct}%`, backgroundColor: color }} />
              </div>
              <p className="text-[10px] text-gray-500 font-semibold">{subjDone} of {subjTotal} topics done</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {[
          { title: "Today's Revision", dot: "bg-red-500", badge: "bg-red-100 text-red-600 border-red-200", topics: todayTopics, barColor: "#f97316" },
          { title: "Tomorrow's Revision", dot: "bg-orange-400", badge: "bg-orange-100 text-orange-600 border-orange-200", topics: tomorrowTopics, barColor: "#fb923c" },
          { title: "Upcoming Revision", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200", topics: upcomingTopics, barColor: "#fdba74" },
        ].map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${col.dot} inline-block shrink-0`} /> {col.title}
              <span className={`ml-auto text-[10px] border px-2 py-0.5 rounded-full font-bold ${col.badge}`}>{col.topics.length} topics</span>
            </h2>
            <div className="space-y-3">{col.topics.map((r, i) => <TopicCard key={i} r={r} barColor={col.barColor} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI DYNAMIC STATE INTEGRATION
  const [microWeakness, setMicroWeakness] = useState<any[]>(defaultMicroWeakness);
  const [roadmapSteps, setRoadmapSteps] = useState<any[]>(defaultRoadmapSteps);
  const [revisionTopics, setRevisionTopics] = useState<any[]>(defaultRevisionTopics);

  const [subjectPerformance, setSubjectPerformance] = useState<any[]>(defaultSubjectPerformance);
  const [studyProgress, setStudyProgress] = useState<any[]>(defaultStudyProgress);
  const [weaknessData, setWeaknessData] = useState<any[]>(defaultWeaknessData);
  const [heatmapTopics, setHeatmapTopics] = useState<any[]>(defaultHeatmapTopics);
  const [actionPlan, setActionPlan] = useState<any[]>(defaultActionPlan);
  const [todayPlan, setTodayPlan] = useState<any[]>(defaultTodayPlan);
  const [kpiStats, setKpiStats] = useState<any[]>(defaultKpiStats);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [needsInit, setNeedsInit] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAIReferred = window.location.search.includes("data=");
      if (isAIReferred && !aiReady) {
        setNeedsInit(true);
      }
    }
  }, [aiReady]);

  const runAI = async () => {
    setAiGenerating(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const quizRaw = urlParams.get("data");
      const quizObj = quizRaw ? JSON.parse(decodeURIComponent(quizRaw)) : null;
      
      const obReady = localStorage.getItem("onboardingData");
      const obData = obReady ? JSON.parse(obReady) : {};

      const payload = {
        domain: localStorage.getItem("domain") || "Custom",
        class: obData.class || "Student",
        prepLevel: obData.level || "Intermediate",
        journey: obData.journey || "Standard path",
        subjectAnalysis: quizObj?.subjectAnalysis,
        topicAnalysis: quizObj?.topicAnalysis
      };

      const res = await fetch("/api/dashboard/generate", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      const generatedJSON = await res.json();
      
      if (!res.ok) {
          throw new Error(generatedJSON.error_message || "Server crashed processing your request.");
      }

      if (generatedJSON.microWeakness) setMicroWeakness(generatedJSON.microWeakness);
      if (generatedJSON.roadmapSteps) setRoadmapSteps(generatedJSON.roadmapSteps);
      if (generatedJSON.revisionTopics) setRevisionTopics(generatedJSON.revisionTopics);
      if (generatedJSON.subjectPerformance) setSubjectPerformance(generatedJSON.subjectPerformance);
      if (generatedJSON.studyProgress) setStudyProgress(generatedJSON.studyProgress);
      if (generatedJSON.weaknessData) setWeaknessData(generatedJSON.weaknessData);
      if (generatedJSON.heatmapTopics) setHeatmapTopics(generatedJSON.heatmapTopics);
      if (generatedJSON.actionPlan) setActionPlan(generatedJSON.actionPlan);
      if (generatedJSON.todayPlan) setTodayPlan(generatedJSON.todayPlan);
      if (generatedJSON.kpiStats) setKpiStats(generatedJSON.kpiStats);
      
      setAiReady(true);
      setNeedsInit(false);
      setAiError(null);
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "Failed to generate AI roadmap.");
    } finally {
      setAiGenerating(false);
    }
  };

  const revisionCompleted = revisionTopics.filter((r) => r.status === "completed").length;
  const revisionTotal = revisionTopics.length;
  const revisionPct = Math.round((revisionCompleted / revisionTotal) * 100) || 0;
  const todayRevision = revisionTopics.filter((r) => r.day === "Today");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-orange-50 overflow-hidden relative" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* GLOWING AI INITIALIZATION WALL */}
      {needsInit && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-xl flex items-center justify-center">
            <div className="w-[500px] bg-white rounded-3xl shadow-2xl p-8 text-center border border-orange-200">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-orange-500">✨</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Initialize AI Dashboard</h2>
                <p className="text-gray-500 mb-8">We've fused your Onboarding Profile and Quiz Metrics. Our AI is ready to construct your entire platform.</p>
                
                {aiError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
                        System Alert: {aiError}
                    </div>
                )}

                <button onClick={runAI} disabled={aiGenerating} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50">
                    {aiGenerating ? "Generating Neural Roadmap... ✨" : "Compile AI Dashboard →"}
                </button>
            </div>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} transition-all duration-300 bg-white border-r border-orange-100 shadow-md flex flex-col shrink-0 z-10`}>
        <div className={`flex items-center ${sidebarOpen ? "justify-between px-4" : "justify-center px-2"} py-4 border-b border-orange-100`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              {uploadedLogo ? (
                <img src={uploadedLogo} alt="Logo" className="h-8 object-contain" />
              ) : (
                <>
                  <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">V</div>
                  <div className="leading-tight">
                    <p className="text-sm font-extrabold text-gray-900">VIA</p>
                    <p className="text-[9px] text-gray-400 font-medium">Smart Study Platform</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            uploadedLogo ? (
              <img src={uploadedLogo} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm">V</div>
            )
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-7 h-7 rounded-lg border border-orange-200 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition text-xs font-bold ml-1">
            {sidebarOpen ? "◂" : "▸"}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => setActiveNav(item.id)} title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-semibold ${active ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"}`}>
                <span className={`text-base ${!sidebarOpen ? "mx-auto" : ""}`}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.id === "revision" && (
                  <span className="ml-auto text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold border border-red-200">{revisionTotal - revisionCompleted} left</span>
                )}
                {sidebarOpen && item.id === "roadmap" && (
                  <span className="ml-auto text-[9px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={`border-t border-orange-100 p-3 flex items-center gap-3 ${!sidebarOpen ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow">AK</div>
          {sidebarOpen && (
            <div className="leading-tight min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">Aryan Kumar</p>
              <p className="text-[10px] text-gray-400 truncate">JEE Advanced 2024</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-orange-100 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center">
            {/* If logo uploaded: show ONLY the logo, no button */}
            {uploadedLogo ? (
              /* Clicking the logo lets them re-upload if they want */
              <img
                src={uploadedLogo}
                alt="Logo"
                title="Click to change logo"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 object-contain cursor-pointer"
              />
            ) : (
              /* No logo yet: show Upload button */
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border border-orange-300 text-orange-600 text-xs px-3 py-2 rounded-xl hover:bg-orange-50 active:bg-orange-100 transition font-semibold shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Logo
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-semibold cursor-pointer hover:text-orange-500 transition">🔔 3 alerts</span>
            <div className="bg-orange-500 text-white text-xs px-4 py-1.5 rounded-lg font-bold shadow">Updated: 17th Jul 2023</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeNav === "roadmap" && <RoadmapView roadmapSteps={roadmapSteps} todayPlan={todayPlan} />}
          {activeNav === "revision" && <RevisionView onNavigate={setActiveNav} revisionTopics={revisionTopics} />}

          {activeNav === "dashboard" && (
            <>
              <div className="bg-white border-b border-orange-100 px-6 py-3 flex items-center gap-6 shrink-0">
                {[{ label: "Start date", value: "23/05/2023" }, { label: "End date", value: "16/07/2023" }].map((d) => (
                  <div key={d.label}>
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">{d.label}</p>
                    <div className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50">{d.value}</div>
                  </div>
                ))}
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Subject</p>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 w-44">
                    <option>All</option><option>Physics</option><option>Chemistry</option><option>Mathematics</option>
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Difficulty Level</p>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 w-44">
                    <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
              </div>

              <main className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  {kpiStats.map((kpi, idx) => (
                    <KpiCard key={idx} label={kpi.label} value={kpi.value} prev={kpi.prev} change={kpi.change} />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CardShell title="Topic-by-Topic Micro Weakness Analysis">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-orange-50">
                          {["Topic", "Mastery (%)", "Accuracy (%)", "Questions Attempted"].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 text-orange-700 font-bold text-[11px] uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {microWeakness.map((row, i) => (
                          <tr key={row.topic} className={i % 2 === 0 ? "bg-white" : "bg-orange-50/50"}>
                            <td className="px-3 py-2.5 text-[13px] font-semibold text-gray-800">{row.topic}</td>
                            <td className="px-3 py-2.5 text-[13px] text-gray-700">{row.mastery}</td>
                            <td className="px-3 py-2.5 text-[13px] text-gray-700">{row.accuracy}</td>
                            <td className="px-3 py-2.5 text-[13px] text-gray-700">{row.attempted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardShell>

                  <CardShell title="Today's Action Plan">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-orange-50">
                          {["Task", "Count", "Duration (min)", "Priority"].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 text-orange-700 font-bold text-[11px] uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {actionPlan.map((row, i) => (
                          <tr key={row.task} className={i % 2 === 0 ? "bg-white" : "bg-orange-50/50"}>
                            <td className="px-3 py-2.5 text-[13px] font-medium text-gray-800">{row.task}</td>
                            <td className="px-3 py-2.5 text-[13px] text-gray-700">{row.count}</td>
                            <td className="px-3 py-2.5 text-[13px] text-gray-700">{row.duration}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs ${priorityBadge(row.priority)}`}>{row.priority}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardShell>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CardShell title="Revision Progress Overview">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-2xl font-black text-gray-900">{revisionPct}% <span className="text-sm font-semibold text-gray-400">complete</span></p>
                        <p className="text-xs text-gray-500 mt-0.5">{revisionCompleted} of {revisionTotal} topics revised</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-orange-500">{revisionTotal - revisionCompleted} remaining</p>
                        <button onClick={() => setActiveNav("revision")} className="mt-1 text-[11px] font-bold text-white bg-orange-500 px-3 py-1 rounded-lg hover:bg-orange-600 transition">View All →</button>
                      </div>
                    </div>
                    <div className="h-2.5 bg-orange-100 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${revisionPct}%` }} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Today's Revision Topics</p>
                    <div className="space-y-2">
                      {todayRevision.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-orange-50 rounded-xl px-3 py-2">
                          <div>
                            <p className="text-[13px] font-bold text-gray-800">{r.topic}</p>
                            <p className="text-[10px] text-gray-400">{r.subject}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${priorityBadge(r.priority)}`}>{r.priority}</span>
                        </div>
                      ))}
                    </div>
                  </CardShell>

                  <CardShell title="Revision by Subject">
                    <div className="space-y-4 pt-1">
                      {["Physics", "Chemistry", "Mathematics"].map((subj) => {
                        const subjTopics = revisionTopics.filter((r) => r.subject === subj);
                        const subjDone = subjTopics.filter((r) => r.status === "completed").length;
                        const subjPct = Math.round((subjDone / subjTopics.length) * 100);
                        const color = subj === "Physics" ? "#f97316" : subj === "Chemistry" ? "#3b82f6" : "#8b5cf6";
                        const bgColor = subj === "Physics" ? "bg-orange-50" : subj === "Chemistry" ? "bg-blue-50" : "bg-purple-50";
                        return (
                          <div key={subj} className={`rounded-xl p-3 ${bgColor}`}>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[13px] font-bold text-gray-800">{subj}</p>
                              <p className="text-[13px] font-black" style={{ color }}>{subjPct}%</p>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden mb-1.5">
                              <div className="h-full rounded-full transition-all" style={{ width: `${subjPct}%`, backgroundColor: color }} />
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold">{subjDone} of {subjTopics.length} topics done</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardShell>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CardShell title="Subject Performance Comparison">
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={subjectPerformance} barCategoryGap="28%" barGap={3}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fde8d8" />
                        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "#444" }} />
                        <YAxis domain={[50, 80]} tick={{ fontSize: 11, fill: "#444" }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#444" }} />
                        <Bar dataKey="mastery" name="Mastery Score" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="accuracy" name="Accuracy Rate" fill="#fdba74" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardShell>

                  <CardShell title="Topic Mastery Distribution">
                    <div className="flex items-center gap-5 mb-3">
                      {[{ color: "#b91c1c", label: "Low  <55" }, { color: "#b45309", label: "Medium  55–69" }, { color: "#15803d", label: "High  ≥70" }].map((l) => (
                        <span key={l.label} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                          <span className="w-3 h-3 rounded-sm inline-block shrink-0" style={{ backgroundColor: l.color }} />
                          {l.label}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 6, height: 165 }}>
                      {heatmapTopics.map((t) => {
                        const { bg, text } = heatColor(t.score);
                        return (
                          <div key={t.label} title={`${t.label} — Score: ${t.score}%`}
                            className="rounded-xl flex flex-col items-center justify-center text-center px-1.5 cursor-default transition-transform hover:scale-105 select-none"
                            style={{ backgroundColor: bg, color: text, gridColumn: t.col, gridRow: t.row, lineHeight: 1.3, boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 900, marginTop: 2 }}>{t.score}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardShell>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CardShell title="Critical Weakness Identification">
                    <ResponsiveContainer width="100%" height={195}>
                      <BarChart layout="vertical" data={weaknessData} margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fde8d8" />
                        <XAxis type="number" domain={[0, 55]} tick={{ fontSize: 11, fill: "#444" }} />
                        <YAxis dataKey="topic" type="category" width={120} tick={{ fontSize: 11, fill: "#333" }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="score" name="Weakness Score" fill="#f97316" radius={[0, 5, 5, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardShell>

                  <CardShell title="Study Progress Over Time">
                    <ResponsiveContainer width="100%" height={195}>
                      <LineChart data={studyProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fde8d8" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#444" }} />
                        <YAxis domain={[40, 80]} tick={{ fontSize: 11, fill: "#444" }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#444" }} />
                        <Line type="monotone" dataKey="mastery" name="Mastery Score" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: "#f97316" }} />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy Rate" stroke="#fdba74" strokeWidth={2.5} dot={{ r: 4, fill: "#fdba74" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardShell>
                </div>
              </main>

              <footer className="text-center text-[11px] text-gray-400 py-3 border-t border-orange-100 mt-1">
                Powered by VIA · Smart Study Platform
              </footer>
            </>
          )}

          {!["dashboard", "roadmap", "revision"].includes(activeNav) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 pb-20">
              <span className="text-6xl">🚧</span>
              <p className="text-base font-bold text-gray-600">{navItems.find((n) => n.id === activeNav)?.label} — Coming Soon</p>
              <p className="text-sm text-gray-400">This section is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}