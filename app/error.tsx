"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

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
          width: 64, height: 64, margin: "0 auto 24px",
          borderRadius: 18,
          background: "rgba(237,99,78,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>

        <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "#B97A12", marginBottom: 12 }}>
          Something went wrong
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2E2620", margin: "0 0 12px", lineHeight: 1.3 }}>
          Unexpected error
        </h1>

        <p style={{ fontSize: 15, color: "#8C7D6E", lineHeight: 1.6, margin: "0 0 32px" }}>
          PAPER hit an unexpected error. Your practice data is safe — try refreshing or go back to the dashboard.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={reset}
            style={{
              padding: "13px 24px", borderRadius: 13, border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 14, color: "#fff",
              background: "linear-gradient(120deg,#F2A52A,#E0701E)",
              boxShadow: "0 10px 24px -8px rgba(224,112,30,.7)",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "13px 24px", borderRadius: 13, border: "1.5px solid rgba(199,96,15,0.25)", cursor: "pointer",
              fontWeight: 700, fontSize: 14, color: "#C7600F",
              background: "rgba(255,255,255,0.6)",
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
