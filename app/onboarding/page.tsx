"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("");

  const [form, setForm] = useState({
    name: "",
    age: "",
    class: "",
    level: "",
    journey: "",
  });

  const [error, setError] = useState("");

  // 🔥 get domain from previous page
  useEffect(() => {
    const savedDomain = localStorage.getItem("domain");
    if (savedDomain) setDomain(savedDomain);
  }, []);

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim()) return "Name cannot be empty.";
      if (/\d/.test(form.name)) return "Name should not contain numbers.";
    }
    if (step === 2) {
      if (!form.age.trim()) return "Age cannot be empty.";
      if (/\D/.test(form.age)) return "Age must contain only numbers.";
    }
    if (step === 3 && !form.class) return "Please select a class.";
    if (step === 4 && !form.level) return "Please select a preparation level.";
    if (step === 5 && !form.journey.trim()) return "Please share something about your journey.";
    return "";
  };

  const handleNext = () => {
    const errorMsg = validateStep();
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setError("");
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleChange = (key: string, value: string) => {
    setError("");
    setForm({ ...form, [key]: value });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7ed] via-[#fff1e6] to-[#ffe4cc] relative overflow-hidden"
      onKeyDown={async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (step < 5) {
            handleNext();
          } else {
            const errorMsg = validateStep();
            if (errorMsg) {
              setError(errorMsg);
              window.location.href = "/transition";
            }
          }
        }
      }}
    >

      {/* 🔥 glow background */}
      <div className="absolute w-[700px] h-[700px] bg-orange-300 opacity-30 blur-[120px] rounded-full top-[-150px] left-[-150px]" />
      <div className="absolute w-[600px] h-[600px] bg-orange-400 opacity-20 blur-[100px] rounded-full bottom-[-150px] right-[-150px]" />

      {/* 🔥 MAIN CARD */}
      <div className="w-[92%] max-w-5xl h-[75vh] bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-orange-100 flex flex-col justify-between p-10">

        {/* HEADER */}
        <div>

          {/* 🔥 DOMAIN + STEP */}
          <p className="text-orange-500 font-semibold text-sm mb-2">
            {domain ? `${domain} Journey` : "Your Journey"} • Step {step} of 5
          </p>

          {/* 🔥 PROGRESS BAR */}
          <div className="w-full h-2 bg-orange-100 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* QUESTION */}
          <motion.h2
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
          >
            {step === 1 && "What's your name?"}
            {step === 2 && "Your age?"}
            {step === 3 && "Which class are you in?"}
            {step === 4 && "Your preparation level?"}
            {step === 5 && "How’s your journey going?"}
          </motion.h2>

          {/* INPUT AREA */}
          <motion.div
            key={"input-" + step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >

            {/* STEP 1 */}
            {step === 1 && (
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full p-4 rounded-xl border border-orange-200 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-lg"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <input
                type="text"
                placeholder="Enter your age"
                className="w-full p-4 rounded-xl border border-orange-200 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-lg"
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
              />
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <select
                className="w-full p-4 rounded-xl border border-orange-200 bg-white text-gray-900 text-lg focus:border-orange-500 outline-none"
                value={form.class}
                onChange={(e) => handleChange("class", e.target.value)}
              >
                <option value="">Select your class</option>
                <option>Class 9</option>
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
                <option>Dropper</option>
              </select>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="grid grid-cols-3 gap-4">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      handleChange("level", level);
                    }}
                    className={`p-4 rounded-xl border text-lg font-medium transition-all duration-300
                      ${
                        form.level === level
                          ? "bg-orange-500 text-white border-orange-500 shadow-lg scale-105"
                          : "bg-white border-orange-200 text-gray-700 hover:bg-orange-100"
                      }
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <textarea
                placeholder="Tell us your struggles..."
                className="w-full p-4 rounded-xl border border-orange-200 bg-white text-gray-900 placeholder-gray-400 text-lg h-32 focus:border-orange-500 outline-none"
                value={form.journey}
                onChange={(e) => handleChange("journey", e.target.value)}
              />
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 font-medium mt-4 text-sm"
              >
                {error}
              </motion.p>
            )}

          </motion.div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-6">

          {step > 1 ? (
            <button
              onClick={() => {
                handleBack()
              }}
              className="text-gray-600 text-lg hover:text-black transition"
            >
              ← Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              onClick={() => {
                handleNext()
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-lg shadow-md transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={async () => {
                const errorMsg = validateStep();
                if (errorMsg) {
                  setError(errorMsg);
                } else {
                  // SECURE CACHE INJECTION
                  localStorage.setItem("onboardingData", JSON.stringify(form));
                  window.location.href = "/transition";
                }
              }}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl text-lg shadow-md hover:bg-orange-600 transition"
            >
              Finish 🚀
            </button>
          )}

        </div>

      </div>
    </div>
  );
}