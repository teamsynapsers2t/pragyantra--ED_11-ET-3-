"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TransitionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7ed] via-[#fff1e6] to-[#ffe4cc] relative overflow-hidden">

      {/* glow */}
      <div className="absolute w-[700px] h-[700px] bg-orange-300 opacity-30 blur-[120px] rounded-full top-[-150px] left-[-150px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.h1
          initial={{ y: 40 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold text-gray-900"
        >
          Let’s find your
        </motion.h1>

        <motion.h1
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-7xl font-extrabold text-orange-500 mt-2"
        >
          PERFECT ROADMAP 🚀
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-gray-600 text-lg"
        >
          We’ll ask a few smart questions to understand you better
        </motion.p>

        <motion.button
          onClick={() => router.push("/subjects")}
          whileHover={{ scale: 1.05 }}
          className="mt-10 bg-orange-500 text-white px-8 py-4 rounded-xl text-lg shadow-lg hover:bg-orange-600"
        >
          Start Test →
        </motion.button>
      </motion.div>
    </div>
  );
}