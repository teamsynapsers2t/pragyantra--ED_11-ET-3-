"use client";

import { motion } from "framer-motion";

export default function SmartRevisionSection() {
  return (
    <section 
      id="revision" 
      className="relative min-h-screen flex items-center justify-center bg-black px-6 py-32 overflow-hidden"
    >
      {/* 🔥 BACKGROUND VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80 select-none pointer-events-none mix-blend-screen"
      >
        <source src="/galaxy.mp4" type="video/mp4" />
        {/* Fallback pattern if video is missing */}
      </video>

      {/* Fallback / Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/90 pointer-events-none" />
      <div className="absolute w-[800px] h-[800px] bg-orange-600/10 blur-[150px] rounded-full bottom-1/4 right-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
        
        {/* RIGHT COLUMN: Deep Information */}
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
              SPACED REPETITION ENGINE
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight drop-shadow-lg">
              Memory is fading. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-400">
                We make it permanent.
              </span>
            </h2>
            
            <p className="text-gray-100 font-medium text-lg md:text-xl leading-relaxed mb-8 max-w-2xl drop-shadow-md">
              Cramming works until the exam starts. Our Smart Revision Engine uses dynamic spaced-repetition algorithms to predict exactly when you are about to forget a concept. It automatically injects high-yield flashcards into your daily queue precisely when your brain needs the reinforcement.
            </p>

            <ul className="space-y-4 mb-10 text-white font-medium drop-shadow-md">
              {[
                "Predictive forgetting curves based on your past accuracy.",
                "Auto-generated flashcards directly from your weak topics.",
                "Adaptive daily queues that never waste time on what you already know.",
                "Forces active recall rather than passive reading."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-500/80 text-white flex items-center justify-center text-sm shadow-md">✓</div>
                  {item}
                </li>
              ))}
            </ul>

            <button className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-[0_0_30px_rgba(234,88,12,0.4)] transition-all">
              Start Today's Queue
            </button>
          </motion.div>
        </div>

        {/* LEFT COLUMN: Interactive Glass Visuals */}
        <div className="flex-1 relative w-full h-[600px] flex items-center justify-center perspective">
          
          <motion.div
            initial={{ opacity: 0, rotateY: -30, x: -50 }}
            whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-20"
          >
            <div className="text-xs uppercase tracking-widest text-orange-400 font-semibold mb-6">Daily Review</div>
            <h3 className="text-2xl text-white font-bold mb-4 leading-snug">What is the formula for magnetic flux?</h3>
            
            <div className="w-full h-32 bg-black/40 rounded-xl mb-6 flex items-center justify-center border border-white/5">
              <span className="text-gray-500 text-sm">Tap to reveal answer</span>
            </div>

            <div className="flex justify-between gap-3 opacity-50 pointer-events-none">
              <div className="flex-1 py-3 bg-red-500/20 text-red-400 text-center rounded-lg text-sm font-semibold border border-red-500/30">Hard</div>
              <div className="flex-1 py-3 bg-orange-500/20 text-orange-400 text-center rounded-lg text-sm font-semibold border border-orange-500/30">Good</div>
              <div className="flex-1 py-3 bg-green-500/20 text-green-400 text-center rounded-lg text-sm font-semibold border border-green-500/30">Easy</div>
            </div>
          </motion.div>

          {/* Stacked Cards behind */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-[45%] -translate-y-[55%] w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl h-[400px] z-10"
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.3 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-[40%] -translate-y-[60%] w-full max-w-sm bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl h-[400px] z-0"
          />
          
        </div>

      </div>
    </section>
  );
}
