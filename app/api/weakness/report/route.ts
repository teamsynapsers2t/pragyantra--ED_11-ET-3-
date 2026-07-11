import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, tooManyRequests } from "@/utils/rateLimit"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const rl = rateLimit('weakness-report', userId, 60, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

    const supabase = createServiceClient()
    const userUuid = clerkIdToUuid(userId)

    // Fetch the latest weakness report for this user
    const { data, error } = await supabase
      .from('weakness_reports')
      .select('*')
      .eq('user_id', userUuid)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[API Weakness/Report] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      report: data,
    })
  } catch (err: any) {
    console.error("[API Weakness/Report] Handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
