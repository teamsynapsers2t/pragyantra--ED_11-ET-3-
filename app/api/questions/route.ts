import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQuestionMapping, CHAPTER_MAPPING } from '@/utils/chapterMapping'
import { rateLimit, tooManyRequests } from "@/utils/rateLimit"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const rl = rateLimit('questions', userId, 150, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

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

    // Fetch chapters + concepts up-front: chapters drive subject/chapter
    // filtering (the DB is authoritative — the static CHAPTER_MAPPING calls the
    // subject "Mathematics" while the DB and UI use "Maths", which made every
    // Maths query return 0), and concepts resolve the `topic` param.
    const { data: dbChapters } = await supabase
      .from('chapters')
      .select('id, subject, chapter_name')
    const { data: dbConcepts } = await supabase
      .from('concepts')
      .select('id, concept_name')
    const conceptMap: { [id: number]: string } = {}
    dbConcepts?.forEach((c: any) => {
      conceptMap[c.id] = c.concept_name
    })

    // Resolve the topic param to concept ids with NORMALIZED matching — callers
    // pass concept names that can differ from the DB by case, dashes, or stray
    // whitespace (e.g. "Work Done " has a trailing space in the concepts table).
    const norm = (x: string) => x.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    const topicConceptIds = (topic && topic !== 'All')
      ? (dbConcepts || []).filter((c: any) => norm(c.concept_name || '') === norm(topic)).map((c: any) => c.id)
      : []

    let query = supabase
      .from('questions')
      // !inner join when filtering by concept so the DB does the matching
      .select(topicConceptIds.length
        ? '*, question_options(*), question_concepts!inner(concept_id)'
        : '*, question_options(*), question_concepts(concept_id)')
      .order('year', { ascending: false })
      .order('id')

    if (topicConceptIds.length) {
      // The concept already pins down chapter and subject — and callers
      // sometimes send a wrong subject (e.g. Physics for a Chemistry concept),
      // so subject/chapter params are ignored when a concept resolves.
      query = query.in('question_concepts.concept_id', topicConceptIds)
    } else {
      // Push explicit filters to the DB before fetching rows.
      // Subject aliases: UI/DB say "Maths", the static map says "Mathematics".
      const canonSubject = (x: string) => {
        const t = (x || '').toLowerCase().trim()
        return ['math', 'maths', 'mathematics'].includes(t) ? 'maths' : t
      }
      if (subject && subject !== 'All') {
        const ids = (dbChapters || [])
          .filter((c: any) => canonSubject(c.subject) === canonSubject(subject))
          .map((c: any) => c.id)
        // Fall back to the static map if the DB has no chapters for the label
        if (ids.length === 0) {
          Object.entries(CHAPTER_MAPPING)
            .filter(([, v]) => canonSubject(v.subject) === canonSubject(subject))
            .forEach(([k]) => ids.push(toDbChapterId(parseInt(k))))
        }
        query = query.in('chapter_id', ids)
      }
      if (chapter && chapter !== 'All') {
        const hit = (dbChapters || []).find((c: any) => norm(c.chapter_name || '') === norm(chapter))
        if (hit) {
          query = query.eq('chapter_id', hit.id)
        } else {
          const entry = Object.entries(CHAPTER_MAPPING).find(([, v]) => norm(v.chapter) === norm(chapter))
          if (entry) query = query.eq('chapter_id', toDbChapterId(parseInt(entry[0])))
        }
      }
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

    // Supabase caps each read at 1000 rows — page through so subjects with
    // more than 1000 questions (Chemistry, Maths) aren't silently truncated.
    const PAGE = 1000
    const questions: any[] = []
    for (let from = 0; ; from += PAGE) {
      const { data: page, error } = await query.range(from, from + PAGE - 1)
      if (error) {
        console.error("[API Questions] Supabase fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      questions.push(...(page || []))
      if (!page || page.length < PAGE) break
    }

    // Authoritative subject/chapter labels from the DB (prevents drift vs the static map)
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

    // When the topic resolved to concept ids, the DB inner-join already filtered.
    // Otherwise fall back to a normalized in-memory match on the topic label.
    if (topic && topic !== 'All' && topicConceptIds.length === 0) {
      mappedQuestions = mappedQuestions.filter(q => norm(q.topic || '') === norm(topic))
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
