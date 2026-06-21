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

    if (!subject) {
      return new NextResponse("Missing subject parameter", { status: 400 })
    }

    const supabase = await createClient()

    // Fetch unique chapter_ids from questions table with their question options and types
    const { data: questions, error } = await supabase
      .from('questions')
      .select('chapter_id, question_type, question_options(id)')

    if (error) {
      console.error("Error fetching chapters:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch concepts from DB
    const { data: dbConcepts } = await supabase
      .from('concepts')
      .select('chapter_id, concept_name')

    // Process chapters and topics in memory based on the requested subject
    const chapterMap: { [chapName: string]: { id: number, topics: Set<string> } } = {}

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
          chapterMap[chapter] = { id: mapping.id, topics: new Set() }
        }

        // Get database concepts for this chapter
        const chapterConcepts = dbConcepts?.filter((c: any) => c.chapter_id === mapping.id) || []

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
      topics: Array.from(chapterMap[chapName].topics).sort()
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
