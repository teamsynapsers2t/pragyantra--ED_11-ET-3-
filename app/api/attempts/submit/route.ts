import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { createServiceClient } from '@/utils/supabase/service'

/**
 * Numerical answer tolerance for JEE questions.
 * Uses the LARGER of:
 *   - Absolute tolerance: ±0.01
 *   - Relative tolerance: 0.1% of the correct value
 * This covers rounding to 2 decimal places for most JEE numericals.
 */
const NUMERICAL_ABS_TOLERANCE = 0.01
const NUMERICAL_REL_TOLERANCE = 0.001 // 0.1%

function isNumericallyCorrect(userVal: number, correctVal: number): boolean {
  if (isNaN(userVal) || isNaN(correctVal)) return false
  const tolerance = Math.max(NUMERICAL_ABS_TOLERANCE, Math.abs(correctVal) * NUMERICAL_REL_TOLERANCE)
  return Math.abs(userVal - correctVal) <= tolerance
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const {
      questionId,
      sessionId,
      selectedOption,
      timeTakenMs,
      changedAnswerCount,
      openedHint,
      openedSolution,
      confidenceRating
    } = body

    if (questionId === undefined || selectedOption === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service-role client so the DB trigger (fn_apply_attempt) can write
    // to concept_mastery / weakness_signals without RLS blocking it.
    const supabase = createServiceClient()

    // 1. Fetch question from Supabase
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', parseInt(String(questionId)))
      .single()

    if (questionError || !question) {
      console.error("[API Attempts] Failed to fetch question:", questionError)
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // 2. Calculate correctness (server-authoritative)
    let isCorrect = false
    const qType = question.question_type || 'mcq'

    if (qType === 'numerical') {
      const userVal = parseFloat(String(selectedOption).trim())
      const correctVal = parseFloat(String(question.numerical_answer).trim())
      isCorrect = isNumericallyCorrect(userVal, correctVal)
    } else {
      // MCQ correctness comparison (case-insensitive)
      isCorrect = String(selectedOption).trim().toUpperCase() === String(question.correct_option).trim().toUpperCase()
    }

    // 3. Convert Clerk ID to UUID
    const userUuid = clerkIdToUuid(userId)

    // 4. Ensure user exists in public.users table (to satisfy FK constraint)
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({ id: userUuid }, { onConflict: 'id' })

    if (userInsertError) {
      console.warn("[API Attempts] Failed to ensure user in public.users:", userInsertError)
    }

    // 5. Calculate attempt_order
    const { count, error: countError } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userUuid)
      .eq('question_id', parseInt(String(questionId)))

    if (countError) {
      console.error("[API Attempts] Failed to count previous attempts:", countError)
    }
    const attemptOrder = (count || 0) + 1

    // 6. Validate time_taken_ms — never null/0 (engine depends on this for time-trap detection)
    const validTimeTakenMs = Math.max(1, parseInt(String(timeTakenMs || 1000)))

    // 7. Build and insert the attempt row
    //    The DB trigger `attempts_after_insert` automatically calls fn_apply_attempt
    //    which updates concept_mastery and fires/clears weakness signals.
    //    DO NOT call any mastery/weakness functions from the app — that would double-count.
    const attemptRow: Record<string, unknown> = {
      user_id: userUuid,
      question_id: parseInt(String(questionId)),
      session_id: sessionId ? String(sessionId) : null,
      selected_option: qType === 'numerical' ? null : String(selectedOption).toUpperCase(),
      numerical_response: qType === 'numerical' ? String(selectedOption).trim() : null,
      is_correct: isCorrect,
      time_taken_ms: validTimeTakenMs,
      changed_answer_count: parseInt(String(changedAnswerCount || 0)),
      opened_hint: !!openedHint,
      opened_solution: !!openedSolution,
      confidence_rating: confidenceRating ? parseInt(String(confidenceRating)) : null,
      attempt_order: attemptOrder,
      created_at: new Date().toISOString(),
    }

    console.log("[API Attempts] Inserting attempt:", {
      user_id: attemptRow.user_id,
      question_id: attemptRow.question_id,
      is_correct: attemptRow.is_correct,
      time_taken_ms: attemptRow.time_taken_ms,
    })

    const { data: insertedData, error: insertError } = await supabase
      .from('attempts')
      .insert(attemptRow)
      .select()

    if (insertError) {
      console.error("[API Attempts] Supabase insert error:", insertError)
      return NextResponse.json({ error: insertError.message, details: insertError }, { status: 500 })
    }

    // NOTE: fn_apply_attempt fires via the AFTER INSERT trigger.
    // It updates concept_mastery (EWMA), fires/clears weak_concept and time_trap signals.
    // DO NOT call updateConceptMastery or any mastery function here.

    return NextResponse.json({
      isCorrect,
      correctOption: qType === 'numerical' ? String(question.numerical_answer) : String(question.correct_option),
      attemptId: insertedData?.[0]?.id,
    })

  } catch (err: any) {
    console.error("[API Attempts] Handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
