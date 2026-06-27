import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQuestionMapping, CHAPTER_MAPPING } from '@/utils/chapterMapping'

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')
    const chapter = searchParams.get('chapter')
    const topic = searchParams.get('topic')
    const difficulty = searchParams.get('difficulty')
    const exam = searchParams.get('exam')
    const yearStr = searchParams.get('year')
    
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // chapter_id in DB uses an offset: cid >= 87 in the mapping means DB id = cid + 1
    const toDbChapterId = (cid: number) => cid >= 87 ? cid + 1 : cid

    let query = supabase
      .from('questions')
      .select('*, question_options(*), question_concepts(concept_id)')
      .order('year', { ascending: false })
      .order('id')

    // Push explicit filters to the DB before fetching rows
    if (subject && subject !== 'All') {
      const ids = Object.entries(CHAPTER_MAPPING)
        .filter(([, v]) => v.subject.toLowerCase() === subject.toLowerCase())
        .map(([k]) => toDbChapterId(parseInt(k)))
      query = query.in('chapter_id', ids)
    }
    if (chapter && chapter !== 'All') {
      const entry = Object.entries(CHAPTER_MAPPING).find(([, v]) => v.chapter === chapter)
      if (entry) query = query.eq('chapter_id', toDbChapterId(parseInt(entry[0])))
    }
    if (difficulty && difficulty !== 'All') {
      query = query.eq('difficulty', difficulty.toLowerCase())
    }
    if (yearStr && yearStr !== 'All') {
      query = query.eq('year', parseInt(yearStr))
    }
    if (exam && exam !== 'All') {
      query = query.ilike('exam_type', `%${exam}%`)
    }

    const { data: questions, error } = await query

    if (error) {
      console.error("[API Questions] Supabase fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch all concepts to map concept_id to concept_name in memory
    const { data: dbConcepts } = await supabase
      .from('concepts')
      .select('id, concept_name')

    const conceptMap: { [id: number]: string } = {}
    dbConcepts?.forEach((c: any) => {
      conceptMap[c.id] = c.concept_name
    })

    // Authoritative subject/chapter labels from the DB (prevents drift vs the static map)
    const { data: dbChapters } = await supabase
      .from('chapters')
      .select('id, subject, chapter_name')
    const chapterInfo: { [id: number]: { subject: string; chapter: string } } = {}
    dbChapters?.forEach((c: any) => {
      chapterInfo[c.id] = { subject: c.subject || '', chapter: (c.chapter_name || '').trim() }
    })


    // Filter out MCQ questions that don't have options
    const validQuestions = (questions || []).filter((q: any) => {
      const isNumerical = q.question_type === 'numerical'
      const hasOptions = q.question_options && q.question_options.length > 0
      return isNumerical || hasOptions
    })

    // Map questions to match frontend expectation
    let mappedQuestions = validQuestions.map((q: any) => {
      // Sort options by label
      const sortedOptions = (q.question_options || [])
        .sort((a: any, b: any) => (a.option_label || '').localeCompare(b.option_label || ''))
        .map((o: any) => o.option_text)

      const mapping = getQuestionMapping(q.chapter_id)
      // Prefer DB chapter labels; fall back to the static map only if the DB row is missing
      const dbInfo = chapterInfo[q.chapter_id]
      const subjectLabel = dbInfo?.subject || mapping.subject
      const chapterLabel = dbInfo?.chapter || mapping.chapter

      // Resolve topic/concept from DB mapping if present
      let questionTopic = mapping.topic
      if (q.question_concepts && q.question_concepts.length > 0) {
        const conceptId = q.question_concepts[0].concept_id
        if (conceptId && conceptMap[conceptId]) {
          questionTopic = conceptMap[conceptId]
        }
      }

      // SECURITY: never ship `answer` or `explanation` in the list payload —
      // that would let anyone read the answer key from the Network tab and would
      // pollute the engine via cheating. The correct answer + explanation are
      // returned by /api/attempts/submit AFTER the student answers.
      return {
        id: String(q.id),
        subject: subjectLabel,
        chapter: chapterLabel,
        topic: questionTopic,
        question: q.question_text,
        options: sortedOptions,
        difficulty: q.difficulty || "medium",
        exam: q.exam_type || "jee-main",
        year: q.year || 2024,
        question_type: q.question_type || "mcq"
      }
    })

    // subject, chapter, difficulty, year, exam are already filtered at the DB level above.
    // topic must stay in JS because it is resolved from question_concepts, not a flat column.
    if (topic && topic !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => q.topic === topic)
    }

    // Apply pagination in memory
    const paginatedQuestions = mappedQuestions.slice(offset, offset + limit)

    return NextResponse.json({
      questions: paginatedQuestions,
      total: mappedQuestions.length,
      limit,
      offset
    })

  } catch (err: any) {
    console.error("Questions fetch error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
