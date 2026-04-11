"use client";

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7ed] to-[#ffe4cc] p-6">

      <div className="max-w-5xl mx-auto space-y-6">

        <h1 className="text-4xl font-bold text-gray-900">
          Your Study Roadmap 🚀
        </h1>

        {/* WEAK */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-orange-500">Weak Areas ⚠️</h2>
          <ul className="mt-3 text-gray-700 space-y-1">
            <li>• Kinematics</li>
            <li>• Organic Chemistry</li>
          </ul>
        </div>

        {/* PLAN */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-orange-500">Action Plan 📌</h2>
          <ul className="mt-3 text-gray-700 space-y-1">
            <li>• Practice 30 MCQs daily</li>
            <li>• Revise theory + notes</li>
            <li>• Weekly mock test</li>
          </ul>
        </div>

        {/* REVISION */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-orange-500">Revision Plan 🔁</h2>
          <ul className="mt-3 text-gray-700 space-y-1">
            <li>• Revise every 3 days</li>
            <li>• Weekly full revision</li>
          </ul>
        </div>

      </div>
    </div>
  );
}