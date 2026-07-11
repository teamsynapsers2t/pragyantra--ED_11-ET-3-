"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  // Read synchronously from localStorage so there is zero flash on back-navigation.
  // suppressHydrationWarning on each button suppresses the server/client mismatch
  // (server can't read localStorage — that's fine, it's just a CTA label).
  const [effectiveSignedIn, setEffectiveSignedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("paper_signed_in") === "true";
  });

  // Keep in sync with real Clerk state once it resolves.
  useEffect(() => {
    if (!isLoaded) return;
    const val = !!isSignedIn;
    setEffectiveSignedIn(val);
    try { localStorage.setItem("paper_signed_in", String(val)); } catch {}
  }, [isLoaded, isSignedIn]);

  // Always go to /question_dashboard — middleware redirects to sign-in if not authed.
  // This prevents Clerk's /sign-up from catching already-logged-in users and
  // bouncing them to /dashboard instead of the JEE/NEET selector.
  const buttonUrl   = "/question_dashboard";
  const buttonLabel = effectiveSignedIn ? "Go to Dashboard" : "Find my root cause";
  const navLabel    = effectiveSignedIn ? "Dashboard" : "Find my root cause";

  // Holds the parallax update() so we can re-run it after any React re-render.
  const updateRef = useRef<(() => void) | null>(null);

  // CRITICAL: the parallax sets inline styles (opacity/transform) imperatively on
  // #heroContent, #surface, etc. Those same elements have JSX style={{}} props.
  // Every React re-render (e.g. Clerk resolving and calling setEffectiveSignedIn)
  // re-applies the JSX styles and WIPES the parallax transforms — freezing the
  // animation. This effect has no dependency array, so it runs after EVERY commit
  // and immediately re-syncs the DOM to the current scroll position.
  useEffect(() => { updateRef.current?.(); });

  useEffect(() => {
    function init() {
      var ids = ['bgVideo','heroContent','nav','dive','warmWash','depthGlow','surface','rootReveal','circlePath','symptomLabel','cap0','cap1','cap2','scrollCue','final','top'];
      var E: Record<string, HTMLElement | SVGPathElement | null> = {};
      ids.forEach(function (id) { E[id] = document.getElementById(id); });

      var circleLen = 0;
      var cp = E.circlePath as SVGPathElement | null;
      if (cp) {
        circleLen = cp.getTotalLength();
        cp.style.strokeDasharray = String(circleLen);
        cp.style.strokeDashoffset = String(circleLen);
      }

      var cl = function (v: number, a: number, b: number) { return Math.max(0, Math.min(1, (v - a) / (b - a))); };

      var heroEnter = [].slice.call(document.querySelectorAll('[data-enter]')) as HTMLElement[];
      var revealEls = [].slice.call(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var pending: HTMLElement[];

      if (!reduce) {
        heroEnter.forEach(function (el, i) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(24px)';
          el.style.transition = 'opacity .7s ease ' + (i * 0.1) + 's, transform .7s ease ' + (i * 0.1) + 's';
        });
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            heroEnter.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
          });
        });
        pending = revealEls.slice();
      } else {
        heroEnter.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
        revealEls.forEach(function (el) { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });
        pending = [];
      }

      function update() {
        var vh = window.innerHeight;
        var topEl = E['top'] as HTMLElement | null;
        var y = topEl ? Math.max(0, -topEl.getBoundingClientRect().top) : (window.scrollY || window.pageYOffset || 0);

        var heroEl = E.heroContent as HTMLElement | null;
        if (heroEl) {
          var t = Math.min(y / (vh * 0.7), 1);
          heroEl.style.opacity = String(1 - t);
          heroEl.style.transform = 'translateY(' + (y * 0.18) + 'px)';
        }
        var cueEl = E.scrollCue as HTMLElement | null;
        if (cueEl) cueEl.style.opacity = String(Math.max(0, 1 - y / (vh * 0.3)));
        var vidEl = E.bgVideo as HTMLVideoElement | null;
        if (vidEl) vidEl.style.transform = 'translate(-50%,-50%) scale(' + (1 + Math.min(y / (vh * 4), 0.16)) + ')';

        var diveEl = E.dive as HTMLElement | null;
        if (diveEl) {
          var rect = diveEl.getBoundingClientRect();
          var total = diveEl.offsetHeight - vh;
          var p = total > 0 ? Math.max(0, Math.min(1, (-rect.top) / total)) : 0;

          if (cp) cp.style.strokeDashoffset = String(circleLen * (1 - cl(p, 0.05, 0.22)));
          var symEl = E.symptomLabel as HTMLElement | null;
          if (symEl) symEl.style.opacity = String(cl(p, 0.12, 0.26));

          var dz = cl(p, 0.30, 0.64);
          var surfEl = E.surface as HTMLElement | null;
          if (surfEl) {
            surfEl.style.transform = 'scale(' + (1 + dz * 2.6) + ')';
            surfEl.style.opacity = String(1 - cl(p, 0.36, 0.6));
            surfEl.style.filter = 'blur(' + (dz * 7) + 'px)';
          }
          var wwEl = E.warmWash as HTMLElement | null;
          if (wwEl) wwEl.style.opacity = String(cl(p, 0.42, 0.8));
          var gr = cl(p, 0.5, 0.92);
          var dgEl = E.depthGlow as HTMLElement | null;
          if (dgEl) {
            dgEl.style.opacity = String(gr * 0.95);
            dgEl.style.transform = 'scale(' + (0.5 + gr * 0.85) + ')';
          }
          var rrEl = E.rootReveal as HTMLElement | null;
          if (rrEl) {
            rrEl.style.opacity = String(cl(p, 0.56, 0.84));
            rrEl.style.transform = 'scale(' + (0.86 + gr * 0.14) + ') translateY(' + ((1 - gr) * 34) + 'px)';
          }
          var c0 = E.cap0 as HTMLElement | null;
          var c1 = E.cap1 as HTMLElement | null;
          var c2 = E.cap2 as HTMLElement | null;
          if (c0) c0.style.opacity = String(Math.max(0, Math.min(cl(p, 0.05, 0.13), 1 - cl(p, 0.27, 0.33))));
          if (c1) c1.style.opacity = String(Math.max(0, Math.min(cl(p, 0.34, 0.42), 1 - cl(p, 0.52, 0.58))));
          if (c2) c2.style.opacity = String(cl(p, 0.62, 0.72));
        }

        var navEl = E.nav as HTMLElement | null;
        if (navEl) {
          var navY = 44, onDark = false;
          var diveEl2 = E.dive as HTMLElement | null;
          if (diveEl2) {
            var dRect = diveEl2.getBoundingClientRect();
            var darkBottom = dRect.top + diveEl2.offsetHeight * 0.68;
            if (dRect.top <= navY && darkBottom > navY) onDark = true;
          }
          var finalEl = E.final as HTMLElement | null;
          if (finalEl && finalEl.getBoundingClientRect().top <= navY) onDark = true;
          var scrolled = y > 40;
          navEl.style.color = onDark ? '#f4f1ea' : '#1f2430';
          navEl.style.background = scrolled ? (onDark ? 'rgba(10,13,20,0.5)' : 'rgba(251,250,248,0.82)') : 'transparent';
          (navEl.style as any).backdropFilter = scrolled ? 'blur(14px)' : 'none';
          (navEl.style as any).webkitBackdropFilter = scrolled ? 'blur(14px)' : 'none';
          navEl.style.borderBottomColor = scrolled ? (onDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)') : 'transparent';
        }

        if (pending && pending.length) {
          var trigger = vh * 0.88;
          pending = pending.filter(function (el) {
            if (el.getBoundingClientRect().top < trigger) {
              el.style.transition = 'opacity .7s ease, transform .7s ease';
              el.style.opacity = '1';
              el.style.transform = 'none';
              return false;
            }
            return true;
          });
        }
      }

      // Expose update() so the post-render effect can re-sync after React re-renders.
      updateRef.current = update;

      var ticking = false;
      function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
      }
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
      window.addEventListener('resize', onScroll, { passive: true });

      // Typewriter
      (function () {
        var el = document.getElementById('typeTarget');
        if (!el) return;
        var phrases = ['Kinematics weak → Vector Addition?','Integration weak → Differentiation?','Organic weak → GOC?','Electrochemistry weak → Redox Reactions?'];
        var pi = 0, ci = (el.textContent || '').length, deleting = true;
        var tt: ReturnType<typeof setTimeout>;
        function tick() {
          var full = phrases[pi];
          if (!deleting) {
            ci++; el!.textContent = full.slice(0, ci);
            if (ci >= full.length) { deleting = true; tt = setTimeout(tick, 1600); return; }
          } else {
            ci--; el!.textContent = full.slice(0, Math.max(0, ci));
            if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; tt = setTimeout(tick, 320); return; }
          }
          tt = setTimeout(tick, deleting ? 34 : 62);
        }
        tt = setTimeout(tick, 1600);
      })();

      update();

      // ── Robust scroll-restoration handling for SPA back/forward navigation ──
      // On back-nav the browser restores scroll position asynchronously AFTER
      // mount, without firing a scroll event — so a one-shot update() runs at
      // scroll=0 and every parallax state ends up wrong. Instead of guessing the
      // timing, we drive update() on EVERY animation frame for a sustained window.
      // Whatever frame scroll finally lands on, we recompute on it. Self-healing.
      var rafId = 0;
      var startTs = performance.now();
      var lastY = -1;
      function settleLoop(now: number) {
        var curY = window.scrollY || window.pageYOffset || 0;

        // If we mounted already scrolled (definitely a return visit), reveal any
        // data-reveal elements in view instantly — no replay of the entry fade.
        if (curY > 4 && pending && pending.length) {
          var vhNow = window.innerHeight;
          pending = pending.filter(function (el) {
            if (el.getBoundingClientRect().top < vhNow * 0.98) {
              el.style.transition = 'none';
              el.style.opacity = '1';
              el.style.transform = 'none';
              return false;
            }
            return true;
          });
        }

        if (curY !== lastY) { lastY = curY; update(); }
        if (now - startTs < 1500) rafId = requestAnimationFrame(settleLoop);
      }
      rafId = requestAnimationFrame(settleLoop);

      return function cleanup() {
        updateRef.current = null;
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
        window.removeEventListener('resize', onScroll);
      };
    }

    var cleanup = init();

    // ── bfcache / back-forward restoration guard ──────────────────────────
    // When the browser restores this page from its back-forward cache,
    // React effects do NOT re-run and the imperative parallax styles stay
    // frozen at whatever opacity/transform they last held — leaving the hero
    // blank and the nav profile button unrendered. event.persisted === true
    // means we were served from bfcache, so force a clean reload to rebuild
    // a fresh, correct DOM state. This is production-safe (only fires on
    // actual bfcache restores, never on first load or normal scroll).
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) { window.location.reload(); }
    }
    window.addEventListener('pageshow', onPageShow);

    return function () {
      if (typeof cleanup === 'function') cleanup();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const bubbles = [
    { left:"6%", w:10, op:.45, drift:"24px", dur:"17s", delay:"-2s" },
    { left:"13%", w:16, op:.55, drift:"-18px", dur:"22s", delay:"-9s" },
    { left:"19%", w:7, op:.4, drift:"30px", dur:"14s", delay:"-5s" },
    { left:"26%", w:20, op:.5, drift:"-26px", dur:"20s", delay:"-13s" },
    { left:"33%", w:9, op:.42, drift:"18px", dur:"16s", delay:"-7s" },
    { left:"40%", w:13, op:.5, drift:"-22px", dur:"19s", delay:"-3s" },
    { left:"47%", w:7, op:.38, drift:"28px", dur:"15s", delay:"-11s" },
    { left:"54%", w:18, op:.52, drift:"-16px", dur:"21s", delay:"-16s" },
    { left:"61%", w:10, op:.45, drift:"22px", dur:"18s", delay:"-6s" },
    { left:"67%", w:14, op:.5, drift:"-28px", dur:"23s", delay:"-1s" },
    { left:"73%", w:8, op:.4, drift:"20px", dur:"14s", delay:"-10s" },
    { left:"79%", w:22, op:.5, drift:"-20px", dur:"24s", delay:"-14s" },
    { left:"85%", w:9, op:.44, drift:"26px", dur:"16s", delay:"-4s" },
    { left:"91%", w:12, op:.48, drift:"-24px", dur:"20s", delay:"-8s" },
    { left:"9%", w:14, op:.5, drift:"-30px", dur:"21s", delay:"-18s" },
    { left:"43%", w:8, op:.4, drift:"16px", dur:"15s", delay:"-12s" },
    { left:"57%", w:11, op:.46, drift:"-18px", dur:"18s", delay:"-15s" },
    { left:"70%", w:16, op:.5, drift:"24px", dur:"22s", delay:"-19s" },
    { left:"88%", w:9, op:.42, drift:"-22px", dur:"17s", delay:"-2s" },
    { left:"30%", w:12, op:.48, drift:"28px", dur:"19s", delay:"-17s" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Caveat:wght@500;600&display=swap');
        *{box-sizing:border-box;}
        html,body{margin:0;padding:0;}
        body{background:#0a0d14;color:#f4f1ea;font-family:'Hanken Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        ::selection{background:#f4730f;color:#fff;}
        @keyframes bob{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(9px);opacity:1}}
        @keyframes rise{0%{transform:translate(0,0) scale(.55);opacity:0}12%{opacity:var(--op,.5)}88%{opacity:var(--op,.5)}100%{transform:translate(var(--drift,20px),-96vh) scale(1);opacity:0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .nav-link{opacity:.62;transition:opacity .2s;}
        .nav-link:hover{opacity:1;}
        .btn-nav{transition:transform .2s ease,box-shadow .2s ease;}
        .btn-nav:hover{transform:scale(1.04);box-shadow:0 12px 26px -8px rgba(240,115,15,.75);}
        .btn-hero{transition:transform .2s ease,box-shadow .2s ease;}
        .btn-hero:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 20px 44px -8px rgba(240,115,15,.72);}
        .btn-final{transition:transform .2s ease,box-shadow .2s ease;}
        .btn-final:hover{transform:scale(1.04);box-shadow:0 18px 60px rgba(227,162,58,.5);}
        @media (min-width:880px){ .nav-links{display:flex !important;} }
      `}</style>

      <div style={{position:"relative",width:"100%",background:"#0a0d14"}}>

        {/* FIXED CINEMATIC VIDEO BACKDROP */}
        <div style={{position:"fixed",inset:0,zIndex:-1,overflow:"hidden",background:"#0a0d14"}}>
          <video id="bgVideo" autoPlay loop muted playsInline style={{position:"absolute",top:"50%",left:"50%",width:"100%",height:"100%",minWidth:"100%",minHeight:"100%",transform:"translate(-50%,-50%)",objectFit:"cover",willChange:"transform"}}>
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
          </video>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(120% 90% at 50% 0%,rgba(10,13,20,.78) 0%,rgba(10,13,20,.32) 38%,rgba(10,13,20,.55) 72%,rgba(10,13,20,.92) 100%)"}} />
          <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,13,20,.55) 0%,rgba(10,13,20,0) 22%,rgba(10,13,20,0) 70%,rgba(10,13,20,.9) 100%)"}} />
        </div>

        {/* NAV */}
        <nav id="nav" style={{position:"fixed",top:0,left:0,right:0,zIndex:50,color:"#1f2430",transition:"background .4s ease,color .4s ease,border-color .4s ease",borderBottom:"1px solid transparent"}}>
          <div style={{padding:"0 28px",height:60,display:"flex",alignItems:"center",position:"relative"}}>
            {/* Logo — left corner, matches question_dashboard style */}
            <a href="#top" style={{textDecoration:"none",color:"inherit",display:"flex",alignItems:"center",gap:0,flexShrink:0,zIndex:2}}>
              <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:22,fontWeight:800,letterSpacing:-0.5,lineHeight:1}}>
                PA<span style={{color:"#f07315"}}>P</span>ER
              </span>
            </a>
            {/* Nav links — absolutely centred so they align with hero content */}
            <div className="nav-links" style={{display:"none",alignItems:"center",gap:34,fontFamily:"'Hanken Grotesk',sans-serif",fontSize:14,position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
              <a href="#how"    className="nav-link" style={{textDecoration:"none",color:"inherit"}}>How it works</a>
              <a href="#engine" className="nav-link" style={{textDecoration:"none",color:"inherit"}}>The engine</a>
              <a href="#exams"  className="nav-link" style={{textDecoration:"none",color:"inherit"}}>JEE / NEET</a>
            </div>
            {/* CTA — right side */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginLeft:"auto",flexShrink:0,zIndex:2}}>
              <a suppressHydrationWarning href={buttonUrl} className="btn-nav" style={{textDecoration:"none",color:"#fff",fontSize:13.5,fontWeight:600,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#f9821f,#ef6a0c)",boxShadow:"0 8px 20px -8px rgba(240,115,15,.6)",whiteSpace:"nowrap"}}>
                <span suppressHydrationWarning>{navLabel}</span>
              </a>
              {effectiveSignedIn && <UserButton />}
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section id="top" style={{position:"relative",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"130px 24px 90px",overflow:"hidden",background:"#fbfaf8"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(31,36,48,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(31,36,48,.05) 1px,transparent 1px)",backgroundSize:"46px 46px",WebkitMaskImage:"radial-gradient(120% 100% at 50% 45%,#000 55%,transparent 100%)",maskImage:"radial-gradient(120% 100% at 50% 45%,#000 55%,transparent 100%)",pointerEvents:"none"}} />
          <div style={{position:"absolute",left:"50%",top:"56%",transform:"translate(-50%,-50%)",width:"130vw",height:"95vh",background:"radial-gradient(50% 50% at 50% 50%,rgba(250,158,66,.22) 0%,rgba(250,180,110,.10) 35%,transparent 70%)",pointerEvents:"none"}} />
          <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
            {bubbles.map((b, i) => (
              <span key={i} style={{
                position:"absolute", left:b.left, bottom:-50,
                width:b.w, height:b.w, borderRadius:"50%",
                background:"radial-gradient(circle at 35% 30%,#ffd49e,#f4730f)",
                boxShadow:"0 0 10px rgba(244,115,15,.35)",
                opacity:0,
                animation:`rise ${b.dur} linear ${b.delay} infinite`,
                ["--op" as string]:b.op,
                ["--drift" as string]:b.drift,
              } as React.CSSProperties} />
            ))}
          </div>

          <div id="heroContent" style={{position:"relative",maxWidth:1120,willChange:"transform,opacity"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Hanken Grotesk',sans-serif",fontWeight:600,fontSize:13,letterSpacing:1.5,textTransform:"uppercase",color:"#e0640a",background:"#fff",border:"1.5px solid rgba(240,115,15,.4)",borderRadius:999,padding:"9px 20px",marginBottom:32,boxShadow:"0 6px 18px -8px rgba(240,115,15,.4)"}} data-enter>
              <span style={{color:"#f4730f"}}>✦</span> The microweakness engine <span style={{color:"#f4730f"}}>✦</span>
            </div>
            <h1 style={{margin:0}} data-enter>
              <span style={{display:"block",fontFamily:"'Hanken Grotesk',sans-serif",fontWeight:600,fontSize:"clamp(34px,5.2vw,66px)",lineHeight:1,letterSpacing:-1,color:"#1f2430"}}>Find your</span>
              <span style={{display:"inline-block",position:"relative",marginTop:8,fontFamily:"'Hanken Grotesk',sans-serif",fontWeight:800,fontSize:"clamp(52px,12vw,148px)",lineHeight:.92,letterSpacing:-3,color:"#f4730f",textShadow:"0 8px 34px rgba(240,115,15,.28)"}}>
                ROOT&nbsp;CAUSE.
                <span style={{position:"absolute",left:0,right:0,bottom:-4,height:6,borderRadius:999,background:"linear-gradient(90deg,#f4730f,#fb9a3f)"}} />
              </span>
            </h1>
            <div style={{marginTop:30,fontFamily:"'Hanken Grotesk',sans-serif",fontSize:"clamp(17px,2vw,22px)",fontWeight:500,color:"#3a3f4a"}} data-enter>
              <span style={{color:"#9aa0ab"}}>&ldquo;</span>&nbsp;<span id="typeTarget">Kinematics weak → Vector Addition?</span><span style={{display:"inline-block",width:2,height:"1.05em",background:"#f4730f",margin:"0 1px",verticalAlign:"-0.18em",animation:"blink 1s step-end infinite"}} /><span style={{color:"#9aa0ab"}}>&nbsp;&rdquo;</span>
            </div>
            <p style={{maxWidth:600,margin:"26px auto 0",fontFamily:"'Hanken Grotesk',sans-serif",fontSize:"clamp(15px,1.6vw,18px)",lineHeight:1.62,color:"#5b626e"}} data-enter>
              PAPER pinpoints your exact weak topics — then digs one layer deeper to the root cause underneath. No guesswork, just the one thing to fix first.
            </p>
            <div style={{marginTop:38}} data-enter>
              <a suppressHydrationWarning href={buttonUrl} className="btn-hero" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none",color:"#fff",fontFamily:"'Hanken Grotesk',sans-serif",fontWeight:600,fontSize:16,padding:"16px 34px",borderRadius:14,background:"linear-gradient(180deg,#f9821f,#ef6a0c)",boxShadow:"0 14px 30px -8px rgba(240,115,15,.6),inset 0 1px 0 rgba(255,255,255,.3)"}}>
                <span suppressHydrationWarning>{buttonLabel}</span> <span style={{fontSize:18}}>→</span>
              </a>
            </div>
          </div>
          <div id="scrollCue" style={{position:"absolute",bottom:30,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(31,36,48,.4)"}}>
            <span>Scroll to dive</span>
            <span style={{width:1,height:30,background:"linear-gradient(180deg,rgba(31,36,48,.4),transparent)",animation:"bob 2s ease-in-out infinite"}} />
          </div>
        </section>

        {/* THE DIVE — scrollytelling */}
        <section id="dive" style={{position:"relative",height:"340vh"}}>
          <div id="diveStage" style={{position:"sticky",top:0,height:"100vh",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div id="warmWash" style={{position:"absolute",inset:0,opacity:0,background:"radial-gradient(90% 80% at 50% 60%,#f6efe0 0%,#efe5d2 55%,#e9dcc4 100%)",willChange:"opacity"}} />
            <div id="depthGlow" style={{position:"absolute",width:"120vmin",height:"120vmin",borderRadius:"50%",opacity:0,background:"radial-gradient(circle,rgba(243,192,94,.55) 0%,rgba(227,162,58,.22) 38%,rgba(227,162,58,0) 68%)",willChange:"opacity,transform"}} />

            {/* SURFACE: the exam paper */}
            <div id="surface" style={{position:"absolute",width:"min(440px,86vw)",willChange:"transform,opacity,filter"}}>
              <div style={{position:"relative",background:"#faf6ec",borderRadius:6,padding:"34px 32px 30px",boxShadow:"0 40px 90px -20px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.04)",transform:"rotate(-1.4deg)"}}>
                <div style={{position:"absolute",inset:0,backgroundImage:"url('/paper-grain.png')",backgroundSize:"240px",opacity:.5,mixBlendMode:"multiply",borderRadius:6,pointerEvents:"none"}} />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:"#9a9286",borderBottom:"1px solid #e7ddc9",paddingBottom:10}}>
                  <span>Physics · Mock 04</span><span>Q.14</span>
                </div>
                <p style={{margin:"16px 0 4px",fontSize:14.5,lineHeight:1.5,color:"#2a2620"}}>A stone is thrown vertically upward at 20&nbsp;m/s. Find the time to return to the hand. <span style={{color:"#9a9286"}}>(g = 10&nbsp;m/s²)</span></p>
                <div style={{marginTop:14,fontFamily:"'Caveat',cursive",fontSize:27,lineHeight:1.25,color:"#34302a"}}>
                  t = v/g = 20/10
                  <div style={{display:"inline-flex",alignItems:"center",gap:8}}>
                    <span style={{position:"relative"}}>= 2&nbsp;s
                      <span style={{position:"absolute",left:-4,right:-4,top:"54%",height:2.5,background:"#ec4257",transform:"rotate(-3deg)"}} />
                    </span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#ec4257",border:"1px solid rgba(236,66,87,.5)",borderRadius:4,padding:"2px 7px",letterSpacing:.5}}>WRONG</span>
                  </div>
                </div>
                <div style={{position:"relative",display:"inline-flex",marginTop:20}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#b23241",background:"rgba(236,66,87,.08)",padding:"6px 12px",borderRadius:5}}>Chapter · Kinematics</span>
                  <svg viewBox="0 0 240 70" preserveAspectRatio="none" style={{position:"absolute",left:-16,top:-13,width:"calc(100% + 32px)",height:"calc(100% + 26px)",overflow:"visible",pointerEvents:"none"}}>
                    <path id="circlePath" d="M120 6 C188 4 236 18 232 35 C236 56 168 66 116 64 C44 66 6 52 8 34 C4 16 60 8 124 7" fill="none" stroke="#ec4257" strokeWidth="2.4" strokeLinecap="round" style={{filter:"drop-shadow(0 0 6px rgba(236,66,87,.4))"}} />
                  </svg>
                </div>
                <div id="symptomLabel" style={{opacity:0,marginTop:18,fontFamily:"'IBM Plex Mono',monospace",fontSize:10.5,letterSpacing:1,color:"#b23241"}}>↑ THE SYMPTOM — where you&apos;re weak</div>
              </div>
            </div>

            {/* ROOT REVEAL */}
            <div id="rootReveal" style={{position:"absolute",opacity:0,textAlign:"center",willChange:"transform,opacity",padding:"0 24px"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"#b07d24",marginBottom:14}}>↓ The root cause</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(46px,9vw,120px)",lineHeight:.96,letterSpacing:-1.5,color:"#a86f12",textShadow:"0 0 70px rgba(227,162,58,.55)"}}>Vector&nbsp;Addition</div>
              <p style={{maxWidth:540,margin:"22px auto 0",fontSize:"clamp(15px,1.7vw,19px)",lineHeight:1.55,color:"#5e4a26"}}>The concept hiding underneath. It&apos;s quietly breaking everything built on top of it — and no other app ever looked this deep.</p>
            </div>

            {/* captions */}
            <div style={{position:"absolute",bottom:"7vh",left:0,right:0,display:"flex",justifyContent:"center",pointerEvents:"none",padding:"0 24px"}}>
              <div style={{position:"relative",width:"min(680px,92vw)",height:64}}>
                <p id="cap0" style={{position:"absolute",inset:0,margin:0,opacity:0,textAlign:"center",fontFamily:"'Instrument Serif',serif",fontSize:"clamp(20px,2.7vw,30px)",lineHeight:1.25,color:"#f1ede4"}}>Every other app stops here — <span style={{color:"#ec4257"}}>&ldquo;you&apos;re weak in Kinematics.&rdquo;</span></p>
                <p id="cap1" style={{position:"absolute",inset:0,margin:0,opacity:0,textAlign:"center",fontFamily:"'Instrument Serif',serif",fontSize:"clamp(20px,2.7vw,30px)",lineHeight:1.25,color:"#f1ede4"}}>But that&apos;s the symptom. <em>PAPER dives beneath it.</em></p>
                <p id="cap2" style={{position:"absolute",inset:0,margin:0,opacity:0,textAlign:"center",fontFamily:"'Instrument Serif',serif",fontSize:"clamp(20px,2.7vw,30px)",lineHeight:1.25,color:"#5e4a26"}}>Symptom on the surface. <span style={{color:"#a86f12",fontStyle:"italic"}}>Cause underneath.</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* ENGINE */}
        <section id="engine" style={{position:"relative",background:"#f1e9d9",color:"#1b1815",padding:"130px 24px 120px",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"url('/paper-grain.png')",backgroundSize:"240px",opacity:.06,mixBlendMode:"multiply",pointerEvents:"none"}} />
          <div style={{position:"relative",maxWidth:1180,margin:"0 auto"}}>
            <div data-reveal style={{opacity:0,transform:"translateY(24px)",textAlign:"center",maxWidth:780,margin:"0 auto 64px"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#9c7a3a",marginBottom:20}}>What the engine surfaces</div>
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:"clamp(34px,5.2vw,62px)",lineHeight:1.02,letterSpacing:-1.4,margin:0}}>Three layers beneath every mistake.</h2>
              <p style={{margin:"22px auto 0",maxWidth:560,fontSize:17,lineHeight:1.6,color:"#5f574b"}}>One wrong answer holds more information than a whole chapter of right ones. Here&apos;s what we read in it.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:22}}>
              {/* Root cause */}
              <div data-reveal style={{opacity:0,transform:"translateY(28px)",position:"relative",background:"linear-gradient(180deg,#fbf6ea,#f7efdc)",borderRadius:14,padding:"34px 30px 36px",boxShadow:"0 30px 60px -28px rgba(168,111,18,.45),0 0 0 1px rgba(168,111,18,.12)",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#e3a23a,#f0bb5e)"}} />
                <div style={{position:"absolute",top:-40,right:-40,width:170,height:170,borderRadius:"50%",background:"radial-gradient(circle,rgba(243,192,94,.4),transparent 65%)"}} />
                <div style={{position:"relative",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:2,color:"#a86f12"}}>01</span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,letterSpacing:2,textTransform:"uppercase",color:"#0a0d14",background:"#f0bb5e",padding:"4px 10px",borderRadius:999}}>Hero feature</span>
                </div>
                <h3 style={{position:"relative",fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:34,letterSpacing:-.5,margin:"0 0 12px",color:"#7a510d"}}>Root Cause</h3>
                <p style={{position:"relative",margin:0,fontSize:15.5,lineHeight:1.62,color:"#5b4a2c"}}>The hidden concept underneath the obvious one. We trace your surface mistake down to the single weak foundation it&apos;s standing on — and fix that first.</p>
              </div>
              {/* Weak concept */}
              <div data-reveal style={{opacity:0,transform:"translateY(28px)",position:"relative",background:"#fbf6ea",borderRadius:14,padding:"34px 30px 36px",boxShadow:"0 20px 44px -26px rgba(0,0,0,.4),0 0 0 1px rgba(27,24,21,.07)",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#ec4257,#f0808e)"}} />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:2,color:"#b23241"}}>02</span>
                </div>
                <h3 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:34,letterSpacing:-.5,margin:"0 0 12px",color:"#1b1815"}}>Weak Concept</h3>
                <p style={{margin:"0 0 16px",fontSize:15.5,lineHeight:1.62,color:"#5f574b"}}>What you&apos;re actually struggling with — and the kind of mistake behind it.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {["sign errors","formula slips","conceptual gaps"].map(tag => (
                    <span key={tag} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10.5,color:"#b23241",background:"rgba(236,66,87,.09)",border:"1px solid rgba(236,66,87,.22)",padding:"5px 10px",borderRadius:6}}>{tag}</span>
                  ))}
                </div>
              </div>
              {/* Time trap */}
              <div data-reveal style={{opacity:0,transform:"translateY(28px)",position:"relative",background:"#fbf6ea",borderRadius:14,padding:"34px 30px 36px",boxShadow:"0 20px 44px -26px rgba(0,0,0,.4),0 0 0 1px rgba(27,24,21,.07)",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#b58a3a,#d8b66a)"}} />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:2,color:"#9c7a3a"}}>03</span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#9c7a3a"}}>⏱</span>
                </div>
                <h3 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:34,letterSpacing:-.5,margin:"0 0 12px",color:"#1b1815"}}>Time Trap</h3>
                <p style={{margin:0,fontSize:15.5,lineHeight:1.62,color:"#5f574b"}}>Concepts you get right — but far too slow. Correct on paper, quietly costing you the exam. We flag them before the clock does.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{position:"relative",background:"#f6efe1",color:"#1b1815",padding:"120px 24px",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"url('/paper-grain.png')",backgroundSize:"240px",opacity:.05,mixBlendMode:"multiply",pointerEvents:"none"}} />
          <div style={{position:"relative",maxWidth:1080,margin:"0 auto"}}>
            <div data-reveal style={{opacity:0,transform:"translateY(24px)",maxWidth:680,margin:"0 0 60px"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#9c7a3a",marginBottom:20}}>How the dive works</div>
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:"clamp(34px,5vw,60px)",lineHeight:1.02,letterSpacing:-1.4,margin:0}}>From a single wrong answer to the one fix that matters.</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:0,borderTop:"1px solid rgba(27,24,21,.12)"}}>
              <div data-reveal style={{opacity:0,transform:"translateY(26px)",padding:"36px 28px 36px 0",borderRight:"1px solid rgba(27,24,21,.1)"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#ec4257",marginBottom:20}}>01 / You solve</div>
                <h3 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:26,margin:"0 0 12px",letterSpacing:-.4}}>It watches, not just marks.</h3>
                <p style={{margin:0,fontSize:15,lineHeight:1.6,color:"#5f574b"}}>Every attempt is read in full — what you got wrong, how long you took, exactly where you hesitated.</p>
              </div>
              <div data-reveal style={{opacity:0,transform:"translateY(26px)",padding:"36px 28px",borderRight:"1px solid rgba(27,24,21,.1)"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#b58a3a",marginBottom:20}}>02 / It traces</div>
                <h3 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:26,margin:"0 0 12px",letterSpacing:-.4}}>Down the dependency tree.</h3>
                <p style={{margin:0,fontSize:15,lineHeight:1.6,color:"#5f574b"}}>Each mistake is mapped through the chain of concepts it depends on — following the symptom down to its source.</p>
              </div>
              <div data-reveal style={{opacity:0,transform:"translateY(26px)",padding:"36px 0 36px 28px"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#a86f12",marginBottom:20}}>03 / It reveals</div>
                <h3 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:26,margin:"0 0 12px",letterSpacing:-.4}}>One root. One plan.</h3>
                <p style={{margin:0,fontSize:15,lineHeight:1.6,color:"#5f574b"}}>The exact micro-weakness to fix first — and the chain of chapters it quietly unlocks above it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* JEE / NEET */}
        <section id="exams" style={{position:"relative",background:"#efe6d4",color:"#1b1815",padding:"120px 24px",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"url('/paper-grain.png')",backgroundSize:"240px",opacity:.06,mixBlendMode:"multiply",pointerEvents:"none"}} />
          <div style={{position:"relative",maxWidth:920,margin:"0 auto",textAlign:"center"}}>
            <div data-reveal style={{opacity:0,transform:"translateY(24px)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#9c7a3a",marginBottom:20}}>The dependency map</div>
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:"clamp(34px,5vw,60px)",lineHeight:1.02,letterSpacing:-1.4,margin:"0 auto",maxWidth:740}}>Every chapter rests on the one beneath it.</h2>
              <p style={{margin:"22px auto 0",maxWidth:560,fontSize:17,lineHeight:1.6,color:"#5f574b"}}>Fix the foundation and everything stacked above it steadies. So PAPER never sends you up — it sends you down, to the layer holding the rest up.</p>
            </div>
            <div data-reveal style={{opacity:0,transform:"translateY(26px)",marginTop:58,display:"flex",flexDirection:"column",alignItems:"center"}}>
              {[
                {label:"Rotational Dynamics",tag:"✗ you fail here",tagColor:"#ec4257",w:300,bg:"#fff",border:"rgba(236,66,87,.3)",shadow:"0 14px 32px -18px rgba(236,66,87,.5)"},
                {label:"Torque & Cross Product",tag:"depends on",tagColor:"#9c7a3a",w:392,bg:"#fffdf8",border:"rgba(27,24,21,.12)",shadow:"0 14px 30px -20px rgba(0,0,0,.4)"},
                {label:"Vector Resolution",tag:"depends on",tagColor:"#9c7a3a",w:476,bg:"#fffdf8",border:"rgba(27,24,21,.12)",shadow:"0 14px 30px -20px rgba(0,0,0,.4)"},
              ].map((row,i) => (
                <div key={i} style={{display:"contents"}}>
                  <div style={{width:row.w,maxWidth:"92vw",background:row.bg,border:`1px solid ${row.border}`,borderRadius:12,padding:"15px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,boxShadow:row.shadow}}>
                    <span style={{fontFamily:"'Instrument Serif',serif",fontSize:21,color:"#1b1815"}}>{row.label}</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:1,textTransform:"uppercase",color:row.tagColor,whiteSpace:"nowrap"}}>{row.tag}</span>
                  </div>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,letterSpacing:1.5,textTransform:"uppercase",color:"#b1a48f",padding:"7px 0"}}>↓ rests on</span>
                </div>
              ))}
              <div style={{position:"relative",width:560,maxWidth:"92vw",background:"linear-gradient(180deg,#fff6e6,#fde7c2)",border:"1px solid rgba(227,162,58,.5)",borderRadius:14,padding:"20px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,boxShadow:"0 24px 54px -20px rgba(227,162,58,.75),0 0 0 4px rgba(243,192,94,.18)"}}>
                <div style={{position:"absolute",inset:-34,borderRadius:28,background:"radial-gradient(circle,rgba(243,192,94,.38),transparent 70%)",pointerEvents:"none",zIndex:-1}} />
                <div style={{display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:1,textTransform:"uppercase",color:"#0a0d14",background:"#f0bb5e",padding:"4px 9px",borderRadius:999,whiteSpace:"nowrap"}}>★ Root</span>
                  <span style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#7a510d"}}>Vector Addition</span>
                </div>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:1,textTransform:"uppercase",color:"#a86f12",whiteSpace:"nowrap"}}>fix this first</span>
              </div>
              <p style={{margin:"26px auto 0",maxWidth:440,fontSize:14.5,lineHeight:1.55,color:"#6b6253"}}>Fix <span style={{color:"#a86f12",fontWeight:600}}>Vector Addition</span> and the three chapters resting on it steady themselves — one fix, four wins.</p>
            </div>
            <div data-reveal style={{opacity:0,transform:"translateY(26px)",marginTop:60,paddingTop:34,borderTop:"1px solid rgba(27,24,21,.1)",display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",textAlign:"left"}}>
              {[
                {name:"JEE",sub:"Engineering",subjects:["Physics","Chemistry","Mathematics"]},
                {name:"NEET",sub:"Medical",subjects:["Physics","Chemistry","Biology"]},
              ].map(exam => (
                <div key={exam.name} style={{background:"#fffdf8",border:"1px solid rgba(27,24,21,.1)",borderRadius:14,padding:"22px 26px",minWidth:260,boxShadow:"0 16px 36px -26px rgba(0,0,0,.4)"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:16}}>
                    <span style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:"#1b1815",letterSpacing:-.5}}>{exam.name}</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,letterSpacing:2,textTransform:"uppercase",color:"#9c7a3a"}}>{exam.sub}</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {exam.subjects.map(s => (
                      <span key={s} style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:13.5,color:"#3a3530",background:"#f4ecdc",padding:"7px 13px",borderRadius:8}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:"#e3a23a",flexShrink:0}} />{s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="final" style={{position:"relative",background:"#0a0d14",color:"#f4f1ea",padding:"150px 24px 120px",textAlign:"center",overflow:"hidden"}}>
          <div style={{position:"absolute",left:"50%",top:"38%",transform:"translate(-50%,-50%)",width:"90vmin",height:"90vmin",borderRadius:"50%",background:"radial-gradient(circle,rgba(227,162,58,.18),transparent 62%)",pointerEvents:"none"}} />
          <div data-reveal style={{position:"relative",opacity:0,transform:"translateY(26px)",maxWidth:900,margin:"0 auto"}}>
            <h2 style={{fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:"clamp(40px,7vw,96px)",lineHeight:1,letterSpacing:-2,margin:0}}>
              Stop treating <em style={{fontStyle:"italic",color:"#ec4257"}}>symptoms.</em><br />Find the <em style={{fontStyle:"italic",color:"#f0bb5e",textShadow:"0 0 50px rgba(227,162,58,.55)"}}>root.</em>
            </h2>
            <p style={{maxWidth:540,margin:"30px auto 0",fontSize:18,lineHeight:1.6,color:"rgba(244,241,234,.66)"}}>Most apps tell you where you&apos;re weak. PAPER tells you why — and exactly what to fix first.</p>
            <a suppressHydrationWarning href={buttonUrl} className="btn-final" style={{display:"inline-block",textDecoration:"none",color:"#0a0d14",fontWeight:600,fontSize:16,padding:"18px 40px",borderRadius:999,background:"#f6f3ec",marginTop:40,boxShadow:"0 14px 50px rgba(227,162,58,.3)"}}>
              <span suppressHydrationWarning>{buttonLabel}</span>
            </a>
          </div>
          <div style={{position:"relative",maxWidth:1180,margin:"110px auto 0",paddingTop:30,borderTop:"1px solid rgba(255,255,255,.1)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
            <div style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontFamily:"'Instrument Serif',serif",fontSize:24,letterSpacing:1}}>PAPER</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(244,241,234,.45)"}}>microweakness engine</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
              {[{label:"Privacy",href:"/privacy"},{label:"Terms",href:"/terms"},{label:"Contact",href:"/contact"}].map(l => (
                <a key={l.href} href={l.href} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:1,color:"rgba(244,241,234,.55)",textDecoration:"none"}}>{l.label}</a>
              ))}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"rgba(244,241,234,.4)"}}>© 2026 PAPER · JEE &amp; NEET</span>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
