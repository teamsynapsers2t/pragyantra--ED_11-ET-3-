import { createServiceClient } from "@/utils/supabase/service";
import { fractionToPercent } from "@/utils/scale";

const clean = (s: string) =>
  s ? s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

/**
 * Builds a compact, plain-text snapshot of the student's real PAPER data
 * (weak concepts, root-cause chains, accuracy) to inject into the mentor's
 * system prompt. This is what makes the chatbot a mentor rather than a generic
 * tutor — it speaks to the student's actual mistakes.
 */
export async function buildStudentContext(userUuid: string): Promise<string> {
  const sb = createServiceClient();

  const [signalsRes, masteryRes, conceptsRes, chaptersRes, totalRes, correctRes] = await Promise.all([
    sb.from("weakness_signals").select("*").eq("user_id", userUuid),
    sb.from("concept_mastery").select("concept_id, mastery_score, total_attempts, total_correct").eq("user_id", userUuid),
    sb.from("concepts").select("id, concept_name, chapter_id"),
    sb.from("chapters").select("id, subject"),
    sb.from("attempts").select("*", { count: "exact", head: true }).eq("user_id", userUuid),
    sb.from("attempts").select("*", { count: "exact", head: true }).eq("user_id", userUuid).eq("is_correct", true),
  ]);

  const concepts = conceptsRes.data || [];
  const chapters = chaptersRes.data || [];
  const chapterSubject: Record<number, string> = {};
  chapters.forEach((c: any) => { chapterSubject[c.id] = c.subject || "Other"; });
  const conceptName: Record<number, string> = {};
  const conceptSubject: Record<number, string> = {};
  concepts.forEach((c: any) => {
    conceptName[c.id] = clean(c.concept_name || "");
    conceptSubject[c.id] = chapterSubject[c.chapter_id] || "Other";
  });

  const totalAttempts = totalRes.count || 0;
  const correctAttempts = correctRes.count || 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  if (totalAttempts === 0) {
    return "STUDENT SNAPSHOT: This student is brand new — they haven't attempted any questions yet. Encourage them to start a short practice session so PAPER can find their root causes.";
  }

  // Weakest concepts by mastery (only ones they've actually practised)
  const mastery = (masteryRes.data || [])
    .filter((m: any) => (m.total_attempts ?? 0) > 0)
    .map((m: any) => ({
      name: conceptName[m.concept_id] || "Unknown",
      subject: conceptSubject[m.concept_id] || "Other",
      pct: fractionToPercent(m.mastery_score),
    }))
    .filter(m => m.name !== "Unknown")
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  // Root-cause chains detected by the engine
  const rootChains: string[] = [];
  for (const s of (signalsRes.data || [])) {
    if (s.signal !== "root_flaw") continue;
    let ev: any = s.evidence;
    if (typeof ev === "string") { try { ev = JSON.parse(ev); } catch { ev = {}; } }
    const root = clean(ev?.root_concept_name || "");
    const surface = clean(ev?.weak_concept_name || conceptName[s.concept_id] || "");
    const subj = conceptSubject[s.concept_id] || "Other";
    if (root && surface && root !== surface) rootChains.push(`In ${subj}, mistakes in "${surface}" trace back to a weak foundation: "${root}".`);
    else if (root) rootChains.push(`In ${subj}, "${root}" is a foundational gap to fix first.`);
    if (rootChains.length >= 4) break;
  }

  const lines: string[] = [];
  lines.push(`STUDENT SNAPSHOT (real PAPER data — use it, don't invent numbers):`);
  lines.push(`- Practice so far: ${totalAttempts} questions attempted, ${accuracy}% accuracy.`);
  if (mastery.length) {
    lines.push(`- Weakest concepts (mastery %): ${mastery.map(m => `${m.name} ${m.pct}% (${m.subject})`).join("; ")}.`);
  }
  if (rootChains.length) {
    lines.push(`- Root causes PAPER detected:`);
    rootChains.forEach(c => lines.push(`   • ${c}`));
  } else {
    lines.push(`- No root-cause chains detected yet — suggest more practice in weak areas so the engine can trace them.`);
  }
  return lines.join("\n");
}
