/**
 * Normalizes plain-text math from the question bank into TeX so MathJax can
 * typeset it like a real JEE paper. Older seeded questions store math as
 * unicode ("√(h c⁵ / G)", "a²b^(2/3)") and duplicate the options inside the
 * question text ("(A) ... (B) ..."). Questions that already contain TeX
 * delimiters are returned untouched.
 */

const SUP: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁺": "+", "⁻": "-",
};

const SUB: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};

const GREEK: Record<string, string> = {
  "α": "\\alpha ", "β": "\\beta ", "γ": "\\gamma ", "δ": "\\delta ",
  "ε": "\\varepsilon ", "θ": "\\theta ", "λ": "\\lambda ", "μ": "\\mu ",
  "π": "\\pi ", "ρ": "\\rho ", "σ": "\\sigma ", "τ": "\\tau ",
  "φ": "\\phi ", "ω": "\\omega ", "Δ": "\\Delta ", "Ω": "\\Omega ",
};

const SUP_RUN = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g;
const SUB_RUN = /[₀₁₂₃₄₅₆₇₈₉]+/g;

export function hasTex(s: string): boolean {
  return /\$|\\\(|\\\[/.test(s);
}

/**
 * Removes a trailing "(A) ... (B) ... (C) ..." block that duplicates the
 * separately-rendered options. Only strips when at least (A) and (B) both
 * appear after a line break, so prose references like "option (A)" survive.
 */
export function stripInlineOptions(s: string): string {
  const m = s.match(/[\n:]\s*\(A\)[\s\S]*\(B\)[\s\S]*$/);
  if (!m || m.index == null) return s;
  const sep = s[m.index];
  const head = s.slice(0, m.index).trimEnd();
  return sep === ":" ? `${head}:` : head;
}

/** Converts one plain math expression (e.g. inside √(...)) to TeX. */
function texifyExpr(expr: string): string {
  let t = "";
  // √(...) / √tok inside expressions → \sqrt{...} (recursive)
  for (let i = 0; i < expr.length; ) {
    if (expr[i] === "√") {
      let j = i + 1;
      while (expr[j] === " ") j++;
      if (expr[j] === "(") {
        const read = readBalanced(expr, j);
        if (read) {
          t += `\\sqrt{${texifyExpr(read[0])}}`;
          i = read[1] + 1;
          continue;
        }
      }
      const tok = expr.slice(j).match(/^[A-Za-z0-9α-ωΑ-Ω⁰¹²³⁴⁵⁶⁷⁸⁹₀-₉]+/);
      if (tok) {
        t += `\\sqrt{${texifyExpr(tok[0])}}`;
        i = j + tok[0].length;
        continue;
      }
    }
    t += expr[i];
    i++;
  }
  t = t.replace(SUP_RUN, run => `^{${[...run].map(c => SUP[c]).join("")}}`);
  t = t.replace(SUB_RUN, run => `_{${[...run].map(c => SUB[c]).join("")}}`);
  // x^(2/3) → x^{2/3}
  t = t.replace(/\^\(([^()]+)\)/g, "^{$1}");
  // Physics-style implicit subscripts: μ0, ε0, v1 → μ_0 …
  t = t.replace(/([A-Za-zα-ωΑ-Ω])(\d+)(?![.\d])/g, "$1_{$2}");
  for (const [ch, cmd] of Object.entries(GREEK)) t = t.split(ch).join(cmd);
  // Single top-level "/" → stacked fraction
  const parts = splitTopLevelSlash(t);
  if (parts) t = `\\frac{${parts[0].trim()}}{${parts[1].trim()}}`;
  return t.trim();
}

function splitTopLevelSlash(s: string): [string, string] | null {
  let depth = 0;
  let idx = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "{") depth++;
    else if (c === ")" || c === "}") depth--;
    else if (c === "/" && depth === 0) {
      if (idx !== -1) return null; // more than one → ambiguous, leave as-is
      idx = i;
    }
  }
  return idx === -1 ? null : [s.slice(0, idx), s.slice(idx + 1)];
}

function stripOuterParens(s: string): string {
  const t = s.trim();
  if (!t.startsWith("(") || !t.endsWith(")")) return t;
  const read = readBalanced(t, 0);
  return read && read[1] === t.length - 1 ? read[0].trim() : t;
}

