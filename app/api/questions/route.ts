import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQuestionMapping } from '@/utils/chapterMapping'

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

    console.log("[API Questions] Clerk userId:", userId)
    console.log("[API Questions] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

    let query = supabase
      .from('questions')
      .select('*, question_options(*), question_concepts(concept_id)')

    // Fetch all questions to filter and map in memory
    const { data: questions, error } = await query
      .order('year', { ascending: false })
      .order('id')

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

    console.log(`[API Questions] Fetched ${questions?.length || 0} questions from Supabase.`)

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

      // Map correct_option ('a', 'b', 'c', 'd') to index (0, 1, 2, 3)
      let answerIndex = 0
      if (q.correct_option) {
        const label = q.correct_option.toLowerCase().trim()
        if (label === 'a') answerIndex = 0
        else if (label === 'b') answerIndex = 1
        else if (label === 'c') answerIndex = 2
        else if (label === 'd') answerIndex = 3
      }

      const mapping = getQuestionMapping(q.chapter_id)

      // Resolve topic/concept from DB mapping if present
      let questionTopic = mapping.topic
      if (q.question_concepts && q.question_concepts.length > 0) {
        const conceptId = q.question_concepts[0].concept_id
        if (conceptId && conceptMap[conceptId]) {
          questionTopic = conceptMap[conceptId]
        }
      }

      return {
        id: String(q.id),
        subject: mapping.subject,
        chapter: mapping.chapter,
        topic: questionTopic,
        question: q.question_text,
        options: sortedOptions,
        answer: q.question_type === 'numerical' ? q.numerical_answer : answerIndex,
        explanation: q.explanation || "No explanation available.",
        difficulty: q.difficulty || "medium",
        exam: q.exam_type || "jee-main",
        year: q.year || 2024,
        question_type: q.question_type || "mcq"
      }
    })

    // Apply filtering in memory
    console.log(`[API Questions] Total mapped questions: ${mappedQuestions.length}. Filtering inputs - subject: ${subject}, chapter: ${chapter}, topic: ${topic}`)
    if (subject && subject !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => q.subject.toLowerCase() === subject.toLowerCase())
      console.log(`[API Questions] After subject filter (${subject}): ${mappedQuestions.length}`)
    }
    if (chapter && chapter !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => q.chapter === chapter)
    }
    if (topic && topic !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => q.topic === topic)
    }
    if (difficulty && difficulty !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => q.difficulty === difficulty.toLowerCase())
    }
    if (exam && exam !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => q.exam.toLowerCase().includes(exam.toLowerCase()))
    }
    if (yearStr && yearStr !== 'All') {
      mappedQuestions = mappedQuestions.filter(q => String(q.year) === yearStr)
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
