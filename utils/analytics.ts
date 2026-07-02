// ── ANALYTICS HELPERS ─────────────────────────────────────────────────────────
// Safe client-side wrappers around the PostHog snippet (see app/providers/
// PostHogProvider.tsx). All no-op when PostHog isn't loaded (no key set, or SSR),
// so they're safe to call from anywhere without guards.
// ──────────────────────────────────────────────────────────────────────────────

type PostHog = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
};

function ph(): PostHog | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { posthog?: PostHog }).posthog ?? null;
}

/** Track a custom product event, e.g. track("quiz_completed", { score: 91 }). */
export function track(event: string, props?: Record<string, unknown>): void {
  ph()?.capture(event, props);
}

/** Tie events to a signed-in user (call after Clerk auth resolves). */
export function identify(userId: string, props?: Record<string, unknown>): void {
  ph()?.identify(userId, props);
}

/** Clear identity on sign-out. */
export function resetAnalytics(): void {
  ph()?.reset();
}