const TOK_CHAR = /[A-Za-z0-9α-ωΑ-Ω⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀-₉^.]/;
const MATHY = /[0-9√^()⁰¹²³⁴⁵⁶⁷⁸⁹₀-₉α-ωΑ-Ω]/;

/**
 * Converts prose-level divisions like "1 / √(μ0ε0)", "E / B" or
 * "(a²b^(2/3)) / (√c d³)" into stacked \frac fractions. Only slashes at
 * paren depth 0 are considered — slashes inside √(...) or x^(2/3) are
 * handled later by texifyExpr.
 */
function convertDivisions(s: string): string {
  let out = "";
  let i = 0;
  let depth = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    if (c !== "/" || depth !== 0) { out += c; i++; continue; }

    // Left operand: balanced (...) group (with optional √ prefix) or a token
    let l = i - 1;
    while (l >= 0 && s[l] === " ") l--;
    let leftStart = -1;
    if (l >= 0 && s[l] === ")") {
      let d = 0, k = l;
      for (; k >= 0; k--) {
        if (s[k] === ")") d++;
        else if (s[k] === "(") { d--; if (d === 0) break; }
      }
      if (k >= 0 && d === 0) {
        leftStart = k;
        if (leftStart > 0 && s[leftStart - 1] === "√") leftStart--;
      }
    } else if (l >= 0 && TOK_CHAR.test(s[l])) {
      while (l >= 0 && s[l] === ".") l--; // "km." — dot is punctuation, not math
      let k = l;
      while (k >= 0 && TOK_CHAR.test(s[k])) k--;
      if (k >= 0 && s[k] === "√") k--;
      leftStart = k + 1;
    }
    if (leftStart === -1) { out += c; i++; continue; }
    const left = s.slice(leftStart, l + 1);

    // Right operand: √(...)/(...) group or a token
    let r = i + 1;
    while (r < s.length && s[r] === " ") r++;
    const rightStart = r;
    let rightEnd = -1;
    let rr = r;
    if (s[rr] === "√") { rr++; while (s[rr] === " ") rr++; }
    if (s[rr] === "(") {
      const read = readBalanced(s, rr);
      if (read) rightEnd = read[1];
    } else {
      let k = rr;
      while (k < s.length && TOK_CHAR.test(s[k])) k++;
      if (k > rr) rightEnd = k - 1;
      while (rightEnd >= rr && s[rightEnd] === ".") rightEnd--; // trailing punctuation
      if (rightEnd < rr) rightEnd = -1;
    }
    if (rightEnd === -1) { out += c; i++; continue; }
    const right = s.slice(rightStart, rightEnd + 1);

    // Only convert clearly mathematical divisions, not prose like "and/or"
    const mathy = MATHY.test(left) || MATHY.test(right) ||
      (left.length <= 3 && right.length <= 3);
    if (!mathy || left.length > 24 || right.length > 24) { out += c; i++; continue; }

    out = out.slice(0, out.length - (i - leftStart));
    out += `\\(\\frac{${texifyExpr(stripOuterParens(left))}}{${texifyExpr(stripOuterParens(right))}}\\)`;
    i = rightEnd + 1;
  }
  return out;
}

/** Finds √(...) with balanced parens and returns [inner, endIndex]. */
function readBalanced(s: string, open: number): [string, number] | null {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") {
      depth--;
      if (depth === 0) return [s.slice(open + 1, i), i];
    }
  }
  return null;
}

/**
 * Some rows store raw LaTeX with NO delimiters at all (e.g. an option that is
 * literally "\frac{1}{2k} \tan^{-1}(...)"). MathJax ignores undelimited TeX,
 * so students would see backslash soup. This wraps contiguous math runs in
 * \( \): a run starts at a clearly-TeX token (\cmd, braces, ^/_) and extends
 * over adjacent operator/number/short-variable tokens.
 */
