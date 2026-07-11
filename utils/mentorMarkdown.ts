/**
 * Lightweight Markdown → HTML for the mentor chat so replies read like a real
 * assistant (paragraphs, lists, bold, headings) instead of one continuous block.
 * Not a full CommonMark parser — just the subset the mentor uses. LaTeX math
 * segments ($…$, $$…$$, \(…\), \[…\]) are protected first so Markdown never
 * mangles them, and MathJax typesets them afterwards (via MathHtml).
 */

// Private-use sentinels: survive HTML-escaping, trimming and word-joining.
const OPEN = "";
const CLOSE = "";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  // bold **text** / __text__ (before italic so ** isn't eaten as two *)
  s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+?)__/g, "<strong>$1</strong>");
  // italic *text* / _text_ — require a non-space edge so it won't catch stray *
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[\s(])_([^_\s][^_]*?)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  // inline code `code`
  s = s.replace(/`([^`]+?)`/g, "<code>$1</code>");
  return s;
}

export function mentorMarkdown(text: string): string {
  if (!text) return "";

  // 1. Protect math so Markdown/escaping never touches it.
  const math: string[] = [];
  const protectedText = text.replace(
    /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]*?\$|\\\([\s\S]*?\\\)/g,
    (m) => { math.push(m); return OPEN + (math.length - 1) + CLOSE; },
  );

  // 2. Escape HTML in the prose.
  const escaped = escapeHtml(protectedText);

  // 3. Block-level parse.
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];
  const closeList = () => { if (listType) { out.push("</" + listType + ">"); listType = null; } };
  const flushPara = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushPara(); closeList(); continue; }

    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushPara(); closeList(); const lvl = Math.min(6, h[1].length + 3); out.push("<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">"); continue; }

    const ul = t.match(/^[-*•]\s+(.*)$/);
    if (ul) { flushPara(); if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; } out.push("<li>" + inline(ul[1]) + "</li>"); continue; }

    const ol = t.match(/^\d+[.)]\s+(.*)$/);
    if (ol) { flushPara(); if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; } out.push("<li>" + inline(ol[1]) + "</li>"); continue; }

    closeList();
    para.push(t);
  }
  flushPara();
  closeList();

  // 4. Restore math (escaped so any <, >, & inside stays valid HTML; MathJax
  //    reads the decoded textContent).
  const restoreRe = new RegExp(OPEN + "(\\d+)" + CLOSE, "g");
  return out.join("").replace(restoreRe, (_, n) => escapeHtml(math[Number(n)]));
}
