"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-6 relative overflow-hidden">
      {/* Glowing background highlights */}
      <div className="absolute w-[500px] h-[500px] bg-orange-500/20 blur-[150px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-orange-400/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 flex justify-center"
      >
        <SignIn
          appearance={{
            elements: {
              cardBox: "shadow-[0_0_50px_rgba(249,115,22,0.15)] rounded-3xl overflow-hidden border border-zinc-800",
            }
          }}
        />
      </motion.div>
    </div>
  );
}
