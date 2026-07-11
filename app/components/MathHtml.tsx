"use client";

import { useEffect, useRef, useMemo, createElement, type CSSProperties } from "react";
import { normalizeMathText, stripInlineOptions } from "@/utils/mathText";

declare global {
  interface Window { MathJax?: any }
}

// Question bank stores legacy MathJax-style TeX ($$..$$ used inline, \over,
// \mkern etc.), so we render with MathJax v3 rather than KaTeX. Loaded once
// from CDN — no npm package, consistent with the Sentry/PostHog approach.
let mathJaxLoading: Promise<void> | null = null;

function loadMathJax(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MathJax?.typesetPromise) return Promise.resolve();
  if (!mathJaxLoading) {
    mathJaxLoading = new Promise<void>(resolve => {
      window.MathJax = {
        tex: {
          // The dataset uses $$..$$ for inline math, not display math; some
          // rows also use single-$ ("$T$"), so enable both.
          inlineMath: [["$$", "$$"], ["$", "$"], ["\\(", "\\)"]],
          displayMath: [["\\[", "\\]"]],
          processEscapes: true,
        },
        options: {
          skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        },
        startup: {
          typeset: false,
          ready() {
            window.MathJax.startup.defaultReady();
            resolve();
          },
        },
      };
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return mathJaxLoading;
}

interface MathHtmlProps {
  html: string;
  inline?: boolean;
  /** Strip a trailing "(A) ... (B) ..." block duplicated in question text. */
  stripOptions?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Renders question-bank HTML and typesets any embedded TeX with MathJax. */
export default function MathHtml({ html: rawHtml, inline = false, stripOptions = false, className, style }: MathHtmlProps) {
  const ref = useRef<HTMLElement>(null);
  const typesetFor = useRef<string | null>(null);

  // Older seeded questions store math as plain unicode — convert to TeX so
  // MathJax typesets them like the LaTeX-formatted questions.
  const html = useMemo(() => {
    let t = rawHtml || "";
    if (stripOptions) t = stripInlineOptions(t);
    return normalizeMathText(t);
  }, [rawHtml, stripOptions]);

  // Manage the content IMPERATIVELY (not via dangerouslySetInnerHTML) so that
  // React's frequent re-renders — the practice timer ticks every second — never
  // touch the DOM we hand to MathJax. We write innerHTML + typeset exactly once
  // per distinct html value; unrelated re-renders are true no-ops → no flicker.
  useEffect(() => {
    const el = ref.current;
    if (!el || typesetFor.current === html) return;
    typesetFor.current = html;
    el.innerHTML = html;
    if (!/\$|\\\(|\\\[/.test(html)) return; // no math to typeset
    let cancelled = false;
    loadMathJax().then(() => {
      if (!cancelled && ref.current && window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([ref.current]).catch(() => {});
      }
    });
    return () => { cancelled = true; };
  }, [html]);

  return createElement(inline ? "span" : "div", { ref, className, style });
}
