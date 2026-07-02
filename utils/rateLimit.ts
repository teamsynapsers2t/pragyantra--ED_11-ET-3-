// ── RATE LIMITING ─────────────────────────────────────────────────────────
// Fixed-window in-memory limiter, keyed by identity + bucket name.
//
// This is a FIRST layer of protection against abuse / runaway AI-token spend.
// It is per-instance: on serverless (Vercel) each warm lambda keeps its own
// window, so the effective global limit is (limit × live instances). That is
// fine for launch-scale traffic and stops the obvious "hammer the endpoint in
// a loop" abuse.
//
// UPGRADE PATH (do this once traffic grows): swap the Map for @upstash/ratelimit
// + Upstash Redis so the window is shared across all instances. The call sites
// don't need to change — only the body of `rateLimit` below.
// ────────────────────────────────────────────────────────────────────────────

type Window = { count: number; resetAt: number }

// bucketName → (identity → window)
const store = new Map<string, Map<string, Window>>()

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSec: number
}

/**
 * Fixed-window rate limit.
 * @param bucket  logical name, e.g. "weakness-refresh" — keeps separate limits per endpoint
 * @param identity  per-user key (Clerk userId) or IP fallback
 * @param limit  max requests allowed within the window
 * @param windowMs  window length in milliseconds
 */
export function rateLimit(
  bucket: string,
  identity: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  let buckets = store.get(bucket)
  if (!buckets) {
    buckets = new Map()
    store.set(bucket, buckets)
  }

  let w = buckets.get(identity)
  if (!w || now >= w.resetAt) {
    w = { count: 0, resetAt: now + windowMs }
    buckets.set(identity, w)
  }

  w.count += 1
  const remaining = Math.max(0, limit - w.count)
  const ok = w.count <= limit

  // Opportunistic cleanup so the Map doesn't grow unbounded on long-lived instances.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k)
    }
  }

  return {
    ok,
    limit,
    remaining,
    resetAt: w.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((w.resetAt - now) / 1000)),
  }
}

import { NextResponse } from 'next/server'

/** Standard 429 response with rate-limit headers. */
export function tooManyRequests(r: RateLimitResult) {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.', retryAfter: r.retryAfterSec },
    {
      status: 429,
      headers: {
        'Retry-After': String(r.retryAfterSec),
        'X-RateLimit-Limit': String(r.limit),
        'X-RateLimit-Remaining': String(r.remaining),
        'X-RateLimit-Reset': String(Math.ceil(r.resetAt / 1000)),
      },
    },
  )
}
