"use client";

import { motion } from "framer-motion";

export default function LiveDashboardSection() {
  return (
    <section 
      id="dashboard" 
      className="relative min-h-screen flex items-center justify-center bg-black px-6 py-32 overflow-hidden"
    >
      {/* 🔥 BACKGROUND VIDEO FOR USER UPLOAD */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80 select-none pointer-events-none mix-blend-screen"
      >
        <source src="/microweakness-bg.mp4" type="video/mp4" />
        {/* Fallback pattern if video is missing */}
      </video>

      {/* Overlay Gradients */}
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
              LIVING ANALYTICS ENGINE
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight drop-shadow-lg">
              It breathes. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-400">
                It grows with you.
              </span>
            </h2>
            
            <p className="text-gray-100 font-medium text-lg md:text-xl leading-relaxed mb-8 max-w-2xl drop-shadow-md">
              Most dashboards are just dead static numbers. Our Live Analytics Engine is a living, breathing entity. As your knowledge compounds and your answers get sharper across modules, the dashboard reacts in real-time, morphing its predictions and adapting your global leaderboard standing instantaneously.
            </p>

            <ul className="space-y-4 mb-10 text-white font-medium drop-shadow-md">
              {[
                "Instant recalculation of your exam readiness score.",
                "Live pulse radar comparing you globally in real-time.",
                "Dynamic visual growth—watch your stats stretch as you learn.",
                "Predictive scoring logic based on active learning velocity."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-500/80 text-white flex items-center justify-center text-sm shadow-md">✓</div>
                  {item}
                </li>
              ))}
            </ul>

            <button className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-[0_0_30px_rgba(234,88,12,0.4)] transition-all">
              Initialize Dashboard
            </button>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Interactive Glass Visuals */}
        <div className="flex-1 relative w-full h-[600px] flex items-center justify-center perspective">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Animated Glow Behind Graph */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 w-48 h-48 bg-orange-500/30 blur-3xl rounded-full"
            />

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
              <span className="text-white font-medium tracking-widest text-sm uppercase">Global Rank</span>
              <motion.span 
                animate={{ color: ["#fb923c", "#f97316", "#fb923c"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-mono text-2xl font-bold"
              >
                Top 2.5%
              </motion.span>
            </div>

            {/* Glowing Growth Graph Simulation */}
            <div className="relative w-full h-40 flex items-end justify-between gap-1 z-10">
              {[35, 45, 40, 65, 75, 80, 70, 85, 95, 100].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: "10%" }}
                  whileInView={{ height: `${height}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "backOut" }}
                  className="w-full max-w-[20px] rounded-t-sm bg-gradient-to-t from-orange-600 to-orange-400 opacity-90 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 mt-4 uppercase tracking-widest relative z-10">
              <span>Past Week</span>
              <span>Today</span>
            </div>

            {/* Live Status Ticker */}
            <div className="mt-8 pt-4 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-gray-300 text-sm">Realtime data link established</span>
              </div>
            </div>

          </motion.div>
          
        </div>

      </div>
    </section>
  );
}
