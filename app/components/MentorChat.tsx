"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import MathHtml from "@/app/components/MathHtml";
import { mentorMarkdown } from "@/utils/mentorMarkdown";

type Role = "user" | "assistant";
interface Msg { role: Role; content: string }

// The mentor emits one optional action marker: ⟦ACTION:practice|subject=..|concept=..⟧
const ACTION_RE = /⟦ACTION:practice\|subject=([^|]+)\|concept=([^⟧]+)⟧/;

function parseAction(text: string): { subject: string; concept: string } | null {
  const m = text.match(ACTION_RE);
  if (!m) return null;
  return { subject: m[1].trim(), concept: m[2].trim() };
}

// Hide the marker (complete or a partial trailing "⟦…" still streaming) from view.
function visibleText(text: string): string {
  return text.replace(ACTION_RE, "").replace(/⟦[^⟧]*$/, "").trimEnd();
}

const STARTERS = [
  "What should I study today?",
  "Explain projectile motion simply",
  "Why do I keep losing marks?",
];

// Distinctive AI "spark" mark — a large four-point sparkle with a small
// companion. Reads clearly as an AI mentor and feels premium, not generic.
function MentorMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.8c.55 4.9 1.75 6.1 6.65 6.65-4.9.55-6.1 1.75-6.65 6.65-.55-4.9-1.75-6.1-6.65-6.65C10.25 7.9 11.45 6.7 12 1.8Z" />
      <path d="M18.6 13.4c.28 2.45.92 3.08 3.35 3.35-2.43.28-3.07.9-3.35 3.35-.28-2.45-.9-3.07-3.35-3.35 2.45-.27 3.07-.9 3.35-3.35Z" opacity="0.9" />
    </svg>
  );
}

export default function MentorChat() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error("mentor unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(m => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages(m => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: "assistant", content: "Sorry — I couldn't reach the mentor just now. Please try again in a moment." };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }, [messages, busy]);

  const startPractice = (subject: string, concept: string) => {
    const p = new URLSearchParams({ v: "practice", exam: "jee", subject });
    if (concept) p.set("concept", concept);
    setOpen(false);
    router.push(`/question_dashboard?${p.toString()}`);
  };

  if (!isSignedIn) return null;

  const OR = "#E0701E";
  const brandGrad = "linear-gradient(120deg,#F2A52A,#E0701E)";

  return (
    <>
      <style>{`
        @keyframes mentorGlow { 0%,100%{ box-shadow:0 14px 34px -8px rgba(224,112,30,0.75); } 50%{ box-shadow:0 14px 40px -6px rgba(224,112,30,0.95); } }
        .mentor-launcher { animation: mentorGlow 3s ease-in-out infinite; transition: transform .2s ease; }
        .mentor-launcher:hover { transform: translateY(-3px) scale(1.05); }
        /* Mentor reply formatting — proper spacing so it reads like a real assistant */
        .mentor-md { font-size: 14.5px; color: #2E2620; }
        .mentor-md > *:first-child { margin-top: 0; }
        .mentor-md > *:last-child { margin-bottom: 0; }
        .mentor-md p { margin: 0 0 10px; line-height: 1.62; }
        .mentor-md ul, .mentor-md ol { margin: 8px 0 12px; padding-left: 22px; }
        .mentor-md li { margin: 5px 0; line-height: 1.55; }
        .mentor-md li::marker { color: #C7600F; }
        .mentor-md h4, .mentor-md h5, .mentor-md h6 { margin: 14px 0 6px; font-size: 14.5px; font-weight: 800; color: #1F1A13; }
        .mentor-md strong { font-weight: 700; color: #1F1A13; }
        .mentor-md em { font-style: italic; }
        .mentor-md code { background: rgba(120,90,50,.12); padding: 1px 6px; border-radius: 6px; font-size: 12.5px; font-family: 'SF Mono',Menlo,Consolas,monospace; }
        .mentor-md mjx-container { margin: 2px 0; }
        .mentor-md mjx-container[display="true"] { margin: 12px 0; overflow-x: auto; overflow-y: hidden; }
      `}</style>

      {/* Launcher bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open your AI mentor"
          className="mentor-launcher"
          style={{ position: "fixed", right: 22, bottom: 22, zIndex: 90, width: 60, height: 60, borderRadius: 20, border: "none", cursor: "pointer", background: brandGrad, boxShadow: "0 14px 34px -8px rgba(224,112,30,0.75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <MentorMark size={28} />
        </button>
      )}

      {open && (
        <div style={{ position: "fixed", right: 22, bottom: 22, zIndex: 95, width: "min(400px, calc(100vw - 32px))", height: "min(620px, calc(100vh - 44px))", background: "#FFFDF9", borderRadius: 22, boxShadow: "0 30px 70px -20px rgba(80,45,10,0.45), 0 0 0 1px rgba(212,120,10,0.12)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Hanken Grotesk',system-ui,sans-serif" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: brandGrad, color: "#fff", flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
              <MentorMark size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: -0.2 }}>PAPER · Your Mentor</div>
              <div style={{ fontSize: 11.5, opacity: 0.9 }}>Ask anything · knows your weak spots</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ margin: "auto 0", textAlign: "center", padding: "10px 6px" }}>
                <div style={{ display: "inline-flex", width: 56, height: 56, borderRadius: 18, background: brandGrad, color: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 10px 24px -10px rgba(224,112,30,0.7)" }}>
                  <MentorMark size={30} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2E2620", marginBottom: 6 }}>I&apos;m PAPER, your mentor.</div>
                <div style={{ fontSize: 13.5, color: "#8C7D6E", lineHeight: 1.55, maxWidth: 300, margin: "0 auto 16px" }}>
                  Ask me any doubt — a concept, a problem, exam strategy — or I&apos;ll use your weak spots to guide you. Try:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(212,120,10,0.25)", background: "#fff", color: "#7A5A1E", fontSize: 13.5, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} style={{ alignSelf: "flex-end", maxWidth: "85%", background: brandGrad, color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {m.content}
                  </div>
                );
              }
              const action = parseAction(m.content);
              const shown = visibleText(m.content);
              const streaming = busy && i === messages.length - 1;
              return (
                <div key={i} style={{ alignSelf: "flex-start", maxWidth: "90%" }}>
                  <div style={{ background: "#F6EEE0", color: "#2E2620", padding: "11px 15px", borderRadius: "16px 16px 16px 4px", fontSize: 14.5, lineHeight: 1.6 }}>
                    {shown
                      ? <MathHtml className="mentor-md" html={mentorMarkdown(shown)} />
                      : streaming ? <span style={{ color: "#B0A192" }}>PAPER is thinking…</span> : null}
                  </div>
                  {action && !streaming && (
                    <button onClick={() => startPractice(action.subject, action.concept)}
                      style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "none", background: brandGrad, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px -10px rgba(224,112,30,0.7)" }}>
                      Practise {action.concept}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M12 5l7 7-7 7"/></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div style={{ borderTop: "1px solid rgba(212,120,10,0.14)", padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0, background: "#FFFDF9" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask your mentor…"
              rows={1}
              style={{ flex: 1, resize: "none", maxHeight: 100, padding: "11px 14px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "#2E2620", fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.4 }}
            />
            <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Send"
              style={{ width: 44, height: 44, borderRadius: 13, border: "none", cursor: busy || !input.trim() ? "default" : "pointer", background: busy || !input.trim() ? "rgba(0,0,0,0.08)" : brandGrad, color: busy || !input.trim() ? "#b0b0b0" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
