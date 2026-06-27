"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  question: string;
  options: string[];
  difficulty: string;
  exam: string;
  year: number;
  question_type: string;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject") || "Physics";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [numericalInput, setNumericalInput] = useState("");
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrectState, setIsCorrectState] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  // Reveal data from the server AFTER submitting (no pre-loaded answer key)
  const [revealIndex, setRevealIndex] = useState<number | null>(null);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const [revealExp, setRevealExp] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Session tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionStartedRef = useRef(false);

  // Start a session when quiz loads
  useEffect(() => {
    async function startSession() {
      if (sessionStartedRef.current) return;
      sessionStartedRef.current = true;
      try {
        const res = await fetch("/api/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "quiz", subject }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
        }
      } catch (err) {
        console.warn("Could not start session:", err);
      }
    }
    startSession();
  }, [subject]);

  // Fetch questions for this subject
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error("Error loading quiz questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [subject]);

  // Handle local question timer
  useEffect(() => {
    if (questions.length > 0 && !isAnswerChecked && !loading && current < questions.length) {
      setTimeSpent(0);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions, current, isAnswerChecked, loading]);

  // Format timer display
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-[#e2e8f0]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-semibold">Generating your custom practice session...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-[#e2e8f0] p-6 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h2 className="text-2xl font-bold text-white mb-2">No Questions Found</h2>
        <p className="text-gray-400 max-w-md mb-6">
          We couldn't find any questions for {subject} in the database. Please make sure the questions are seeded.
        </p>
        <button
          onClick={() => router.push("/subjects")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  // ✅ RESULT PAGE VIEW
  if (current >= questions.length) {
    return <ResultPage answers={answers} subject={subject} sessionId={sessionId} />;
  }

  const question = questions[current];
  const isNumerical = question.question_type === "numerical";

  const handleCheckAnswer = async () => {
    if (isAnswerChecked) return;

    if (isNumerical && !numericalInput.trim()) return;
    if (!isNumerical && selected === null) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswerChecked(true);

    // Server is authoritative for correctness AND owns the answer key.
    // The client never sees the answer until this response comes back.
    const letters = ["A", "B", "C", "D", "E"];
    const submitVal = isNumerical ? numericalInput.trim() : letters[selected!];

    let isCorrect = false;
    try {
      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption: submitVal,
          timeTakenMs: timeSpent * 1000,
          sessionId: sessionId,
          changedAnswerCount: 0,
          openedHint: false,
          openedSolution: false,
          confidenceRating: null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        isCorrect = !!data.isCorrect;
        setIsCorrectState(isCorrect);
        setRevealIndex(data.correctIndex ?? null);
        setRevealAnswer(data.correctOption ?? null);
        setRevealExp(data.explanation ?? null);
      } else {
        setIsCorrectState(false);
      }
    } catch (err) {
      console.warn("Could not submit attempt:", err);
      setIsCorrectState(false);
    }

    // Save answer for the summary screen (uses the server's verdict)
    setAnswers((prev) => [
      ...prev,
      {
        subject: question.subject,
        topic: question.topic || "General",
        correct: isCorrect,
        time: timeSpent,
      },
    ]);
  };

  const handleNext = () => {
    setCurrent((prev) => prev + 1);
    setSelected(null);
    setNumericalInput("");
    setIsAnswerChecked(false);
    setIsCorrectState(null);
    setShowExplanation(false);
    setRevealIndex(null);
    setRevealAnswer(null);
    setRevealExp(null);
    setTimeSpent(0);
    setStartTime(Date.now());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-[#e2e8f0] p-6 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full top-[-100px] right-[-100px] pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full bottom-[-100px] left-[-100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-[#0d1527] border border-[#1e293b] rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between bg-[#111a2f]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-orange-500 text-white px-2.5 py-1 rounded-md">
              Question {current + 1} of {questions.length}
            </span>
            <span className="text-[11px] font-bold text-gray-400 bg-[#16223f] border border-[#1e293b] px-2.5 py-1 rounded-md uppercase">
              {question.exam.toUpperCase()} {question.year}
            </span>
            {question.difficulty && (
              <span className="text-[11px] font-bold text-gray-400 bg-[#16223f] border border-[#1e293b] px-2.5 py-1 rounded-md capitalize">
                {question.difficulty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-[#090d16] px-3 py-1.5 border border-[#1e293b] rounded-full">
            <span className="animate-pulse text-amber-500">⏱</span>
            <span className="font-mono">{formatTime(timeSpent)}</span>
          </div>
        </div>

        {/* Question Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div 
            className="text-white text-base md:text-lg font-medium leading-relaxed overflow-x-auto whitespace-pre-wrap select-text"
            dangerouslySetInnerHTML={{ __html: question.question }}
          />

          {/* Choices or Numerical Input */}
          {isNumerical ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-400">Enter your numerical answer:</p>
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
              {isAnswerChecked && revealAnswer != null && (
                <div className="text-sm">
                  <span className="text-gray-400">Correct Answer: </span>
                  <span className="text-emerald-400 font-bold font-mono">{revealAnswer}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {question.options.map((opt, i) => {
                const optionLetters = ["A", "B", "C", "D", "E"];
                const isSelected = selected === i;
                const isCorrectChoice = revealIndex === i;

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
                    onClick={() => setSelected(i)}
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
            {isAnswerChecked && revealExp && (
              <button
                onClick={() => setShowExplanation(prev => !prev)}
                className="bg-[#1e293b] hover:bg-[#2e3b4e] border border-[#334155] text-white text-xs px-4 py-2.5 rounded-xl transition font-bold"
              >
                {showExplanation ? "Hide Solution ▲" : "View Solution Detailed ▼"}
              </button>
            )}
          </div>

          <div>
            {!isAnswerChecked ? (
              <button
                disabled={isNumerical ? !numericalInput.trim() : selected === null}
                onClick={handleCheckAnswer}
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-[#16223f] disabled:text-gray-500 disabled:cursor-not-allowed text-xs px-6 py-2.5 rounded-xl transition font-extrabold shadow-md shadow-orange-500/10"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-orange-500 text-white hover:bg-orange-600 text-xs px-6 py-2.5 rounded-xl transition font-extrabold shadow-md shadow-orange-500/10"
              >
                {current + 1 < questions.length ? "Next Question →" : "Finish Practice →"}
              </button>
            )}
          </div>
        </div>

        {/* Solution Section */}
        <AnimatePresence>
          {showExplanation && revealExp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0d1527] border-t border-[#1e293b] p-6 md:p-8 space-y-4 overflow-hidden"
            >
              <h4 className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                <span>📝</span> Detailed Explanation
              </h4>
              <div
                className="text-gray-300 text-sm md:text-base leading-relaxed overflow-x-auto whitespace-pre-wrap select-text"
                dangerouslySetInnerHTML={{ __html: revealExp }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ResultPage({ answers, subject, sessionId }: { answers: any[]; subject: string; sessionId: string | null }) {
  const router = useRouter();
  const sessionEndedRef = useRef(false);

  const correct = answers.filter((a: any) => a.correct).length;
  const total = answers.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const time = answers.reduce((acc: number, a: any) => acc + a.time, 0);
  const skipped = 0; // Quiz doesn't support skipping yet

  // End session and trigger weakness report generation
  useEffect(() => {
    async function endSession() {
      if (sessionEndedRef.current || !sessionId) return;
      sessionEndedRef.current = true;
      try {
        await fetch("/api/sessions/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionsAttempted: total,
            questionsCorrect: correct,
            questionsSkipped: skipped,
          }),
        });
      } catch (err) {
        console.warn("Could not end session:", err);
      }
    }
    endSession();
  }, [sessionId, total, correct, skipped]);

  const topicMap: any = {};
  answers.forEach((a: any) => {
    if (!topicMap[a.topic]) {
      topicMap[a.topic] = { total: 0, correct: 0 };
    }
    topicMap[a.topic].total += 1;
    if (a.correct) topicMap[a.topic].correct += 1;
  });

  const topicAnalysis = Object.keys(topicMap).map((topic) => {
    const t = topicMap[topic];
    const score = Math.round((t.correct / t.total) * 100);
    return {
      topic,
      score,
      status: score >= 70 ? "Strong 💪" : score >= 40 ? "Average ⚡" : "Weak ⚠️",
    };
  });

  const subjectAnalysis = [
    {
      subject,
      score,
      time,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full top-[-100px] right-[-100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-[#0d1527] border border-[#1e293b] rounded-3xl shadow-2xl p-8 md:p-10 relative z-10"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center">
          Detailed Quiz Analysis 📊
        </h1>

        <div className="flex justify-center gap-6 mb-10">
          <div className="p-6 bg-[#111a2f] border border-[#1e293b] rounded-2xl text-center w-full max-w-xs">
            <h2 className="text-lg font-bold text-orange-500 uppercase tracking-widest">{subject}</h2>
            <p className="text-3xl font-black text-white mt-2">{score}%</p>
            <p className="text-xs text-gray-500 font-semibold mt-1">Total Score</p>
            <p className="text-sm text-gray-400 mt-2">⏱ {time}s total time</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 text-white">
          Topic Breakdown
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {topicAnalysis.map((t: any, i: number) => (
            <div key={i} className="p-4 bg-[#111a2f] border border-[#1e293b] rounded-xl flex flex-col justify-between">
              <h3 className="font-semibold text-white truncate">{t.topic}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{t.score}%</span>
                <span className="text-xs text-gray-400">accuracy</span>
              </div>
              <p className="text-xs text-orange-500 font-bold mt-2">{t.status}</p>
            </div>
          ))}
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 text-white px-8 py-4 rounded-xl text-lg hover:bg-orange-600 transition font-extrabold shadow-md shadow-orange-500/20"
          >
            See Your Weakness Analysis →
          </button>
          <div>
            <button
              onClick={() => router.push("/question_dashboard")}
              className="text-sm text-gray-400 hover:text-gray-300 transition font-semibold"
            >
              ← Back to Practice
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-[#e2e8f0]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}