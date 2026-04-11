"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signup } from "@/app/actions/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await signup(formData);
    
    if (res?.error) {
      setErrorMsg(res.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-6 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute w-[500px] h-[500px] bg-orange-500/20 blur-[150px] rounded-full bottom-[-100px] right-[-100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10"
      >
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-gray-400 mb-8">Join us to start your customized AI journey.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-gray-300 font-medium ml-1">Email</label>
            <input 
              name="email"
              type="email" 
              required 
              placeholder="you@example.com"
              className="mt-1 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 font-medium ml-1">Password</label>
            <input 
              name="password"
              type="password" 
              required 
              placeholder="••••••••"
              className="mt-1 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          {errorMsg && <p className="text-red-400 text-sm mt-1">{errorMsg}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center disabled:opacity-50 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            {loading ? "Authenticating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account? <Link href="/sign-in" className="text-orange-400 hover:text-orange-300 transition">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
