"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SelectDomainPage() {
  const router = useRouter();

  // handle selection — go straight into the live practice app for the chosen
  // exam. (The old /domain-info/[domain] route was removed; this page is legacy
  // and not linked from the main nav, but keep its one action working.)
  const handleSelect = (domain: string) => {
    localStorage.setItem("domain", domain);
    router.push(`/question_dashboard?v=app&exam=${domain.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e0e] to-[#1a1a1a] text-white flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-orange-500/20 blur-[150px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-orange-400/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-bold mb-16 text-center"
      >
        Choose Your <span className="text-orange-500">Domain</span>
      </motion.h1>

      {/* Cards */}
      <div className="flex flex-col md:flex-row gap-10 w-full max-w-6xl px-6">

        {/* JEE CARD */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect("JEE")}   // 🔥 UPDATED
          className="flex-1 cursor-pointer rounded-3xl p-10 bg-white/5 backdrop-blur-lg border border-white/10 hover:border-orange-500 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition duration-300" />

          <h2 className="text-4xl font-bold mb-4 group-hover:text-orange-400 transition">
            JEE
          </h2>

          <p className="text-gray-300 text-lg">
            Engineering entrance preparation with AI-powered roadmap and weakness analysis.
          </p>

          <div className="mt-8 text-orange-400 font-semibold">
            Start with JEE →
          </div>
        </motion.div>

        {/* NEET CARD */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect("NEET")}   // 🔥 UPDATED
          className="flex-1 cursor-pointer rounded-3xl p-10 bg-white/5 backdrop-blur-lg border border-white/10 hover:border-orange-500 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition duration-300" />

          <h2 className="text-4xl font-bold mb-4 group-hover:text-orange-400 transition">
            NEET
          </h2>

          <p className="text-gray-300 text-lg">
            Medical entrance preparation with smart tracking and AI-driven study optimization.
          </p>

          <div className="mt-8 text-orange-400 font-semibold">
            Start with NEET →
          </div>
        </motion.div>

      </div>
    </div>
  );
}