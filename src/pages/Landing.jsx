import { useEffect, useLayoutEffect, useRef } from "react";
import { useSEO } from "../lib/seo";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Problem from "../components/Problem";
import PlatformShowcase from "../components/PlatformShowcase";
import DashboardPreview from "../components/DashboardPreview";
import Workflow from "../components/Workflow";
import SocialProof from "../components/SocialProof";
import Pricing from "../components/Pricing";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";

/* The marketing site — scroll-smoothed, pinned, fully animated. Lives at "/". */
export default function Landing() {
  useSEO({
    title: "Pulse — AI-Powered Social Media Automation",
    description:
      "Draft once, post everywhere. Pulse schedules and publishes to 7 social platforms with AI captions and best-time-to-post prediction.",
    path: "/",
  });

  // Deep links like /#pricing land on the SPA after mount — scroll to the target.
  useEffect(() => {
    if (window.location.hash.length > 1) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, []);

  const barRef = useRef(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    let alive = true;

    // Scroll smoothing — desktop + motion allowed only. Everything still
    // works underneath it on native scroll (mobile, reduced motion).
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.1,
        effects: true, // honors data-speed parallax on the hero glyphs
      });
      return () => smoother.kill();
    });

    // 2px reading-progress bar. Transform-only scrub.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        }
      );
    });

    // Pinning bakes layout measurements — refresh once webfonts land.
    document.fonts.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });

    return () => {
      alive = false;
      mm.revert();
    };
  }, []);

  return (
    <>
      <div
        ref={barRef}
        className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left bg-acid"
        aria-hidden="true"
      />
      <div
        className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-overlay"
        aria-hidden="true"
      />
      <Nav />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main>
            <Hero />
            <Problem />
            <PlatformShowcase />
            <DashboardPreview />
            <Workflow />
            <SocialProof />
            <Pricing />
            <FinalCTA />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
