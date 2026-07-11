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

    const rl = rateLimit('chapters', userId, 150, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')

    if (!subject) {
      return new NextResponse("Missing subject parameter", { status: 400 })
    }

    const supabase = await createClient()

    // Resolve DB chapter_ids for the requested subject before hitting the DB.
    // chapter_id in DB uses an offset: cid >= 87 in the mapping means DB id = cid + 1.
    const toDbChapterId = (cid: number) => cid >= 87 ? cid + 1 : cid
    const subjectChapterIds = Object.entries(CHAPTER_MAPPING)
      .filter(([, v]) => v.subject.toLowerCase() === subject.toLowerCase())
      .map(([k]) => toDbChapterId(parseInt(k)))

    // Fetch only questions belonging to the requested subject
    const { data: questions, error } = await supabase
      .from('questions')
      .select('chapter_id, question_type, question_options(id)')
      .in('chapter_id', subjectChapterIds)

    if (error) {
      console.error("Error fetching chapters:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch concepts from DB
    const { data: dbConcepts } = await supabase
      .from('concepts')
      .select('chapter_id, concept_name')

    // Process chapters and topics in memory based on the requested subject
    const chapterMap: { [chapName: string]: { id: number, topics: Set<string>, count: number } } = {}

    questions?.forEach((q: any) => {
      // Only include valid questions (either numerical or MCQ containing options)
      const isNumerical = q.question_type === 'numerical'
      const hasOptions = q.question_options && q.question_options.length > 0
      if (!isNumerical && !hasOptions) {
        return
      }

      const mapping = getQuestionMapping(q.chapter_id)

      // Filter by requested subject
      if (mapping.subject.toLowerCase() === subject.toLowerCase()) {
        const chapter = mapping.chapter

        if (!chapterMap[chapter]) {
          chapterMap[chapter] = { id: mapping.id, topics: new Set(), count: 0 }
        }
        chapterMap[chapter].count++

        // Get database concepts for this chapter. concepts.chapter_id is on the DB
        // id scale, so match the raw q.chapter_id — NOT mapping.id, which is the
        // logical (un-offset) id and diverges for chapters with DB id >= 88.
        const chapterConcepts = dbConcepts?.filter((c: any) => c.chapter_id === q.chapter_id) || []

        if (chapterConcepts.length > 0) {
          chapterConcepts.forEach((c: any) => {
            if (c.concept_name) {
              chapterMap[chapter].topics.add(c.concept_name)
            }
          })
        } else {
          const topic = mapping.topic
          chapterMap[chapter].topics.add(topic)
        }
      }
    })

    // Format output sorted by chapter_id
    const formattedChapters = Object.keys(chapterMap).map(chapName => ({
      name: chapName,
      topics: Array.from(chapterMap[chapName].topics).sort(),
      questionCount: chapterMap[chapName].count,
    })).sort((a, b) => {
      const idA = chapterMap[a.name].id
      const idB = chapterMap[b.name].id
      return idA - idB
    })

    return NextResponse.json({ chapters: formattedChapters })

  } catch (err: any) {
    console.error("Chapters fetch error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
