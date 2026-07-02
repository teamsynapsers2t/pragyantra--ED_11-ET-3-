// ── ERROR REPORTING ─────────────────────────────────────────────────────────
// Dependency-free Sentry reporter. Sends server-side exceptions to Sentry's
// /store/ ingestion endpoint via plain fetch — no @sentry/nextjs SDK, so it
// can't break the (bleeding-edge Next 16) build or webpack config.
//
// DORMANT until SENTRY_DSN is set in the environment. With no DSN it just
// logs to the console exactly like today, so this is safe to ship now and
// "flip on" later by pasting your DSN into .env.local.
//
// DSN format: https://<publicKey>@<host>/<projectId>
// ────────────────────────────────────────────────────────────────────────────

type ParsedDsn = { publicKey: string; host: string; projectId: string }

function parseDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\//, '')
    if (!u.username || !u.host || !projectId) return null
    return { publicKey: u.username, host: u.host, projectId }
  } catch {
    return null
  }
}

const parsed = parseDsn(process.env.SENTRY_DSN)

/**
 * Report a server-side error. Always safe to call — never throws, awaitable.
 * @param err   the caught error
 * @param context  optional tags/extra (route name, userId, etc.)
 */
export async function reportError(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  // Always keep a console trail for local dev / log drains.
  console.error('[reportError]', err, context ?? {})

  if (!parsed) return // No DSN configured → console-only, no-op network.

  try {
    const e = err as Error
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'node',
      level: 'error',
      environment: process.env.NODE_ENV || 'production',
      logger: 'paper-ai',
      extra: context ?? {},
      exception: {
        values: [
          {
            type: e?.name || 'Error',
            value: e?.message || String(err),
            stacktrace: e?.stack
              ? { frames: [{ filename: 'server', function: e.stack.split('\n')[1]?.trim() }] }
              : undefined,
          },
        ],
      },
    }

    const url = `https://${parsed.host}/api/${parsed.projectId}/store/`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=paper-ai/1.0`,
      },
      body: JSON.stringify(event),
    })
  } catch (reportingFailure) {
    // Reporting must never crash the request it's reporting on.
    console.error('[reportError] failed to deliver to Sentry:', reportingFailure)
  }
}
