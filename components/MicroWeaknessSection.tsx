"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MicroWeaknessSection() {
  return (
    <section 
      id="micro-weakness" 
      className="relative min-h-screen flex items-center justify-center bg-black px-6 py-32 overflow-hidden"
    >
      {/* 🔥 BACKGROUND VIDEO (Local File loaded from 'public' folder) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80 select-none pointer-events-none mix-blend-screen"
      >
        <source src="/brain.mp4" type="video/mp4" />
        {/* Fallback pattern if video is missing */}
      </video>

      {/* Fallback / Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/90 pointer-events-none" />
      <div className="absolute w-[800px] h-[800px] bg-orange-600/10 blur-[150px] rounded-full top-1/4 left-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        
        {/* LEFT COLUMN: Deep Information */}
        <div className="flex-1 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold text-sm tracking-wide shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              AI SCANNING ACTIVE
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              A score of 95% means <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                5% holds a secret.
              </span>
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              Studying broadly is inefficient. Our proprietary AI doesn't just grade tests—it maps your neural understanding. By analyzing incredibly granular answer patterns, time-spent per question, and hesitation deviations, the engine hunts down the exact sub-topics sabotaging your percentile.
            </p>

            <ul className="space-y-4 mb-10 text-gray-300">
              {[
                "Finds hidden knowledge gaps invisible to standard grading.",
                "Identifies 'distractor' answers you statistically fall for.",
                "Tracks exact hesitation times to flag conceptual doubts.",
                "Automatically curates targeted micro-quizzes to patch the leaks."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm">✓</div>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/sign-in" className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all">
              Initialize Free Scan
            </Link>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Interactive Glass Visuals */}
        <div className="flex-1 relative w-full h-[600px]">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <span className="text-gray-400 font-medium tracking-widest text-sm uppercase">Global Accuracy</span>
              <span className="text-orange-400 font-mono text-2xl font-bold">89.4%</span>
            </div>

            {/* Simulated Live Scan */}
            <div className="space-y-6">
              {[
                { subject: 'Rotational Dynamics', score: 92, weak: false },
                { subject: 'Electromagnetic Induction', score: 86, weak: false },
                { subject: 'Calculating Torque', score: 32, weak: true, detail: "Core Weakness Detected" },
              ].map((item, i) => (
                <div key={i} className={`relative p-4 rounded-xl border ${item.weak ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex justify-between text-white mb-2 font-medium">
                    <span>{item.subject}</span>
                    <span className={item.weak ? 'text-red-400' : 'text-green-400'}>{item.score}%</span>
                  </div>
                  
                  {item.weak && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 bg-red-500/20 px-2 py-1 rounded-sm"
                    >
                      {item.detail}
                    </motion.div>
                  )}
                  
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.score}%` }}
                      transition={{ duration: 1.5, delay: i * 0.2 }}
                      className={`h-full rounded-full ${item.weak ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-green-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Radar Sweep Effect */}
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 w-full h-[2px] bg-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,1)] z-20 pointer-events-none"
            />
          </motion.div>
          
        </div>

      </div>
    </section>
  );
}