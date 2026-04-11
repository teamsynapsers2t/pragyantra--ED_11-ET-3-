"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const subjects = ["Physics", "Chemistry", "Mathematics"];

// 🔥 QUESTIONS WITH TOPICS
const questionBank: any = {
  Physics: [
    { question: "Acceleration is rate of change of?", options: ["Velocity", "Speed", "Force", "Mass"], answer: 0, topic: "Kinematics" },
    { question: "Unit of force?", options: ["Newton", "Joule", "Watt", "Pascal"], answer: 0, topic: "Mechanics" },
    { question: "Work done formula?", options: ["F×d", "m×a", "v/t", "p×v"], answer: 0, topic: "Work Energy" },
    { question: "Kinetic energy formula?", options: ["½mv²", "mgh", "F×d", "mv"], answer: 0, topic: "Energy" },
    { question: "Ohm’s law?", options: ["V=IR", "P=VI", "E=mc²", "F=ma"], answer: 0, topic: "Electricity" },
    { question: "Speed of light?", options: ["3×10⁸", "3×10⁶", "3×10⁵", "3×10⁷"], answer: 0, topic: "Modern Physics" },
  ],

  Chemistry: [
    { question: "pH of neutral solution?", options: ["7", "0", "14", "1"], answer: 0, topic: "Physical Chemistry" },
    { question: "Atomic number represents?", options: ["Protons", "Neutrons", "Mass", "Energy"], answer: 0, topic: "Atomic Structure" },
    { question: "Strong acid?", options: ["HCl", "NH₃", "H₂O", "CH₃COOH"], answer: 0, topic: "Inorganic" },
    { question: "Gas law?", options: ["PV=nRT", "F=ma", "E=mc²", "V=IR"], answer: 0, topic: "Physical Chemistry" },
    { question: "Oxidation means?", options: ["Loss of electrons", "Gain", "Neutral", "None"], answer: 0, topic: "Redox" },
    { question: "Boiling point of water?", options: ["100°C", "0°C", "50°C", "200°C"], answer: 0, topic: "General Chemistry" },
  ],

  Mathematics: [
    { question: "Derivative of x²?", options: ["2x", "x", "x²", "1"], answer: 0, topic: "Calculus" },
    { question: "sin²θ + cos²θ?", options: ["1", "0", "2", "-1"], answer: 0, topic: "Trigonometry" },
    { question: "log₁₀10?", options: ["1", "10", "0", "2"], answer: 0, topic: "Logarithms" },
    { question: "Slope of y=2x+3?", options: ["2", "3", "1", "0"], answer: 0, topic: "Algebra" },
    { question: "∫ 1/x dx?", options: ["lnx", "x", "1", "0"], answer: 0, topic: "Calculus" },
    { question: "tan45?", options: ["1", "0", "-1", "∞"], answer: 0, topic: "Trigonometry" },
  ],
};

export default function QuizPage() {
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime, setStartTime] = useState(Date.now());

  // ✅ RESULT PAGE
  if (subjectIndex >= subjects.length) {
    return <ResultPage answers={answers} />;
  }


  const subject = subjects[subjectIndex];
  const questions = questionBank[subject];
  const question = questions[current];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7ed] via-[#fff1e6] to-[#ffe4cc] p-6">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8"
      >

        <h2 className="mb-4 text-gray-900 font-semibold text-lg">
          {subject} • Question {current + 1} / {questions.length}
        </h2>

        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {question.question}
        </h3>

        <div className="grid gap-4">
          {question.options.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`p-4 rounded-xl border text-left text-lg font-medium transition
                ${
                  selected === i
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-900 border-orange-300 hover:bg-orange-50"
                }
              `}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);

            setAnswers((prev) => [
              ...prev,
              {
                subject,
                topic: question.topic,
                correct: selected === question.answer,
                time: timeTaken,
              },
            ]);

            setStartTime(Date.now());
            setSelected(null);

            if (current + 1 < questions.length) {
              setCurrent((prev) => prev + 1);
            } else {
              setSubjectIndex((prev) => prev + 1);
              setCurrent(0);
            }
          }}
          className="mt-6 w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition"
        >
          Next →
        </button>

      </motion.div>
    </div>
  );
}

// 🔥 RESULT PAGE WITH MICRO ANALYSIS
import { useRouter } from "next/navigation";

function ResultPage({ answers }: any) {
  const router = useRouter();
  const subjects = ["Physics", "Chemistry", "Mathematics"];

  const subjectAnalysis = subjects.map((sub) => {
    const subAns = answers.filter((a: any) => a.subject === sub);
    const correct = subAns.filter((a: any) => a.correct).length;
    const total = subAns.length;

    const time = subAns.reduce((acc: number, a: any) => acc + a.time, 0);

    return {
      subject: sub,
      score: Math.round((correct / total) * 100),
      time,
    };
  });

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
      status:
        score >= 70 ? "Strong 💪" :
        score >= 40 ? "Average ⚡" :
        "Weak ⚠️",
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7ed] via-[#fff1e6] to-[#ffe4cc] flex items-center justify-center p-6">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-10"
      >

        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Detailed Analysis 📊
        </h1>

        {/* SUBJECT */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {subjectAnalysis.map((s, i) => (
            <div key={i} className="p-6 bg-orange-50 rounded-xl text-center">
              <h2 className="text-xl font-bold text-orange-500">{s.subject}</h2>
              <p className="text-gray-900 font-semibold">{s.score}%</p>
              <p className="text-sm text-gray-600">⏱ {s.time}s</p>
            </div>
          ))}
        </div>

        {/* TOPIC */}
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Topic Breakdown
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {topicAnalysis.map((t: any, i: number) => (
            <div key={i} className="p-4 border rounded-xl">
              <h3 className="font-semibold text-gray-900">{t.topic}</h3>
              <p className="text-gray-700">{t.score}%</p>
              <p className="text-orange-500">{t.status}</p>
            </div>
          ))}
        </div>

        {/* 🔥 FIXED BUTTON */}
        <div className="text-center">
          <button
            onClick={() =>
              router.push(`/dashboard?data=${encodeURIComponent(JSON.stringify({ subjectAnalysis, topicAnalysis }))}`)
            }
            className="bg-orange-500 text-white px-8 py-4 rounded-xl text-lg hover:bg-orange-600 transition"
          >
            Get Your Roadmap →
          </button>
        </div>

      </motion.div>
    </div>
  );
}