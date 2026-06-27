"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Quiz error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-[#e2e8f0] p-6 text-center">
      <div className="max-w-md w-full bg-[#0d1527] border border-[#1e293b] rounded-3xl p-10 space-y-6 shadow-2xl">
        <div className="text-5xl">⚡</div>
        <div>
          <h2 className="text-xl font-black text-white mb-2">Quiz failed to load</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Couldn&apos;t fetch your questions. This is usually a temporary issue — try again or go back to pick another subject.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition text-sm"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/question_dashboard")}
            className="w-full bg-[#1e293b] hover:bg-[#2e3b4e] text-gray-300 font-bold py-3 rounded-2xl transition text-sm"
          >
            ← Back to Practice
          </button>
        </div>
      </div>
    </div>
  );
}
