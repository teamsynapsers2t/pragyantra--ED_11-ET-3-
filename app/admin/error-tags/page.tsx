"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ERROR_TYPES = [
  { value: "", label: "— Not tagged —" },
  { value: "conceptual", label: "Conceptual misunderstanding" },
  { value: "formula", label: "Wrong formula applied" },
  { value: "sign", label: "Sign / direction error" },
  { value: "unit", label: "Unit conversion mistake" },
  { value: "calculation", label: "Arithmetic / calculation slip" },
  { value: "misread", label: "Misread the question" },
  { value: "partial", label: "Incomplete method" },
];

interface QuestionOption {
  id: number;
  question_id: number;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  error_type: string | null;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  correct_option: string;
  numerical_answer: string | null;
  chapter_id: number;
  options: QuestionOption[];
}

interface Chapter {
  id: number;
  chapter_name: string;
  subject: string;
}

export default function ErrorTagsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Track pending changes (optionId → errorType)
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/admin/error-tags?page=${page}`;
      if (selectedChapter) url += `&chapter_id=${selectedChapter}`;
      const res = await fetch(url);
      if (res.status === 403) {
        setError("Access denied. You are not an admin.");
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        if (data.chapters) setChapters(data.chapters);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load data");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, selectedChapter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleErrorTypeChange = (optionId: number, value: string) => {
    setPendingChanges((prev) => ({ ...prev, [optionId]: value }));
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    const updates = Object.entries(pendingChanges).map(([optionId, errorType]) => ({
      optionId: parseInt(optionId),
      errorType: errorType || null,
    }));

    if (updates.length === 0) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/error-tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (res.ok || res.status === 207) {
        const data = await res.json();
        setSuccessMsg(`Saved ${data.updatedCount || updates.length} error tags.`);
        setPendingChanges({});
        await fetchData(); // Refresh
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 bg-[#0d1527] border-b border-[#1e293b] px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-orange-500 hover:text-orange-400 transition font-bold"
          >
            ← Dashboard
          </button>
          <span className="text-gray-600">|</span>
          <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-5 bg-orange-500 rounded-full inline-block" />
            Error Type Tagging
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-bold">
              {pendingCount} unsaved change{pendingCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={pendingCount === 0 || saving}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
              pendingCount === 0 || saving
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            }`}
          >
            {saving ? "Saving..." : `Save Changes (${pendingCount})`}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chapter:</label>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setPage(1);
              }}
              className="bg-[#0d1527] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="">All Chapters</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  [{ch.subject}] {ch.chapter_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-[#0d1527] border border-[#1e293b] text-xs font-bold rounded-lg disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-xs font-bold text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={questions.length < 20}
              className="px-3 py-1.5 bg-[#0d1527] border border-[#1e293b] text-xs font-bold rounded-lg disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No questions found for the selected filter.</div>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => (
              <div key={q.id} className="bg-[#0d1527] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                {/* Question header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold bg-[#16223f] border border-[#1e293b] text-gray-300 px-2 py-0.5 rounded">
                        Q#{q.id}
                      </span>
                      <span className="text-[10px] font-bold bg-[#16223f] border border-[#1e293b] text-gray-300 px-2 py-0.5 rounded">
                        {q.question_type.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">
                        Ch #{q.chapter_id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed truncate max-w-3xl">
                      {q.question_text?.slice(0, 200)}
                      {(q.question_text?.length || 0) > 200 ? "..." : ""}
                    </p>
                  </div>
                </div>

                {/* Options table */}
                <div className="space-y-1.5">
                  {q.options.map((opt) => {
                    const currentErrorType =
                      pendingChanges[opt.id] !== undefined
                        ? pendingChanges[opt.id]
                        : opt.error_type || "";

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                          opt.is_correct
                            ? "bg-emerald-950/10 border-emerald-500/20"
                            : pendingChanges[opt.id] !== undefined
                            ? "bg-amber-950/10 border-amber-500/20"
                            : "bg-[#090d16] border-[#1e293b]"
                        }`}
                      >
                        <span className="text-xs font-black text-gray-400 w-6 text-center shrink-0">
                          {opt.option_label}
                        </span>
                        <span className="text-xs text-gray-300 flex-1 min-w-0 truncate">
                          {opt.option_text?.slice(0, 120)}
                          {(opt.option_text?.length || 0) > 120 ? "..." : ""}
                        </span>

                        {opt.is_correct ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
                            ✓ Correct
                          </span>
                        ) : (
                          <select
                            value={currentErrorType}
                            onChange={(e) => handleErrorTypeChange(opt.id, e.target.value)}
                            className="bg-[#0d1527] border border-[#1e293b] text-[11px] text-white rounded-lg px-2 py-1.5 w-48 shrink-0 focus:outline-none focus:border-orange-500"
                          >
                            {ERROR_TYPES.map((et) => (
                              <option key={et.value} value={et.value}>
                                {et.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