function wrapBareTex(s: string): string {
  const parts = s.split(/(\s+)/);
  const n = parts.length;
  // URLs must never be treated as math even though they contain slashes and
  // underscores. (HTML tags are stripped by the caller before we get here, so
  // "=" is NOT excluded — it appears in legitimate math like "\frac{..}=9\times".)
  const prose = parts.map(p => /https?:|www\./.test(p));
  const hard = parts.map((p, k) => !prose[k] && (/\\[a-zA-Z]{2,}/.test(p) || /[{}]/.test(p) || /[\^_]/.test(p)));
  const glue = parts.map((p, k) =>
    /^\s+$/.test(p) ||
    (!prose[k] && (
      /^[0-9+\-*/×·()[\]|.,^_{}]+$/.test(p) ||
      /^[A-Za-z]\d*[.,;)]?$/.test(p)
    )),
  );
  const inMath = hard.slice();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < n; i++) {
      if (!inMath[i] && glue[i] && ((i > 0 && inMath[i - 1]) || (i < n - 1 && inMath[i + 1]))) {
        inMath[i] = true;
        changed = true;
      }
    }
  }
  let out = "";
  let i = 0;
  while (i < n) {
    if (!inMath[i]) { out += parts[i]; i++; continue; }
    let j = i;
    while (j < n && inMath[j]) j++;
    let seg = parts.slice(i, j).join("");
    const lead = (seg.match(/^\s*/) as RegExpMatchArray)[0];
    const trail = (seg.match(/\s*$/) as RegExpMatchArray)[0];
    seg = seg.trim();
    let post = "";
    if (/[.,;:]$/.test(seg)) { post = seg.slice(-1); seg = seg.slice(0, -1); }
    out += seg ? `${lead}\\(${seg}\\)${post}${trail}` : parts.slice(i, j).join("");
    i = j;
  }
  return out;
}

/**
 * Converts plain unicode math in mixed prose to TeX snippets MathJax will
 * typeset. No-op for strings that already contain TeX.
 */
export function normalizeMathText(s: string): string {
  if (!s) return s;
  // Split into: already-delimited math ($$..$$, $..$, \(..\)) and HTML tags
  // (both pass through untouched), plus the prose gaps between them. Each gap
  // is normalized independently — this is what lets a question mix proper
  // "$...$" math with bare "\vec{B}=3\times10^8" that needs delimiting.
  const TOKEN = /(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\$[^$]*?\$|<[^>]*>)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(s)) !== null) {
    out += processProse(s.slice(last, m.index));
    out += m[0];
    last = m.index + m[0].length;
  }
  out += processProse(s.slice(last));
  return out;
}

/** Normalizes one prose gap that contains NO delimited math or HTML tags. */
function processProse(seg: string): string {
  if (!seg) return seg;
  // Bare LaTeX commands with no delimiters → wrap the math runs in \( \).
  if (/\\[a-zA-Z]{2,}/.test(seg)) return wrapBareTex(seg);
  // Otherwise convert plain unicode math (divisions, √, super/subscripts).
  return normalizeProseSegment(seg);
}

function normalizeProseSegment(s: string): string {
  if (!s) return s;
  // Stacked fractions first — before the √ pass, so "1 / √(μ0ε0)" becomes
  // one \frac with the root inside it.
  s = convertDivisions(s);

  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === "√") {
      // √(expr) or √x / √3
      let j = i + 1;
      while (s[j] === " ") j++;
      if (s[j] === "(") {
        const read = readBalanced(s, j);
        if (read) {
          out += `\\(\\sqrt{${texifyExpr(read[0])}}\\)`;
          i = read[1] + 1;
          continue;
        }
      }
      const tok = s.slice(j).match(/^[A-Za-z0-9α-ωΑ-Ω]+/);
      if (tok) {
        out += `\\(\\sqrt{${texifyExpr(tok[0])}}\\)`;
        i = j + tok[0].length;
        continue;
      }
    }
    out += s[i];
    i++;
  }

  // Inline superscripts left in prose: c⁵, d³, 10⁻³ → \(c^{5}\) …
  out = out.replace(
    /([A-Za-z0-9)\]α-ωΑ-Ω])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g,
    (_, base, run) => `\\(${texifyExpr(base + run)}\\)`,
  );
  // Inline subscripts: v₁, μ₀ → \(v_{1}\)
  out = out.replace(
    /([A-Za-zα-ωΑ-Ω])([₀₁₂₃₄₅₆₇₈₉]+)/g,
    (_, base, run) => `\\(${texifyExpr(base + run)}\\)`,
  );
  // Parenthesised power notation in prose: x^(2/3) → \(x^{2/3}\)
  out = out.replace(
    /([A-Za-z0-9α-ωΑ-Ω])\^\(([^()]+)\)/g,
    (_, base, exp) => `\\(${base}^{${exp}}\\)`,
  );

  return out;
}
