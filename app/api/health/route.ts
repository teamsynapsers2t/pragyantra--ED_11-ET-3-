import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

// Uptime / readiness probe. Public (no auth) so monitors like UptimeRobot,
// BetterStack, or Vercel checks can hit it. Confirms the app is up AND can
// reach the database. Never exposes any user data.
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const supabase = createServiceClient();
    // Cheapest possible DB round-trip: count-only, head request, no rows.
    const { error } = await supabase
      .from("chapters")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { status: "degraded", db: "error", ms: Date.now() - started },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      db: "ok",
      ms: Date.now() - started,
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "down", ms: Date.now() - started },
      { status: 503 },
    );
  }
}
