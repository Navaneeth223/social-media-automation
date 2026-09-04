import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Check } from "lucide-react";
import SectionLabel from "./SectionLabel";
import { EASE_INOUT, REDUCE } from "../lib/motion";

const TIERS = [
  {
    name: "Starter",
    monthly: 19,
    yearly: 15,
    blurb: "For solo creators getting consistent.",
    cta: "Start free",
    features: ["3 platforms", "30 scheduled posts / mo", "Basic analytics", "1 workspace"],
  },
  {
    name: "Growth",
    monthly: 49,
    yearly: 39,
    blurb: "For teams posting everywhere, daily.",
    cta: "Start free trial",
    featured: true,
    features: ["All 7 platforms", "Unlimited scheduling", "AI captions + best-time engine", "Full analytics & exports", "3 workspaces"],
  },
  {
    name: "Agency",
    monthly: 99,
    yearly: 79,
    blurb: "For agencies running many brands.",
    cta: "Talk to us",
    features: ["10 client workspaces", "White-label reports", "Approval workflows", "API access", "Priority support"],
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const priceRefs = useRef([]);

  // Prices tween to their new value on every toggle (instant under reduced motion).
  useEffect(() => {
    if (window.matchMedia(REDUCE).matches) return;
    priceRefs.current.forEach((el, i) => {
      if (!el) return;
      const target = yearly ? TIERS[i].yearly : TIERS[i].monthly;
      const o = { v: parseFloat(el.textContent) || target };
      gsap.to(o, {
        v: target,
        duration: 0.5,
        ease: EASE_INOUT,
        onUpdate: () => {
          el.textContent = Math.round(o.v).toString();
        },
      });
    });
  }, [yearly]);

  return (
    <section id="pricing" className="relative px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <SectionLabel index="06" label="Pricing" />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
            Pay for time saved, <span className="text-acid">not seats.</span>
          </h2>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${!yearly ? "text-paper" : "text-mute"}`}>Monthly</span>
            <button
              role="switch"
              aria-checked={yearly}
              aria-label="Toggle yearly billing"
              onClick={() => setYearly(!yearly)}
              className="relative h-7 w-12 rounded-full border border-line bg-soot"
            >
              <span
                className={`absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-acid transition-transform duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] ${
                  yearly ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span className={`text-sm ${yearly ? "text-paper" : "text-mute"}`}>Yearly</span>
            <span className="chip border-acid/40 text-acid">2 months free</span>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <article
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                t.featured
                  ? "border-acid bg-acid text-ink shadow-[0_40px_90px_-30px_rgba(215,255,60,0.35)] md:-translate-y-3 md:scale-[1.02]"
                  : "border-line bg-coal"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-acid">
                  Most popular
                </span>
              )}
              <p className="font-display text-lg font-semibold">{t.name}</p>
              <p className={`mt-1 text-sm ${t.featured ? "text-ink/70" : "text-mute"}`}>{t.blurb}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-lg">$</span>
                <span
                  ref={(el) => {
                    priceRefs.current[i] = el;
                  }}
                  className="font-display text-5xl font-semibold tracking-tight"
                >
                  {t.monthly}
                </span>
                <span className={`text-sm ${t.featured ? "text-ink/60" : "text-mute"}`}>/mo</span>
              </p>
              <p className={`mt-1 text-[11px] ${t.featured ? "text-ink/60" : "text-mute"}`}>
                {yearly ? "Billed yearly — 2 months free" : "Billed monthly"}
              </p>
              <ul className="mt-7 flex flex-col gap-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={15} className={`mt-0.5 shrink-0 ${t.featured ? "text-ink" : "text-acid"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-9 rounded-full py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 ${
                  t.featured ? "bg-ink text-paper" : "border border-line bg-soot hover:border-acid/60"
                }`}
              >
                {t.cta}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-8 text-xs text-mute">
          Prices in USD. Cancel anytime. 14-day free trial on every plan.
        </p>
      </div>
    </section>
  );
}
