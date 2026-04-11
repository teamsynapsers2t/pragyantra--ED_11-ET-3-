"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
export default function Particles() {
  const particles = Array.from({ length: 20 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-2 h-2 bg-orange-400 rounded-full opacity-70"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, -100],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}