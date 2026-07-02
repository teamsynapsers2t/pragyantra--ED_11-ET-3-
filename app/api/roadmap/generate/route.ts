import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { rateLimit, tooManyRequests } from '@/utils/rateLimit'

// Important to handle longer AI generational response times
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Rate limit: AI generation is expensive (Gemini tokens). 10 / 10 min per user.
    const rl = rateLimit('roadmap-generate', userId, 10, 10 * 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

    const supabase = await createClient()

    // 2. Extract context payload (Onboarding + Quiz Output)
    const { domain, class: userClass, prepLevel, journey, subjectAnalysis, topicAnalysis } = await req.json()

    // 3. Command Gemini into Data Stream
    const systemPrompt = `You are a strict, hyper-intelligent academic coach specifically focused on the ${domain} entrance exam in India.
    Your goal is to tear down the user's current situation and build an aggressive, actionable roadmap.
    Output your response in Markdown.`

    const userPrompt = `
      Current State: I am in ${userClass}. My prep level is ${prepLevel}.
      My specific situation: ${journey}
      Subject Analysis: ${JSON.stringify(subjectAnalysis)}
      Topic Analysis: ${JSON.stringify(topicAnalysis)}
      Give me a devastatingly honest breakdown of my weaknesses and a week-by-week actionable master plan to fix them.
    `

    // Start native stream
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: userPrompt,
      async onFinish(event) {
        // 4. Actively steal the completed AI output and force it into Supabase securely!
        const finalContent = event.text
        
        await supabase.from('ai_roadmaps').insert({
          user_id: clerkIdToUuid(userId),
          domain: domain,
          roadmap_data: {
             prompt_context: { userClass, prepLevel, journey },
             ai_response: finalContent,
             model: 'gemini-2.5-flash'
          }
        })
      }
    });

    return result.toTextStreamResponse();
    
  } catch (err: any) {
    console.error("AI Generation Error:", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
