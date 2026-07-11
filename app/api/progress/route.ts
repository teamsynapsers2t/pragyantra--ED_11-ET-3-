import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { rateLimit, tooManyRequests } from "@/utils/rateLimit"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const rl = rateLimit('progress', userId, 120, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

    const supabase = await createClient()
    const userUuid = clerkIdToUuid(userId)

    // Fetch attempts
    const { data: dbAttempts, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', userUuid)

    if (error) {
      console.error("Error fetching attempts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!dbAttempts || dbAttempts.length === 0) {
      return NextResponse.json({ attempts: [] })
    }

    // Resolve each question's subject via its chapter (authoritative), mirroring
    // /api/questions which derives subject from the `chapters` table, not a flat
    // `questions.subject` column (that one can be stale/null).
    const questionIds = Array.from(new Set(dbAttempts.map((a: any) => a.question_id)))
    const { data: questions } = await supabase
      .from('questions')
      .select('id, chapter_id')
      .in('id', questionIds)

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, subject')
    const chapterSubject: { [id: number]: string } = {}
    chapters?.forEach((c: any) => { chapterSubject[c.id] = c.subject || "physics" })

    const subjectMap: { [id: number]: string } = {}
    questions?.forEach((q: any) => {
      subjectMap[q.id] = chapterSubject[q.chapter_id] || "physics"
    })

    const attempts = dbAttempts.map((a: any) => ({
      questionId: String(a.question_id),
      subject: subjectMap[a.question_id] || "physics",
      isCorrect: a.is_correct,
      selectedOption: a.selected_option,
      timeSpent: Math.round((a.time_taken_ms || 0) / 1000), // convert ms to seconds
      timestamp: a.created_at
    }))

    return NextResponse.json({ attempts })

  } catch (err: any) {
    console.error("Progress GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
