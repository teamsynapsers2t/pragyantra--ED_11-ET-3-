import { ImageResponse } from "next/og";

// Dynamic Open Graph image rendered at build/request time — shown when a PAPER
// link is shared on WhatsApp, Twitter/X, LinkedIn, etc. No static asset needed.
export const alt = "PAPER — Find the root cause of every JEE & NEET mistake";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg,#FCEFDC 0%,#FBF5EB 50%,#F7E6D2 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -1, color: "#2E2620", marginBottom: 32 }}>
          PA<span style={{ color: "#E07A38" }}>P</span>ER
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.1, color: "#2E2620", maxWidth: 920 }}>
          Find the root cause of every mistake.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#8C7D6E", marginTop: 28, maxWidth: 860 }}>
          Personalised JEE &amp; NEET prep that fixes the foundation, not the symptom.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(120deg,#F2A52A,#E0701E)",
            padding: "14px 30px",
            borderRadius: 14,
            alignSelf: "flex-start",
          }}
        >
          JEE · NEET
        </div>
      </div>
    ),
    { ...size },
  );
}
