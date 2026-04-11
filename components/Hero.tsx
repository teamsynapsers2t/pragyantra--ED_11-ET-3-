"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Particles from "./Particles";

export default function Hero() {

  const data = [
    "Physics weak → Torque?",
    "Math weak → Integration?",
    "Organic weak → GOC?",
  ];

  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  // typing animation
  useEffect(() => {
    const currentText = data[index];

    if (charIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentText[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 45);

      return () => clearTimeout(timeout);
    } else {
      const pause = setTimeout(() => {
        setDisplayText("");
        setCharIndex(0);
        setIndex((prev) => (prev + 1) % data.length);
      }, 1600);

      return () => clearTimeout(pause);
    }
  }, [charIndex, index]);

  return (
    <section className="relative h-screen flex items-center justify-center bg-[#fafafa] overflow-hidden grid-bg">

      <Particles />

      {/* glow */}
      <div className="absolute w-[600px] h-[600px] bg-orange-300 opacity-20 blur-3xl rounded-full top-1/3 left-1/3"></div>

      <div className="text-center z-10 px-6">

        {/* badge */}
        <motion.p
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-block px-4 py-1 text-sm border rounded-full border-orange-300 text-orange-500 mb-8"
        >
          ✦ INDIA'S FIRST AI STUDY MENTOR ✦
        </motion.p>

        {/* heading */}
        <motion.h1 className="flex flex-col items-center leading-tight">

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-semibold text-gray-800"
          >
            Find your
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative text-5xl md:text-7xl font-extrabold mt-3 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent"
          >
            WHAT'S NEXT..?

            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute left-0 -bottom-2 h-[5px] bg-gradient-to-r from-orange-500 to-orange-300 rounded-full"
            />
          </motion.span>

        </motion.h1>

        {/* typing */}
        <div className="mt-8 h-8 flex items-center justify-center text-base md:text-lg">
          <span className="text-gray-500">"</span>
          <span className="mx-1 text-gray-700 font-medium">
            {displayText}
          </span>
          <span className="text-orange-500 animate-pulse">|</span>
          <span className="text-gray-500">"</span>
        </div>

        {/* subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-5 text-gray-600 max-w-xl mx-auto text-base md:text-lg"
        >
          VIA pinpoints your exact weak topics and tells you what to fix — no guesswork.
        </motion.p>

        {/* buttons */}
        <div className="mt-8 flex justify-center gap-5">

          {/* 🔥 FIXED NAVIGATION BUTTON */}
          <motion.button
            onClick={() => window.location.href = "/select-domain"}
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 1.2,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="bg-orange-500 hover:scale-105 transition-transform duration-300 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg"
          >
            Diagnose your weaknesses →
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 1.35,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="text-gray-700 hover:underline text-base"
          >
            Learn more →
          </motion.button>

        </div>

      </div>
    </section>
  );
}