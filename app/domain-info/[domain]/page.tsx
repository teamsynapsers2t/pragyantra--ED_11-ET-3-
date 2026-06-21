"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const domainData = {
  jee: {
    title: "Joint Entrance Examination (JEE)",
    shortName: "JEE",
    description: "The gateway to India's premier engineering institutes like IITs, NITs, and IIITs.",
    subjects: ["Physics"],
    highlights: [
      "Tests analytical and problem-solving skills",
      "Two stages: JEE Main and JEE Advanced",
      "Highly competitive with millions of aspirants"
    ],
    examDetails: [
      { label: "Duration", value: "3 Hours", icon: "⏳" },
      { label: "Total Questions", value: "90 (Attempt 75)", icon: "📝" },
      { label: "Total Marks", value: "300", icon: "💯" },
      { label: "Marking Scheme", value: "+4 for correct", icon: "✅" },
      { label: "Negative Marking", value: "-1 for incorrect", icon: "❌" }
    ],
    color: "from-orange-500 to-red-500"
  },
  neet: {
    title: "National Eligibility cum Entrance Test (NEET)",
    shortName: "NEET",
    description: "The single national level medical entrance exam for admission to MBBS and BDS courses in India.",
    subjects: ["Physics"],
    highlights: [
      "Tests conceptual clarity and memory",
      "Single stage objective exam",
      "Gateway to top medical colleges like AIIMS"
    ],
    examDetails: [
      { label: "Duration", value: "3 Hours 20 mins", icon: "⏳" },
      { label: "Total Questions", value: "200 (Attempt 180)", icon: "📝" },
      { label: "Total Marks", value: "720", icon: "💯" },
      { label: "Marking Scheme", value: "+4 for correct", icon: "✅" },
      { label: "Negative Marking", value: "-1 for incorrect", icon: "❌" }
    ],
    color: "from-blue-500 to-cyan-500"
  }
};

export default function DomainInfoPage() {
  const router = useRouter();
  const params = useParams();
  const domainParam = typeof params.domain === "string" ? params.domain.toLowerCase() : "";
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const info = domainData[domainParam as keyof typeof domainData];

  if (!info) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0e0e0e] to-[#1a1a1a] text-white flex items-center justify-center">
        <h1 className="text-2xl">Domain not found</h1>
        <button onClick={() => router.push("/select-domain")} className="ml-4 text-orange-500">Go Back</button>
      </div>
    );
  }

  const handleStart = () => {
    // Optionally fetch domain from storage if not already there, but select-domain saves it
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e0e] to-[#1a1a1a] text-white flex flex-col items-center py-20 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[500px] h-[500px] bg-orange-400/5 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full z-10"
      >
        {/* Back Button */}
        <button 
          onClick={() => router.push("/select-domain")}
          className="mb-8 text-gray-400 hover:text-white flex items-center transition"
        >
          ← Back to Selection
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${info.color}`} />
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-orange-500">{info.shortName}</span> - {info.title.replace(`(${info.shortName})`, '')}
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 leading-relaxed border-b border-white/10 pb-8">
            {info.description}
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Subjects */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mr-3 text-sm">📚</span>
                Core Subjects
              </h2>
              <ul className="space-y-4">
                {info.subjects.map((subject, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    className="flex items-center text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-4" />
                    {subject}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Highlights */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mr-3 text-sm">🎯</span>
                Key Highlights
              </h2>
              <ul className="space-y-4">
                {info.highlights.map((highlight, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    <div className="text-orange-400 mr-3">✓</div>
                    {highlight}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Exam Details Section */}
          <div className="mt-12 border-t border-white/10 pt-10">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mr-3 text-sm">📊</span>
              Exam Pattern & Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {info.examDetails.map((detail, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-colors group cursor-default"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{detail.icon}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{detail.label}</div>
                  <div className="text-sm font-medium text-white">{detail.value}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-full text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all"
            >
              Start {info.shortName} Journey →
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
