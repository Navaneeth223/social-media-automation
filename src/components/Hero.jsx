import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ArrowDown } from "lucide-react";
import DashboardMock from "./mocks/DashboardMock";
import Marquee from "./Marquee";
import { useGsapAnim, EASE_OUT, STAGGER, scrollToId } from "../lib/motion";
import { PRODUCT } from "../lib/config";

export default function Hero() {
  const sectionRef = useRef(null);
  const headRef = useRef(null);
  const mockWrapRef = useRef(null);
  const mockRef = useRef(null);

  useGsapAnim(sectionRef, ({ desktop, reduce, scope }) => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      // Headline: chars rise out of line masks — one ease, one rhythm.
      SplitText.create(headRef.current, {
        type: "chars,lines",
        mask: "lines",
        autoSplit: true, // re-splits on resize / after fonts load
        onSplit: (self) =>
          gsap.from(self.chars, {
            yPercent: 120,
            duration: 1.1,
            ease: EASE_OUT,
            stagger: STAGGER.chars,
            delay: 0.15,
          }),
      });
      gsap.set(headRef.current, { opacity: 1 }); // un-hide (CSS pre-state)

      gsap.from("[data-hero-fade]", {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: EASE_OUT,
        stagger: STAGGER.ui,
        delay: 0.75,
      });

      if (!desktop) return; // mobile: mock sits flat, no pinning

      // Pinned mock: the tilted draft settles flat as you scroll.
      gsap.fromTo(
        mockRef.current,
        { rotationX: 16, scale: 0.86, y: 70, transformPerspective: 1200 },
        {
          rotationX: 0,
          scale: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: mockWrapRef.current,
            start: "top 25%",
            end: "+=115%",
            scrub: 0.6,
            pin: mockWrapRef.current,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section id="top" ref={sectionRef} className="relative">
      <div className="px-5 pt-32 md:px-10 md:pt-44">
        <p
          data-hero-fade
          className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-mute"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-acid" aria-hidden="true" />
          Social automation · 7 platforms · one queue
        </p>

        <h1
          ref={headRef}
          className="js-hero-headline mt-8 font-display text-[clamp(3.4rem,10.5vw,10rem)] font-semibold leading-[0.92] tracking-[-0.02em]"
        >
          Post everywhere.
          <br />
          <span className="text-acid">Once.</span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
          <div data-hero-fade className="max-w-md">
            <p className="text-base leading-relaxed text-mute md:text-lg">
              {PRODUCT.name} drafts, schedules, and publishes to seven platforms — and learns the
              exact minute your audience shows up. AI captions included.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <button
                onClick={() => scrollToId("pricing")}
                className="rounded-full bg-acid px-6 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                Start posting free
              </button>
              <button
                onClick={() => scrollToId("platforms")}
                className="group flex items-center gap-2 text-sm font-medium text-paper/80 transition-colors hover:text-paper"
              >
                See it work
                <ArrowDown
                  size={15}
                  className="text-acid transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </button>
            </div>
          </div>
          <p
            data-hero-fade
            className="max-w-[15rem] border-l border-line pl-4 text-xs leading-relaxed text-mute"
          >
            "Best-time prediction alone paid for the year." — Darius, Finly
          </p>
        </div>
      </div>

      {/* Parallax glyphs (ScrollSmoother data-speed; inert without it) */}
      <span
        aria-hidden="true"
        data-speed="0.85"
        className="pointer-events-none absolute right-[10%] top-[16%] hidden select-none font-display text-7xl leading-none text-acid/50 md:block"
      >
        *
      </span>
      <span
        aria-hidden="true"
        data-speed="1.12"
        className="pointer-events-none absolute left-[4%] top-[46%] hidden select-none font-display text-5xl leading-none text-paper/15 md:block"
      >
        +
      </span>

      <div
        ref={mockWrapRef}
        className="relative z-10 mt-16 flex justify-center px-5 md:mt-24 md:px-10"
      >
        <div ref={mockRef} className="js-hero-mock w-full max-w-5xl">
          <DashboardMock />
        </div>
      </div>

      <Marquee />
    </section>
  );
}
