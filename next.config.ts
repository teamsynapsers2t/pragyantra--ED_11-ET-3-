import type { NextConfig } from "next";

// Content-Security-Policy. Allowlists the exact third parties PAPER uses so a
// injected <script> from an unknown origin can't run, data can't be exfiltrated
// to arbitrary hosts, and the app can't be framed (clickjacking).
//   Clerk    — auth widgets + API (*.clerk.accounts.dev, clerk.com, js)
//   Supabase — database/storage over HTTPS + WSS (*.supabase.co)
//   PostHog  — analytics (us.i.posthog.com, us-assets.i.posthog.com)
//   MathJax  — formula rendering (cdn.jsdelivr.net)
//   Google   — fonts + Gemini generateContent is server-side (not in CSP)
//   Images   — question diagrams (examgoal + cloudfront CDNs), data URIs
// 'unsafe-inline'/'unsafe-eval' on script-src are required by Next.js runtime,
// Clerk, and the PostHog/MathJax inline bootstraps; the value is in tightly
// restricting WHICH hosts can be contacted (connect/img/frame/form/base).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://cdn.jsdelivr.net https://us.i.posthog.com https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt-and-suspenders clickjacking block for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop MIME sniffing (defeats some XSS-via-upload tricks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which can carry ids) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for two years, including subdomains (HSTS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Deny powerful browser features the app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // There are two package-lock.json files (repo root and paper-ai/), which made
  // the bundler infer the wrong workspace root. Pin it to this project directory.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
