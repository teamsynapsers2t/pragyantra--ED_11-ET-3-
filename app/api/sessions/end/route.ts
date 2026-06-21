import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { createServiceClient } from '@/utils/supabase/service'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { sessionId, questionsAttempted, questionsCorrect, questionsSkipped } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const userUuid = clerkIdToUuid(userId)

    // 1. Update session with end data
    const now = new Date().toISOString()

    // Get the session's start time to calculate duration
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('id', parseInt(sessionId))
      .eq('user_id', userUuid)
      .single()

    if (fetchError || !session) {
      console.error("[API Sessions/End] Session not found:", fetchError)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const durationMs = new Date(now).getTime() - new Date(session.started_at).getTime()

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        ended_at: now,
        duration_ms: durationMs,
        questions_attempted: questionsAttempted || 0,
        questions_correct: questionsCorrect || 0,
        questions_skipped: questionsSkipped || 0,
      })
      .eq('id', parseInt(sessionId))
      .eq('user_id', userUuid)

    if (updateError) {
      console.error("[API Sessions/End] Update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 2. Trigger weakness report generation via RPC
    let reportText: string | null = null
    try {
      const { data: reportData, error: reportError } = await supabase
        .rpc('fn_generate_weakness_report', { p_user_id: userUuid })

      if (reportError) {
        console.warn("[API Sessions/End] Report generation error:", reportError)
      } else {
        reportText = reportData
      }
    } catch (err) {
      console.warn("[API Sessions/End] RPC call failed:", err)
    }

    return NextResponse.json({
      success: true,
      durationMs,
      reportText,
    })
  } catch (err: any) {
    console.error("[API Sessions/End] Handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
