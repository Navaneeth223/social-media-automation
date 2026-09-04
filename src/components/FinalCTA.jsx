import { useRef } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useGsapAnim, EASE_OUT, STAGGER, scrollToId } from "../lib/motion";

export default function FinalCTA() {
  const ref = useRef(null);

  useGsapAnim(ref, ({ reduce, scope }) => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-cta-reveal]", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: EASE_OUT,
        stagger: STAGGER.ui,
        scrollTrigger: { trigger: scope, start: "top 75%", once: true },
      });
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section ref={ref} className="relative overflow-hidden bg-acid text-ink">
      <div className="px-5 py-24 md:px-10 md:py-36">
        <p data-cta-reveal className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/60">
          Pulse · Free for 14 days
        </p>
        <h2
          data-cta-reveal
          className="mt-6 max-w-5xl font-display text-[clamp(2.8rem,8.5vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.02em]"
        >
          Stop feeding seven algorithms by hand.
        </h2>
        <div data-cta-reveal className="mt-10 flex flex-wrap items-center gap-6">
          <button
            onClick={() => scrollToId("pricing")}
            className="group flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-paper"
          >
            Start posting on autopilot
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <p className="text-sm text-ink/60">No credit card · 2-minute setup · Cancel anytime</p>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[4vw] right-2 select-none font-display text-[22vw] font-semibold leading-none text-ink/5"
      >
        Pulse
      </span>
    </section>
  );
}
