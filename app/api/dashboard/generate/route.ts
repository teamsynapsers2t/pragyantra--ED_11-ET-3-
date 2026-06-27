import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkIdToUuid } from '@/utils/helpers'

// Important to handle longer AI generational response times
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = await createClient()

    // 2. Extract context payload (Onboarding + Quiz Output)
    const { domain, class: userClass, prepLevel, journey, subjectAnalysis, topicAnalysis } = await req.json()

    // 3. Command Gemini into Object Mode
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system: `You are an elite, hyper-analytical study orchestrator for ${domain} entrance exams.
        Your goal is to tear down the user's current situation, cross-reference their test analysis, 
        and construct exactly 10 vital arrays for their live frontend dashboard: 
        1. A week-by-week actionable master Roadmap.
        2. A rigorous Revision schedule.
        3. A micro-weakness analysis chart.
        4. Subject Performance trajectories.
        5. Monthly Study Progress data.
        6. Weakness topic scores for charts.
        7. Heatmap matrix coordinates.
        8. Action Plan for immediate tasks.
        9. A daily schedule (Today Plan).
        10. KPI banner statistics.
        
        Do NOT output generic advice. Output highly specific, devastatingly actionable data arrays matching the strict Zod schema.`,
      prompt: `
        Current State: I am in ${userClass}. My prep level is ${prepLevel}.
        My mental journey/struggles: ${journey}
        
        My Quiz Metrics: 
        - Subject Overview: ${JSON.stringify(subjectAnalysis)}
        - Deep Topic Precision: ${JSON.stringify(topicAnalysis)}
        
        Generate the complete dashboard JSON package exactly matching the requested format.
      `,
      schema: z.object({
        roadmapSteps: z.array(z.object({
            phase: z.string().describe("e.g., 'Phase 1'"),
            title: z.string().describe("e.g., 'Foundation Building'"),
            done: z.boolean(),
            desc: z.string().describe("Brief 1 sentence description of this phase"),
            date: z.string().describe("e.g., '1 May - 15 May'"),
            tasks: z.array(z.string()).describe("3 highly specific task names"),
            badge: z.string().describe("MUST be exactly: 'Completed', 'In Progress', or 'Upcoming'"),
            progress: z.number().describe("0 to 100"),
            color: z.string().describe("Hex color like #f97316 for visual UI"),
            lightColor: z.string().describe("Hex color, lighter variant"),
            borderColor: z.string().describe("Hex color, border variant")
        })).min(2),
        revisionTopics: z.array(z.object({
            topic: z.string(),
            subject: z.string(),
            day: z.string().describe("e.g., 'Today', 'Tomorrow', '25 Jul'"),
            status: z.string().describe("MUST be exactly: 'completed' or 'pending'"),
            priority: z.string().describe("MUST be exactly: 'Low', 'Medium', 'High', or 'Critical'"),
            progress: z.number().describe("0 to 100")
        })).min(2),
        microWeakness: z.array(z.object({
            topic: z.string(),
            mastery: z.number().describe("Number out of 100"),
            accuracy: z.number().describe("Number out of 100"),
            attempted: z.number().describe("Random number between 20-150")
        })).min(2),
        subjectPerformance: z.array(z.object({
            subject: z.string(),
            mastery: z.number(),
            accuracy: z.number()
        })).min(2),
        studyProgress: z.array(z.object({
            month: z.string(),
            mastery: z.number(),
            accuracy: z.number()
        })).min(2),
        weaknessData: z.array(z.object({
            topic: z.string(),
            score: z.number()
        })).min(2),
        heatmapTopics: z.array(z.object({
            label: z.string(),
            score: z.number(),
            col: z.number(),
            row: z.number()
        })).min(2),
        actionPlan: z.array(z.object({
            task: z.string(),
            count: z.number(),
            duration: z.number().describe("Time in minutes"),
            priority: z.string().describe("MUST be exactly: 'Low', 'Medium', 'High', 'Critical'")
        })).min(2),
        todayPlan: z.array(z.object({
            time: z.string(),
            task: z.string(),
            subject: z.string(),
            duration: z.string(),
            type: z.string().describe("MUST be exactly: 'Study', 'Practice', 'Revision', 'Test'")
        })).min(2),
        kpiStats: z.array(z.object({
            label: z.string(),
            value: z.number(),
            prev: z.string(),
            change: z.string()
        })).min(2)
      })
    });

    // 4. Secretly save generational output into Supabase
    await supabase.from('ai_roadmaps').insert({
        user_id: clerkIdToUuid(userId),
        domain: domain || "Unknown",
        roadmap_data: object
    })

    // 5. Blast JSON back to UI
    return NextResponse.json(object)

  } catch (err: any) {
    console.error("Dashboard AI Generation Error:", err)
    
    // Explicitly return the true error cause to the frontend for debugging
    return NextResponse.json({ 
        detail: "Internal Server Error", 
        error_message: err.message, 
        name: err.name 
    }, { status: 500 })
  }
}
