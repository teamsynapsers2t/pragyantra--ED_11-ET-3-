"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";

interface Question {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  question: string;
  options: string[];
  answer: any;
  explanation: string;
  difficulty: string;
  exam: string;
  year: number;
  question_type: string;
}

interface Chapter {
  name: string;
  topics: string[];
}

interface WeaknessSignal {
  id: string;
  conceptId: number;
  conceptName: string;
  signal: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severityScore: number;
  confidenceScore: number;
  evidence: any;
  insightMessage?: string;
  createdAt: string;
}

// Numerical tolerance matching the server (±0.01 or 0.1% relative)
function isNumericallyClose(userVal: number, correctVal: number): boolean {
  if (isNaN(userVal) || isNaN(correctVal)) return false;
  const tolerance = Math.max(0.01, Math.abs(correctVal) * 0.001);
  return Math.abs(userVal - correctVal) <= tolerance;
}

// Session end effect for practice mode — fires once when practice finishes
function PracticeEndEffect({ sessionId, practiceAnswers }: { sessionId: string | null; practiceAnswers: any[] }) {
  const endedRef = useRef(false);

  useEffect(() => {
    if (endedRef.current || !sessionId) return;
    endedRef.current = true;

    const correct = practiceAnswers.filter((a: any) => a.correct).length;
    const total = practiceAnswers.length;

    fetch("/api/sessions/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        questionsAttempted: total,
        questionsCorrect: correct,
        questionsSkipped: 0,
      }),
    }).catch((err) => console.warn("Could not end session:", err));
  }, [sessionId, practiceAnswers]);

  return null;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Navigation and Selection State
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  // Chapters State
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Weakness Signals State
  const [rootFlaws, setRootFlaws] = useState<WeaknessSignal[]>([]);
  const [allSignals, setAllSignals] = useState<WeaknessSignal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);

  // Progress/Stats State
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Logo Upload State
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Practice Mode State
  const [activePractice, setActivePractice] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [numericalInput, setNumericalInput] = useState("");
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrectState, setIsCorrectState] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<any[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Session tracking for practice mode
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);

  // 1. Fetch Weakness Signals
  useEffect(() => {
    async function fetchWeakness() {
      try {
        const res = await fetch("/api/weakness");
        if (res.ok) {
          const data = await res.json();
          const signals = data.signals || [];
          setAllSignals(signals);

          // Filter root flaws and rank by root_flaw_score descending
          const flaws = signals
            .filter((s: any) => s.signal === "root_flaw")
            .sort((a: any, b: any) => {
              const scoreA = a.evidence?.root_flaw_score || 0;
              const scoreB = b.evidence?.root_flaw_score || 0;
              return scoreB - scoreA;
            });
          setRootFlaws(flaws);
        }
      } catch (err) {
        console.error("Failed to fetch weakness signals:", err);
      } finally {
        setLoadingSignals(false);
      }
    }
    fetchWeakness();
  }, []);

  // 2. Fetch Attempts Stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) {
          const data = await res.json();
          const attempts = data.attempts || [];
          setAttemptsCount(attempts.length);

          if (attempts.length > 0) {
            const correctCount = attempts.filter((a: any) => a.isCorrect).length;
            setAccuracyRate(Math.round((correctCount / attempts.length) * 100));
          }
        }
      } catch (err) {
        console.error("Failed to fetch attempts progress stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [activePractice]);

  // 3. Fetch Chapters when active subject changes
  useEffect(() => {
    const subj = activeSubject;
    if (!subj) {
      setChapters([]);
      return;
    }

    async function fetchChapters(subjectName: string) {
      setLoadingChapters(true);
      try {
        const res = await fetch(`/api/chapters?subject=${encodeURIComponent(subjectName)}`);
        if (res.ok) {
          const data = await res.json();
          setChapters(data.chapters || []);
        }
      } catch (err) {
        console.error("Failed to load chapters:", err);
      } finally {
        setLoadingChapters(false);
      }
    }
    fetchChapters(subj);
  }, [activeSubject]);

  // 4. Handle MathJax Typesetting on Question Transition
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).MathJax) {
      setTimeout(() => {
        try {
          (window as any).MathJax.typesetPromise?.();
        } catch (e) {
          console.error("MathJax typesetting error:", e);
        }
      }, 100);
    }
  }, [questions, currentQuestionIndex, showExplanation, activePractice]);

  // 5. Timer for practice questions
  useEffect(() => {
    if (activePractice && questions.length > 0 && !isAnswerChecked && !loadingQuestions && currentQuestionIndex < questions.length) {
      setTimeSpent(0);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activePractice, questions, currentQuestionIndex, isAnswerChecked, loadingQuestions]);

  // Launch Practice Session
  const startPractice = async (subj: string, chap: string | null, top: string | null) => {
    setActiveSubject(subj);
    setActiveChapter(chap);
    setActiveTopic(top);
    setActivePractice(true);
    setLoadingQuestions(true);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setNumericalInput("");
    setIsAnswerChecked(false);
    setIsCorrectState(null);
    setShowExplanation(false);
    setPracticeAnswers([]);
    setTimeSpent(0);

    // Start a new session
    try {
      const sessionRes = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "dashboard", subject: subj, chapter: chap, topic: top }),
      });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setPracticeSessionId(sessionData.sessionId);
      }
    } catch (err) {
      console.warn("Could not start session:", err);
    }

    try {
      let url = `/api/questions?subject=${encodeURIComponent(subj)}&limit=10`;
      if (chap) url += `&chapter=${encodeURIComponent(chap)}`;
      if (top) url += `&topic=${encodeURIComponent(top)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error("Error fetching practice questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // 6. Check for search parameters on load to trigger auto-practice
  useEffect(() => {
    const subj = searchParams.get("subject");
    const chap = searchParams.get("chapter");
    const top = searchParams.get("topic");

    if (subj) {
      startPractice(subj, chap, top);
    }
  }, [searchParams]);

  const handleCheckAnswer = async () => {
    if (isAnswerChecked) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isNumerical = currentQuestion.question_type === "numerical";

    if (isNumerical && !numericalInput.trim()) return;
    if (!isNumerical && selectedOption === null) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswerChecked(true);

    // Local correctness check (for instant UI feedback)
    let isCorrect = false;
    if (isNumerical) {
      const userVal = parseFloat(numericalInput.trim());
      const correctVal = parseFloat(String(currentQuestion.answer).trim());
      isCorrect = isNumericallyClose(userVal, correctVal);
    } else {
      isCorrect = selectedOption === currentQuestion.answer;
    }

    setIsCorrectState(isCorrect);

    // Save answer locally for summary screen
    setPracticeAnswers((prev) => [
      ...prev,
      {
        subject: currentQuestion.subject,
        topic: currentQuestion.topic || "General",
        correct: isCorrect,
        time: timeSpent,
      },
    ]);

    // Send attempt to Supabase (trigger fires fn_apply_attempt automatically)
    try {
      const letters = ["A", "B", "C", "D", "E"];
      const submitVal = isNumerical ? numericalInput.trim() : letters[selectedOption!];

      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOption: submitVal,
          timeTakenMs: timeSpent * 1000,
          sessionId: practiceSessionId,
          changedAnswerCount: 0,
          openedHint: false,
          openedSolution: false,
          confidenceRating: null,
        }),
      });

      // Use server's authoritative isCorrect
      if (res.ok) {
        const data = await res.json();
        if (data.isCorrect !== undefined && data.isCorrect !== isCorrect) {
          setIsCorrectState(data.isCorrect);
          setPracticeAnswers((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].correct = data.isCorrect;
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn("Could not submit attempt:", err);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
    setNumericalInput("");
    setIsAnswerChecked(false);
    setIsCorrectState(null);
    setShowExplanation(false);
    setTimeSpent(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const cleanLabel = (str: string) => {
    if (!str) return "";
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSeverityStyle = (severity: string) => {
    const s = (severity || "").toLowerCase();
    switch (s) {
      case "critical":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "high":
        return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "low":
      default:
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-[#e2e8f0] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Hidden file input for logo */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      {/* Sidebar Panel */}
      <aside className="w-72 bg-[#0d1527] border-r border-[#1e293b] flex flex-col shrink-0 z-10">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {uploadedLogo ? (
              <img
                src={uploadedLogo}
                alt="Custom Logo"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 object-contain cursor-pointer rounded"
              />
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md cursor-pointer hover:bg-orange-600 transition"
              >
                V
              </div>
            )}
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-white">VIA</p>
              <p className="text-[9px] text-gray-500 font-medium">Smart Study Platform</p>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 font-black rounded-full">
            V1.2
          </span>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          
          {/* Dashboard Home */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveSubject(null);
                setActiveChapter(null);
                setActiveTopic(null);
                setActivePractice(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm font-bold border ${
                !activeSubject && !activePractice
                  ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/10"
                  : "text-gray-400 hover:text-white bg-transparent border-transparent hover:bg-[#16223f]"
              }`}
            >
              <span>📊</span>
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => router.push("/audit")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm font-bold border text-gray-400 hover:text-white bg-transparent border-transparent hover:bg-[#16223f]"
            >
              <span>🛡️</span>
              <span>Auditor Panel</span>
            </button>
          </div>

          {/* Subject Selector Accordion */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
              Subjects & Topics
            </p>

            {["Physics", "Chemistry", "Mathematics"].map((subj) => {
              const isActiveSubj = activeSubject === subj;
              const emoji = subj === "Physics" ? "⚡" : subj === "Chemistry" ? "🧪" : "📐";
              
              return (
                <div key={subj} className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveSubject(subj);
                      setActiveChapter(null);
                      setActiveTopic(null);
                      setActivePractice(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition text-sm font-bold border ${
                      isActiveSubj
                        ? "bg-[#16223f] border-[#1e293b] text-white"
                        : "text-gray-400 hover:text-white bg-transparent border-transparent hover:bg-[#111a2f]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{emoji}</span>
                      <span>{subj}</span>
                    </div>
                    {isActiveSubj && (
                      <span className="text-xs text-orange-500 font-black">●</span>
                    )}
                  </button>

                  {/* Expanded chapters & topics */}
                  {isActiveSubj && (
                    <div className="pl-6 pr-2 py-1 space-y-2 border-l border-[#1e293b] ml-4 mt-1">
                      
                      {/* Button to practice whole subject */}
                      <button
                        onClick={() => startPractice(subj, null, null)}
                        className="w-full text-left py-1.5 px-3 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg hover:bg-orange-500/10"
                      >
                        🚀 Practice Whole Subject
                      </button>

                      {loadingChapters ? (
                        <p className="text-[10px] text-gray-500 px-3">Loading topics...</p>
                      ) : chapters.length === 0 ? (
                        <p className="text-[10px] text-gray-500 px-3">No topics mapped</p>
                      ) : (
                        chapters.map((chap) => {
                          const isChapExpanded = expandedChapter === chap.name;
                          return (
                            <div key={chap.name} className="space-y-1">
                              {/* Chapter Accordion Trigger */}
                              <button
                                onClick={() => setExpandedChapter(isChapExpanded ? null : chap.name)}
                                className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-bold flex justify-between items-center transition ${
                                  activeChapter === chap.name
                                    ? "bg-[#1e293b] text-white"
                                    : "text-gray-400 hover:text-white hover:bg-[#111a2f]"
                                }`}
                              >
                                <span className="truncate flex-1 pr-1">{chap.name}</span>
                                <span className="text-[9px] text-gray-500 shrink-0">
                                  {isChapExpanded ? "▲" : "▼"}
                                </span>
                              </button>

                              {/* Chapter topics */}
                              {isChapExpanded && (
                                <div className="pl-3 py-1 space-y-1">
                                  {/* Practice whole chapter option */}
                                  <button
                                    onClick={() => startPractice(subj, chap.name, null)}
                                    className="w-full text-left py-1 px-2 text-[10px] font-bold text-gray-400 hover:text-white transition-colors border-l border-orange-500/30"
                                  >
                                    📖 Practice Entire Chapter
                                  </button>

                                  {chap.topics.map((topic) => (
                                    <button
                                      key={topic}
                                      onClick={() => startPractice(subj, chap.name, topic)}
                                      className={`w-full text-left py-1 px-2 rounded-md text-[10px] font-medium truncate block transition ${
                                        activeTopic === topic && activePractice
                                          ? "text-orange-400 font-extrabold bg-orange-500/5"
                                          : "text-gray-500 hover:text-gray-300"
                                      }`}
                                      title={cleanLabel(topic)}
                                    >
                                      • {cleanLabel(topic)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#1e293b] flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 scale-95">
              <UserButton />
            </div>
            {isLoaded && user && (
              <div className="leading-tight min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user.fullName || "Student"}
                </p>
                <p className="text-[9px] text-gray-500 truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => router.push("/weakness-report")}
            className="text-[10px] font-black text-orange-500 hover:text-orange-400 transition"
            title="View weakness report page"
          >
            Report →
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Glow effects */}
        <div className="absolute w-[600px] h-[600px] bg-orange-500/5 blur-[150px] rounded-full top-[-100px] right-[-100px] pointer-events-none" />
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full bottom-[-100px] left-[-100px] pointer-events-none" />

        {/* Top Header Panel */}
        <header className="h-16 bg-[#0d1527]/80 backdrop-blur border-b border-[#1e293b] px-8 flex items-center justify-between shrink-0 relative z-10">
          <div>
            {activePractice ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Practice Session</span>
                <span className="text-gray-600">/</span>
                <span className="text-orange-500 font-bold">{activeSubject}</span>
                {activeChapter && (
                  <>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-300 font-semibold truncate max-w-[150px] inline-block align-bottom">{activeChapter}</span>
                  </>
                )}
                {activeTopic && (
                  <>
                    <span className="text-gray-600">/</span>
                    <span className="text-white font-extrabold truncate max-w-[150px] inline-block align-bottom">{cleanLabel(activeTopic)}</span>
                  </>
                )}
              </div>
            ) : (
              <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full inline-block" />
                {activeSubject ? `${activeSubject} Overview` : "Academic Dashboard Overview"}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-4">
            {activePractice && (
              <button
                onClick={() => {
                  setActivePractice(false);
                  setActiveChapter(null);
                  setActiveTopic(null);
                }}
                className="text-xs text-rose-400 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/5 px-3 py-1.5 rounded-xl transition font-bold"
              >
                ✕ Close Practice
              </button>
            )}
            <div className="bg-[#16223f] border border-[#1e293b] text-gray-300 text-[10px] md:text-xs px-3 py-1.5 rounded-lg font-bold">
              🎓 Target: JEE Advanced
            </div>
          </div>
        </header>

        {/* Dynamic Inner Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          
          <AnimatePresence mode="wait">
            {!activePractice ? (
              
              /* ========================================================
                 MODE 1: DASHBOARD OVERVIEW MODE
                 ======================================================== */
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Greeting & Header */}
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                    Welcome back, {user?.firstName || "Student"}! ✨
                  </h2>
                  <p className="text-xs md:text-sm text-gray-400">
                    Track your conceptual mastery, identify root faults, and solve practice feeds.
                  </p>
                </div>

                {/* Progress KPI Card Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Overall Accuracy Rate",
                      value: loadingStats ? "..." : `${accuracyRate}%`,
                      subtext: "Across all subjects",
                      icon: "🎯",
                      color: "text-orange-500"
                    },
                    {
                      label: "Questions Attempted",
                      value: loadingStats ? "..." : attemptsCount,
                      subtext: "Logged attempts",
                      icon: "📝",
                      color: "text-blue-400"
                    },
                    {
                      label: "Active Root Flaws",
                      value: loadingSignals ? "..." : rootFlaws.length,
                      subtext: "Critical concept blocks",
                      icon: "⚠️",
                      color: "text-rose-400"
                    },
                    {
                      label: "Concept Coverage",
                      value: "74%",
                      subtext: "Estimated coverage",
                      icon: "📚",
                      color: "text-emerald-400"
                    }
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-5 hover:border-gray-700 transition duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {stat.label}
                        </span>
                        <span className="text-xl">{stat.icon}</span>
                      </div>
                      <p className="text-3xl font-black text-white mt-3 leading-none">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-2 font-medium">
                        {stat.subtext}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Flagship Engine: Root Flaws Detected */}
                <div className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent rounded-3xl border border-orange-500/20 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          Root Flaws Detected
                          <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md animate-pulse">
                            Flagship Diagnostic Engine
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          PAPER's prerequisite dependency analysis shows which foundation errors are causing your weaknesses.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push("/weakness-report")}
                      className="text-xs text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 font-bold transition"
                    >
                      Full Weakness Report →
                    </button>
                  </div>

                  {loadingSignals ? (
                    <div className="py-6 text-center text-gray-500 text-xs">Analyzing prerequisites...</div>
                  ) : rootFlaws.length === 0 ? (
                    <div className="bg-[#090d16]/50 border border-[#1e293b]/50 rounded-2xl p-6 text-center text-xs text-gray-400">
                      ✨ Excellent! No structural root flaws detected in your database yet. Run practice sessions to populate metrics.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {rootFlaws.slice(0, 3).map((flaw) => {
                        const rootConcept = flaw.evidence?.root_concept_name || "Prerequisite Concept";
                        const weakConcept = flaw.evidence?.weak_concept_name || "Target Concept";
                        const rootMastery = flaw.evidence?.root_mastery ?? 0;
                        const weakMastery = flaw.evidence?.weak_mastery ?? 0;
                        
                        return (
                          <div
                            key={flaw.id}
                            className="bg-[#0d1527] border border-[#1e293b] hover:border-orange-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition hover:scale-[1.01]"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${getSeverityStyle(flaw.severity)}`}>
                                  {flaw.severity}
                                </span>
                                <span className="text-[9px] text-gray-500 font-bold">
                                  Prereq Strength: {flaw.evidence?.relationship_strength || 8}/10
                                </span>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Actual Problem</p>
                                <p className="text-sm font-black text-orange-400">{cleanLabel(rootConcept)}</p>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Concept Suffered</p>
                                <p className="text-xs font-bold text-white leading-tight">{cleanLabel(weakConcept)}</p>
                              </div>

                              <p className="text-xs text-orange-200/90 leading-relaxed italic bg-orange-950/20 border border-orange-500/10 p-2.5 rounded-xl whitespace-pre-wrap">
                                {flaw.insightMessage}
                              </p>
                            </div>

                            <div className="border-t border-[#1e293b] pt-4 mt-4 space-y-4">
                              {/* Visual comparison bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold text-gray-400">
                                  <span>Root Concept Mastery</span>
                                  <span className="text-orange-400">{rootMastery}%</span>
                                </div>
                                <div className="h-1 bg-[#090d16] rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${rootMastery}%` }} />
                                </div>
                              </div>

                              <button
                                onClick={() => startPractice(flaw.evidence?.subject || "Physics", null, rootConcept)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 rounded-xl transition shadow"
                              >
                                Fix Foundation Practice →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Insight Blocks: Time Traps & Weaknesses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Time Traps identified */}
                  <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⏱</span>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Speed Bottlenecks (Time Traps)
                        </h4>
                        <p className="text-[10px] text-gray-500">Concepts where you spend excessive time solving.</p>
                      </div>
                    </div>

                    {loadingSignals ? (
                      <p className="text-xs text-gray-500">Loading metrics...</p>
                    ) : allSignals.filter(s => s.signal === "time_trap").length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">No time traps found yet. Perfect speed pacing!</p>
                    ) : (
                      <div className="space-y-3">
                        {allSignals.filter(s => s.signal === "time_trap").slice(0, 3).map((trap) => {
                          const ratio = trap.evidence?.time_ratio || 1.0;
                          return (
                            <div key={trap.id} className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between gap-4">
                              <div className="space-y-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {cleanLabel(trap.conceptName)}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {trap.evidence?.subject} · Accuracy: {trap.evidence?.mastery_score || 0}%
                                </p>
                                <p className="text-[10px] text-orange-400 font-semibold italic">
                                  {trap.insightMessage}
                                </p>
                              </div>
                              <button
                                onClick={() => startPractice(trap.evidence?.subject || "Physics", null, trap.conceptName)}
                                className="shrink-0 bg-[#16223f] border border-[#1e293b] hover:bg-[#1e293b] hover:border-gray-500 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg transition"
                              >
                                Pacing Practice
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Standard Concept Weaknesses */}
                  <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Weak Concepts
                        </h4>
                        <p className="text-[10px] text-gray-500">Topics needing immediate attention (Accuracy &lt; 50%).</p>
                      </div>
                    </div>

                    {loadingSignals ? (
                      <p className="text-xs text-gray-500">Loading metrics...</p>
                    ) : allSignals.filter(s => s.signal === "weakness" || s.signal === "weak_concept").length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">No standard concept weaknesses detected yet. Good work!</p>
                    ) : (
                      <div className="space-y-3">
                        {allSignals.filter(s => s.signal === "weakness" || s.signal === "weak_concept").slice(0, 3).map((sig) => {
                          const mastery = sig.evidence?.mastery_score ?? 0;
                          return (
                            <div key={sig.id} className="bg-[#090d16] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between gap-4">
                              <div className="space-y-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {cleanLabel(sig.conceptName)}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {sig.evidence?.subject} · Solved attempts: {sig.evidence?.attempts || 0}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400">Mastery:</span>
                                  <span className="text-rose-400 text-[10px] font-bold font-mono">{mastery}%</span>
                                </div>
                              </div>
                              <button
                                onClick={() => startPractice(sig.evidence?.subject || "Physics", null, sig.conceptName)}
                                className="shrink-0 bg-[#16223f] border border-[#1e293b] hover:bg-[#1e293b] hover:border-gray-500 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg transition"
                              >
                                Practice Concept
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </motion.div>
            ) : (
              
              /* ========================================================
                 MODE 2: PRACTICE FEED MODE
                 ======================================================== */
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex justify-center"
              >
                {loadingQuestions ? (
                  <div className="py-24 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 text-sm font-semibold">Generating your custom practice session...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-20 space-y-4 bg-[#0d1527] border border-[#1e293b] rounded-3xl p-10 max-w-md">
                    <span className="text-5xl">🔍</span>
                    <h3 className="text-xl font-bold text-white">No Questions Found</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      We couldn't locate practice questions for the active selection. Please ensure questions are seeded in the database.
                    </p>
                    <button
                      onClick={() => setActivePractice(false)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold transition text-xs"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : currentQuestionIndex >= questions.length ? (
                  
                  /* PRACTICE RESULTS SCREEN */
                  <>
                  <PracticeEndEffect
                    sessionId={practiceSessionId}
                    practiceAnswers={practiceAnswers}
                  />
                  <div className="w-full max-w-2xl bg-[#0d1527] border border-[#1e293b] rounded-3xl p-8 space-y-6 shadow-2xl">
                    <h3 className="text-2xl font-black text-center text-white">
                      Practice Finished! 📊
                    </h3>
                    
                    {(() => {
                      const correct = practiceAnswers.filter((a) => a.correct).length;
                      const total = practiceAnswers.length;
                      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
                      const totalSecs = practiceAnswers.reduce((acc, a) => acc + a.time, 0);

                      return (
                        <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-[#090d16] border border-[#1e293b] p-4 rounded-2xl">
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Accuracy</p>
                              <p className="text-2xl font-black text-orange-500 mt-1">{score}%</p>
                            </div>
                            <div className="bg-[#090d16] border border-[#1e293b] p-4 rounded-2xl">
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Correct</p>
                              <p className="text-2xl font-black text-white mt-1">{correct} / {total}</p>
                            </div>
                            <div className="bg-[#090d16] border border-[#1e293b] p-4 rounded-2xl">
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Time Spent</p>
                              <p className="text-2xl font-black text-white mt-1">{formatTime(totalSecs)}</p>
                            </div>
                          </div>

                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">
                            Topic Performance Summary
                          </h4>

                          <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl overflow-hidden divide-y divide-[#1e293b]">
                            {practiceAnswers.map((ans, i) => (
                              <div key={i} className="px-4 py-3 flex items-center justify-between text-xs font-semibold">
                                <span className="text-gray-300 truncate max-w-[200px]">{cleanLabel(ans.topic)}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-[10px] text-gray-500 font-mono">⏱ {ans.time}s</span>
                                  <span className={ans.correct ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>
                                    {ans.correct ? "CORRECT ✓" : "WRONG ✕"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => startPractice(activeSubject!, activeChapter, activeTopic)}
                              className="flex-1 bg-[#16223f] border border-[#1e293b] text-white hover:bg-[#1e293b] py-3 rounded-xl transition text-xs font-bold"
                            >
                              🔄 Practice Again
                            </button>
                            <button
                              onClick={() => {
                                setActivePractice(false);
                                setActiveChapter(null);
                                setActiveTopic(null);
                              }}
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition text-xs font-extrabold shadow"
                            >
                              Dashboard Overview →
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  </>
                ) : (
                  
                  /* ACTIVE QUIZ QUESTION CARD */
                  <div className="w-full max-w-3xl bg-[#0d1527] border border-[#1e293b] rounded-3xl shadow-2xl overflow-hidden relative">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between bg-[#111a2f]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black bg-orange-500 text-white px-2.5 py-1 rounded-md">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 bg-[#16223f] border border-[#1e293b] px-2.5 py-1 rounded-md uppercase">
                          {questions[currentQuestionIndex].exam?.toUpperCase()} {questions[currentQuestionIndex].year}
                        </span>
                        {questions[currentQuestionIndex].difficulty && (
                          <span className="text-[10px] font-bold text-gray-400 bg-[#16223f] border border-[#1e293b] px-2.5 py-1 rounded-md capitalize">
                            {questions[currentQuestionIndex].difficulty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-[#090d16] px-3 py-1.5 border border-[#1e293b] rounded-full">
                        <span className="animate-pulse text-amber-500">⏱</span>
                        <span className="font-mono">{formatTime(timeSpent)}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 md:p-8 space-y-6">
                      
                      {/* Math Question Text */}
                      <div 
                        className="text-white text-base md:text-lg font-medium leading-relaxed overflow-x-auto whitespace-pre-wrap select-text"
                        dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].question }}
                      />

                      {/* Options or Numerical input */}
                      {questions[currentQuestionIndex].question_type === "numerical" ? (
                        <div className="space-y-4">
                          <p className="text-xs font-bold text-gray-400">Enter your numerical answer:</p>
                          <input
                            type="text"
                            disabled={isAnswerChecked}
                            placeholder="Type numerical value (e.g. 4, -1, 150)"
                            className={`w-full max-w-md p-4 rounded-2xl border bg-[#111a2f] text-white outline-none transition-all text-lg font-mono ${
                              isAnswerChecked
                                ? isCorrectState
                                  ? "border-emerald-500 bg-emerald-950/20 text-emerald-100"
                                  : "border-rose-500 bg-rose-950/20 text-rose-100"
                                : "border-[#1e293b] focus:border-orange-500"
                            }`}
                            value={numericalInput}
                            onChange={(e) => setNumericalInput(e.target.value)}
                          />
                          {isAnswerChecked && (
                            <div className="text-xs">
                              <span className="text-gray-500">Correct Answer: </span>
                              <span className="text-emerald-400 font-bold font-mono">{questions[currentQuestionIndex].answer}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {questions[currentQuestionIndex].options?.map((opt, i) => {
                            const optionLetters = ["A", "B", "C", "D", "E"];
                            const isSelected = selectedOption === i;
                            const isCorrectChoice = questions[currentQuestionIndex].answer === i;

                            let optionStyle = "bg-[#111a2f] border-[#1e293b] text-gray-300 hover:border-gray-500 hover:bg-[#16223f]";
                            let letterStyle = "bg-[#1e293b] text-gray-400";

                            if (isAnswerChecked) {
                              if (isCorrectChoice) {
                                optionStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-100";
                                letterStyle = "bg-emerald-500 text-white";
                              } else if (isSelected) {
                                optionStyle = "bg-rose-950/40 border-rose-500 text-rose-100";
                                letterStyle = "bg-rose-500 text-white";
                              } else {
                                optionStyle = "bg-[#111a2f]/50 border-[#1e293b]/50 text-gray-500 opacity-60";
                                letterStyle = "bg-[#1e293b]/50 text-gray-600";
                              }
                            } else if (isSelected) {
                              optionStyle = "bg-[#1e293b] border-orange-500 text-white shadow-md shadow-orange-500/5";
                              letterStyle = "bg-orange-500 text-white";
                            }

                            return (
                              <button
                                key={i}
                                disabled={isAnswerChecked}
                                onClick={() => setSelectedOption(i)}
                                className={`w-full flex items-center gap-4 text-left p-4 rounded-2xl border transition-all text-sm md:text-base font-semibold ${optionStyle}`}
                              >
                                <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${letterStyle}`}>
                                  {optionLetters[i]}
                                </span>
                                <span className="flex-1 overflow-x-auto whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: opt }} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-[#1e293b] flex items-center justify-between bg-[#111a2f]">
                      <div>
                        {isAnswerChecked && questions[currentQuestionIndex].explanation && (
                          <button
                            onClick={() => setShowExplanation(prev => !prev)}
                            className="bg-[#1e293b] hover:bg-[#2e3b4e] border border-[#334155] text-white text-xs px-4 py-2 rounded-xl transition font-bold"
                          >
                            {showExplanation ? "Hide Explanation ▲" : "View Explanation Detailed ▼"}
                          </button>
                        )}
                      </div>

                      <div>
                        {!isAnswerChecked ? (
                          <button
                            disabled={questions[currentQuestionIndex].question_type === "numerical" ? !numericalInput.trim() : selectedOption === null}
                            onClick={handleCheckAnswer}
                            className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-[#16223f] disabled:text-gray-600 disabled:cursor-not-allowed text-xs px-6 py-2.5 rounded-xl transition font-black shadow"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="bg-orange-500 text-white hover:bg-orange-600 text-xs px-6 py-2.5 rounded-xl transition font-black shadow"
                          >
                            {currentQuestionIndex + 1 < questions.length ? "Next Question →" : "Finish Practice →"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Solution Explanation Panel */}
                    <AnimatePresence>
                      {showExplanation && questions[currentQuestionIndex].explanation && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-[#0d1527] border-t border-[#1e293b] p-6 md:p-8 space-y-4 overflow-hidden"
                        >
                          <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <span>📝</span> Detailed Explanation
                          </h4>
                          <div 
                            className="text-gray-300 text-sm md:text-base leading-relaxed overflow-x-auto whitespace-pre-wrap select-text"
                            dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].explanation }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-[#e2e8f0]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}