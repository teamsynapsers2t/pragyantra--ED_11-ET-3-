import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/utils/supabase/service'

// Required. Set ADMIN_CLERK_IDS in your environment (comma-separated Clerk user IDs).
// If unset, ALL admin endpoints return 403.
const ADMIN_USER_IDS = (process.env.ADMIN_CLERK_IDS || '').split(',').filter(Boolean)

function isAdmin(userId: string): boolean {
  if (ADMIN_USER_IDS.length === 0) return false
  return ADMIN_USER_IDS.includes(userId)
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId || !isAdmin(userId)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const supabase = createServiceClient()
    const url = new URL(req.url)
    const chapterId = url.searchParams.get('chapter_id')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = 20

    // Base query: questions with their options
    let questionQuery = supabase
      .from('questions')
      .select('id, question_text, question_type, correct_option, numerical_answer, chapter_id')
      .order('id', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (chapterId) {
      questionQuery = questionQuery.eq('chapter_id', parseInt(chapterId))
    }

    const { data: questions, error: qError } = await questionQuery

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ questions: [], chapters: [] })
    }

    // Fetch options for these questions
    const questionIds = questions.map((q: any) => q.id)
    const { data: options, error: oError } = await supabase
      .from('question_options')
      .select('id, question_id, option_label, option_text, is_correct, error_type')
      .in('question_id', questionIds)
      .order('option_label', { ascending: true })

    if (oError) {
      console.error("[Admin Error Tags] Options fetch error:", oError)
    }

    // Group options by question
    const optionsByQuestion: Record<number, any[]> = {}
    ;(options || []).forEach((opt: any) => {
      if (!optionsByQuestion[opt.question_id]) {
        optionsByQuestion[opt.question_id] = []
      }
      optionsByQuestion[opt.question_id].push(opt)
    })

    // Get chapter list for the filter dropdown
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_name, subject')
      .order('id', { ascending: true })

    const result = questions.map((q: any) => ({
      ...q,
      options: optionsByQuestion[q.id] || [],
    }))

    return NextResponse.json({
      questions: result,
      chapters: chapters || [],
      page,
      pageSize,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId || !isAdmin(userId)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const supabase = createServiceClient()
    const body = await req.json()
    const { updates } = body // Array of { optionId, errorType }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Missing 'updates' array" }, { status: 400 })
    }

    const errors: string[] = []
    for (const update of updates) {
      const { optionId, errorType } = update
      const { error } = await supabase
        .from('question_options')
        .update({ error_type: errorType || null })
        .eq('id', optionId)

      if (error) {
        errors.push(`Option ${optionId}: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; '), partial: true }, { status: 207 })
    }

    return NextResponse.json({ success: true, updatedCount: updates.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
