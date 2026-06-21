import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkIdToUuid } from '@/utils/helpers'

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

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

    // Fetch subjects of these questions to map in memory (safe from relationship join errors)
    const questionIds = Array.from(new Set(dbAttempts.map((a: any) => a.question_id)))
    const { data: questions } = await supabase
      .from('questions')
      .select('id, subject')
      .in('id', questionIds)

    const subjectMap: { [id: number]: string } = {}
    questions?.forEach((q: any) => {
      subjectMap[q.id] = q.subject || "physics"
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

export async function POST(req: Request) {
  // Keep POST method writing to user_actions if anything calls it
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { questionId, subject, isCorrect, selectedOption, timeSpent } = await req.json()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_actions')
      .insert({
        user_id: userId,
        action_type: 'question_submit',
        category: 'Practice',
        label: subject,
        payload: {
          questionId,
          subject,
          isCorrect,
          selectedOption,
          timeSpent,
          timestamp: new Date().toISOString()
        }
      })

    if (error) {
      console.warn("Supabase progress logging warning:", error.message)
      return NextResponse.json({ success: false, warning: error.message })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.warn("Progress POST catch warning:", err.message)
    return NextResponse.json({ success: false, warning: err.message })
  }
}
