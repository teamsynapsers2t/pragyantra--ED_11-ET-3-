"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// ── ANALYTICS (PostHog) ───────────────────────────────────────────────────────
// Loads PostHog via its official browser snippet — no `posthog-js` package, so
// nothing to install and no build-time integration that could break Next 16.
//
// DORMANT until NEXT_PUBLIC_POSTHOG_KEY is set: with no key this renders nothing
// and ships zero tracking script. To go live, create a free PostHog project and
// set NEXT_PUBLIC_POSTHOG_KEY (+ NEXT_PUBLIC_POSTHOG_HOST) in .env.local.
// ──────────────────────────────────────────────────────────────────────────────

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Manual $pageview capture on client-side route changes (App Router is an SPA,
// so the snippet's auto pageview only fires once on hard load).
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const w = window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } };
    if (!w.posthog) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += "?" + qs;
    w.posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider() {
  if (!KEY) return null; // No key → analytics disabled, nothing rendered.

  return (
    <>
      <Script id="posthog-init" strategy="afterInteractive">
        {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${KEY}',{api_host:'${HOST}',person_profiles:'identified_only',capture_pageview:false});`}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
