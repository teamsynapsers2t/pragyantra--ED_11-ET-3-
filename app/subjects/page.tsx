"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SubjectsPage() {
  const router = useRouter();

  const subjects = [
    { name: "Physics", icon: "⚡" },
    { name: "Chemistry", icon: "🧪" },
    { name: "Mathematics", icon: "📐" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7ed] via-[#fff1e6] to-[#ffe4cc] relative overflow-hidden p-10">

      {/* Back to Dashboard Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur hover:bg-white text-orange-600 hover:text-orange-700 font-bold rounded-xl border border-orange-100 shadow-sm transition-all duration-200 cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* glow */}
      <div className="absolute w-[700px] h-[700px] bg-orange-300 opacity-30 blur-[120px] rounded-full top-[-150px] left-[-150px]" />

      <div className="text-center w-full max-w-6xl">

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12">
          Choose a <span className="text-orange-500">Subject</span>
        </h1>

        <div className="flex flex-col md:flex-row justify-center gap-8 w-full max-w-4xl mx-auto">

          {subjects.map((sub, index) => (
            <motion.div
              key={sub.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/quiz?subject=${sub.name}`)}
              className="h-[300px] w-full max-w-sm flex flex-col items-center justify-center rounded-3xl bg-white shadow-2xl border border-orange-100 cursor-pointer transition-all duration-300 hover:shadow-orange-200"
            >
              <div className="text-5xl mb-4">{sub.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900">
                {sub.name}
              </h2>
            </motion.div>
          ))}

        </div>
      </div>
    </div>
  );
}