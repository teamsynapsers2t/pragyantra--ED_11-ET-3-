// ── EMAIL ───────────────────────────────────────────────────────────────────
// Dependency-free email sender built on Resend's REST API (https://resend.com).
// No `resend` npm package needed — just fetch — so nothing to install or break.
//
// DORMANT until RESEND_API_KEY is set. With no key, sendEmail() logs what it
// *would* have sent and returns { skipped: true }, so calling code is safe to
// ship now. To go live: create a Resend account, verify your sending domain,
// then set RESEND_API_KEY and EMAIL_FROM in .env.local.
// ────────────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY
// e.g. "PAPER <hello@yourdomain.com>" — must be a Resend-verified domain.
// Default uses Resend's shared test domain, which works with NO domain of your own.
const EMAIL_FROM = process.env.EMAIL_FROM || 'PAPER <onboarding@resend.dev>'
// Where links in emails point. Set to your Vercel URL (or custom domain later).
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export type SendEmailArgs = {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true }
  | { ok: false; error: string }

/** Send a transactional email. Never throws. */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY not set — skipping send to', args.to, '|', args.subject)
    return { ok: false, skipped: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        reply_to: args.replyTo,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('[email] Resend error:', res.status, detail)
      return { ok: false, error: `Resend ${res.status}` }
    }

    const data = await res.json()
    return { ok: true, id: data.id }
  } catch (err: any) {
    console.error('[email] send failed:', err)
    return { ok: false, error: err?.message || 'send failed' }
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

const BRAND = '#E07A38'

function shell(inner: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;background:#FBF5EB;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:18px;padding:36px 32px;border:1px solid #f0e3d2;">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:24px;">
        PA<span style="color:${BRAND};">P</span>ER
      </div>
      ${inner}
      <hr style="border:none;border-top:1px solid #f0e3d2;margin:28px 0 16px;" />
      <p style="font-size:12px;color:#9c8d7c;line-height:1.5;margin:0;">
        You're receiving this because you have a PAPER account.
      </p>
    </div>
  </div>`
}

/** Welcome email for a newly signed-up student. */
export function welcomeEmail(firstName?: string): { subject: string; html: string } {
  const name = firstName ? ` ${firstName}` : ''
  return {
    subject: 'Welcome to PAPER — let’s find your root cause',
    html: shell(`
      <h1 style="font-size:20px;font-weight:800;color:#2E2620;margin:0 0 12px;">Welcome${name} 👋</h1>
      <p style="font-size:15px;color:#4A4036;line-height:1.7;margin:0 0 16px;">
        PAPER doesn't just tell you <em>what</em> you got wrong — it traces every mistake down to the
        one weak foundation underneath it, so you fix the root instead of the symptom.
      </p>
      <p style="font-size:15px;color:#4A4036;line-height:1.7;margin:0 0 24px;">
        Pick a subject, solve a few questions, and watch your weakness map build itself.
      </p>
      <a href="${APP_URL}/subjects"
         style="display:inline-block;background:linear-gradient(120deg,#F2A52A,#E0701E);color:#fff;
                font-weight:800;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:12px;">
        Start practising →
      </a>
    `),
  }
}
