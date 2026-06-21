"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-4 bg-white/70 backdrop-blur-md z-50">
      <h1 className="text-xl font-bold text-orange-500">VIA</h1>

      <div className="hidden md:flex gap-8 text-gray-700">
        <a href="#">Features</a>
        <a href="#">How it works</a>
        <Link href="/dashboard" className="hover:text-orange-500 transition">Dashboard</Link>
        <a href="#">Pricing</a>
      </div>

      <div className="flex items-center gap-4">
        <Show when="signed-out">
          <Link href="/sign-in" className="text-gray-700 hover:text-orange-500 font-medium transition">
            Log in
          </Link>
          <Link href="/sign-up" className="bg-orange-500 text-white px-5 py-2 hover:bg-orange-600 font-medium rounded-lg shadow-md transition">
            Sign up →
          </Link>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard" className="text-gray-700 hover:text-orange-500 font-medium transition">
            Dashboard
          </Link>
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}