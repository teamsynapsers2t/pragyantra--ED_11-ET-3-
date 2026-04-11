"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    q: "How does the AI know my micro-weaknesses?",
    a: "Our engine tracks everything—from the specific distractor answers you choose to the exact seconds you hesitate on a question. It builds a neural map of your conceptual understanding, identifying holes invisble to standard grading.",
  },
  {
    q: "Do I have to manually create flashcards?",
    a: "Absolutely not. The moment you miss a question or show hesitation on a concept, our Spaced Repetition Engine automatically generates highly-targeted flashcards and injects them into your daily review queue.",
  },
  {
    q: "Is this meant to replace my school classes?",
    a: "Paper AI acts as an ultimate intelligence layer on top of your standard studies. It doesn't replace learning; it optimizes your execution so you never waste time studying what you already know.",
  },
  {
    q: "How accurate is the Global Percentile?",
    a: "Because our platform evaluates thousands of data points per user, the global percentile is highly predictive of your actual real-world examination standing. If it says you are ready, you are ready.",
  },
];

export default function FooterSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <footer className="relative bg-[#050505] text-white pt-24 pb-12 overflow-hidden border-t border-white/5">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* TOP HALF: FAQs */}
        <div className="mb-24">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold text-sm tracking-wide">
            INTELLIGENCE DESK
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-12 tracking-tight">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-white pr-4">{faq.q}</h3>
                  <div className="text-orange-500 font-bold text-xl">
                    {openFaq === i ? "−" : "+"}
                  </div>
                </div>
                {openFaq === i && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-gray-400 text-sm leading-relaxed mt-4"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DOWNWARD DIVIDER */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" />

        {/* BOTTOM HALF: About Us & Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & About */}
          <div className="md:col-span-2">
            <h3 className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-4">
              VIA AI.
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
              We are a collective of engineers and educators building the world's most aggressive intelligence engine for students. We believe human potential is currently bottlenecked by inefficient, analog studying. Our mission is to digitize, analyze, and mathematically guarantee your academic success.
            </p>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Paper AI Core Technologies. All rights reserved.
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-widest text-sm">Modules</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#micro-weakness" className="hover:text-orange-400 transition-colors">Micro-Weakness Radar</a></li>
              <li><a href="#revision" className="hover:text-orange-400 transition-colors">Smart Revision Engine</a></li>
              <li><a href="#dashboard" className="hover:text-orange-400 transition-colors">Live Leaderboard</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Predictive Analytics</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-widest text-sm">Company</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-orange-400 transition-colors">About the Model</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy & Data</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Engine Service</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Contact Engineers</a></li>
            </ul>
          </div>

        </div>

      </div>
    </footer>
  );
}
