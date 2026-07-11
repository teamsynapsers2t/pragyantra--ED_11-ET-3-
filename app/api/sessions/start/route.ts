import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, tooManyRequests } from "@/utils/rateLimit"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const rl = rateLimit('sessions-start', userId, 60, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

    const body = await req.json()
    const { source, subject, chapter, topic } = body

    const supabase = createServiceClient()
    const userUuid = clerkIdToUuid(userId)

    // Ensure user exists
    await supabase
      .from('users')
      .upsert({ id: userUuid }, { onConflict: 'id' })

    // Create session row
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userUuid,
        started_at: new Date().toISOString(),
        metadata: { source, subject, chapter, topic },
      })
      .select('id')
      .single()

    if (error) {
      console.error("[API Sessions/Start] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessionId: String(data.id) })
  } catch (err: any) {
    console.error("[API Sessions/Start] Handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
