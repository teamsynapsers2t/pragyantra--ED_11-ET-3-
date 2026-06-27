"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(165deg,#FCEFDC 0%,#FBF5EB 46%,#F7E6D2 100%)",
      fontFamily: "system-ui, sans-serif",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: 24,
        padding: "48px 40px",
        maxWidth: 480,
        width: "100%",
        boxShadow: "0 20px 60px -20px rgba(170,110,45,0.25)",
      }}>
        <div style={{
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 72,
          lineHeight: 1,
          background: "linear-gradient(118deg,#F4AB2D,#DE6E1C)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          marginBottom: 20,
        }}>
          404
        </div>

        <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "#B97A12", marginBottom: 12 }}>
          Page not found
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2E2620", margin: "0 0 12px", lineHeight: 1.3 }}>
          This page doesn&apos;t exist
        </h1>

        <p style={{ fontSize: 15, color: "#8C7D6E", lineHeight: 1.6, margin: "0 0 32px" }}>
          The page you&apos;re looking for has moved or never existed. Head back to keep practising.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "13px 24px", borderRadius: 13, border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 14, color: "#fff",
              background: "linear-gradient(120deg,#F2A52A,#E0701E)",
              boxShadow: "0 10px 24px -8px rgba(224,112,30,.7)",
            }}
          >
            Go to Dashboard →
          </button>
          <button
            onClick={() => router.back()}
            style={{
              padding: "13px 24px", borderRadius: 13, border: "1.5px solid rgba(199,96,15,0.25)", cursor: "pointer",
              fontWeight: 700, fontSize: 14, color: "#C7600F",
              background: "rgba(255,255,255,0.6)",
            }}
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
