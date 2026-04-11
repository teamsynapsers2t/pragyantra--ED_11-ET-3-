"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import WaveBackground from "./WaveBackground";
import { ReactNode } from "react";

// 🔥 Beautiful Animated Component 1: Micro-Weakness Radar
const MicroWeaknessVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#fff6ed] to-[#fffbfc] overflow-hidden group-hover:scale-110 transition-transform duration-700">
    <motion.div
      animate={{ scale: [1, 1.8, 2.5], opacity: [0.6, 0.2, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
      className="absolute w-20 h-20 rounded-full border border-orange-400"
    />
    <motion.div
      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
      transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: "easeOut" }}
      className="absolute w-20 h-20 rounded-full border border-orange-400"
    />
    <div className="relative z-10 w-6 h-6 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,1)]" />
    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid1" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(249,115,22,0.5)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid1)" />
    </svg>
  </div>
);

// 🔥 Beautiful Animated Component 2: Smart Revision Cards
const SmartRevisionVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f8f9ff] to-[#fff6ed] overflow-hidden group-hover:scale-110 transition-transform duration-700">
    <motion.div
      animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bg-white p-3 rounded-xl shadow-lg border border-gray-100 w-24 h-32 ml-20 opacity-60"
    />
    <motion.div
      animate={{ y: [0, 12, 0], rotate: [0, 8, 0] }}
      transition={{ duration: 4, delay: 0.7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bg-white p-3 rounded-xl shadow-lg border border-gray-100 w-24 h-32 -ml-20 opacity-60"
    />
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, delay: 1.4, repeat: Infinity, ease: "easeInOut" }}
      className="relative z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-orange-200/60 w-32 h-40 flex flex-col justify-center gap-3 items-center"
    >
      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl shadow-inner">
        🧠
      </div>
      <div className="w-16 h-2 bg-gray-200 rounded-full" />
      <div className="w-10 h-2 bg-orange-200 rounded-full" />
    </motion.div>
  </div>
);

// 🔥 Beautiful Animated Component 3: Live Dashboard Bars
const LiveDashboardVisual = () => (
  <div className="relative w-full h-full flex items-end justify-center gap-3 bg-gradient-to-br from-[#fafafa] to-[#fff4ea] overflow-hidden p-6 pb-6 group-hover:scale-110 transition-transform duration-700">
    {[45, 85, 30, 95, 65].map((height, i) => (
      <motion.div
        key={i}
        animate={{ height: [`${Math.max(10, height - 30)}%`, `${height}%`, `${Math.max(10, height - 30)}%`] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        className="w-8 rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-300 shadow-[0_-5px_15px_rgba(249,115,22,0.3)] opacity-90"
      />
    ))}
    {/* Subtle floating particles */}
    <motion.div animate={{ y: [-10, -50], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-10 left-10 w-2 h-2 bg-orange-400 rounded-full" />
    <motion.div animate={{ y: [-10, -60], opacity: [0, 1, 0] }} transition={{ duration: 2.5, delay: 1, repeat: Infinity }} className="absolute bottom-12 right-12 w-3 h-3 bg-red-400 rounded-full" />
  </div>
);

const features: { title: string; desc: string; route: string; visual: ReactNode }[] = [
  {
    title: "Micro-Weakness",
    desc: "Laser-focus on the exact concepts sabotaging your score.",
    route: "#micro-weakness",
    visual: <MicroWeaknessVisual />
  },
  {
    title: "Smart Revision",
    desc: "AI-driven spaced repetition for maximum knowledge retention.",
    route: "#revision",
    visual: <SmartRevisionVisual />
  },
  {
    title: "Live Dashboard",
    desc: "Track analytics, accuracy rates, and global percentiles.",
    route: "#dashboard",
    visual: <LiveDashboardVisual />
  },
];

export default function FeaturesShowcase() {
  const router = useRouter();

  return (
    <section id="features" className="relative min-h-screen flex flex-col items-center justify-center bg-[#fdfbf9] grid-bg px-6 py-32 overflow-hidden">
      
      {/* Subtle Background Elements */}
      <WaveBackground />
      <div className="absolute top-0 w-full h-[300px] bg-gradient-to-b from-white to-transparent opacity-80" />

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* HEADING */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-24"
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 font-semibold text-sm tracking-wide shadow-sm">
            SUPERCHARGE YOUR PREP
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight">
            Everything you need <br className="hidden md:block"/> to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">improve instantly.</span>
          </h2>
        </motion.div>

        {/* 🔥 CARDS */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-7xl w-full">

          {features.map((feature, i) => (
            <motion.div
              key={i}
              onClick={() => router.push(feature.route)}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group cursor-pointer flex-1 w-full max-w-[400px] h-[480px]"
            >
              <div className="h-full w-full rounded-[2.5rem] p-[1.5px] bg-gradient-to-b from-orange-200/80 via-transparent to-transparent shadow-[0_15px_40px_rgba(249,115,22,0.1)] hover:shadow-[0_25px_60px_rgba(249,115,22,0.2)] transition-shadow duration-500">
                
                <div className="h-full w-full rounded-[2.4rem] bg-white/70 backdrop-blur-3xl overflow-hidden flex flex-col relative">
                  
                  {/* Subtle Top Glow inside Card */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-orange-300/20 blur-3xl rounded-full" />

                  {/* HEADER TEXT */}
                  <div className="p-8 pb-4 relative z-10">
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 text-base leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>

                  {/* SPACER */}
                  <div className="flex-1" />

                  {/* 🔥 VISUAL ANIMATION COMPONENT */}
                  <div className="h-[220px] w-[calc(100%-2rem)] mx-auto mb-4 rounded-3xl overflow-hidden border border-orange-100/50 shadow-inner">
                    {feature.visual}
                  </div>

                  {/* BOTTOM CTA */}
                  <div className="px-8 pb-8 flex items-center justify-between text-orange-500 font-semibold group-hover:text-orange-600 transition-colors">
                    <span>Explore module</span>
                    <motion.span className="text-xl" whileHover={{ x: 5 }}>→</motion.span>
                  </div>

                </div>
              </div>
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}