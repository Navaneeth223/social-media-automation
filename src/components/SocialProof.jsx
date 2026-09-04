import { useRef } from "react";
import gsap from "gsap";
import { Star } from "lucide-react";
import SectionLabel from "./SectionLabel";
import { useGsapAnim, EASE_INOUT } from "../lib/motion";

const QUOTES = [
  { q: "We went from 3 platforms to 7 without hiring. Pulse is the whole social team.", name: "Maya Chen", role: "Head of Growth · Loopwear", init: "MC" },
  { q: "Best-time prediction alone lifted our engagement 38% in six weeks.", name: "Darius Cole", role: "Content Lead · Finly", init: "DC" },
  { q: "I write once on Monday. Pulse handles the rest of my week.", name: "Sofia Reyes", role: "Creator · 212k followers", init: "SR" },
  { q: "23 client accounts, one dashboard, zero missed slots. Absurd.", name: "Tom Okafor", role: "Founder · Northside Media", init: "TO" },
  { q: "The AI captions sound like us. Scary good.", name: "Lena Fischer", role: "Brand Manager · Kumo", init: "LF" },
];

export default function SocialProof() {
  const ref = useRef(null);
  const deckRef = useRef(null);

  useGsapAnim(ref, ({ desktop, reduce, scope }) => {
    if (reduce || !desktop) return; // mobile / reduced motion: tidy grid, no pin
    const ctx = gsap.context(() => {
      const deck = deckRef.current;
      const cards = gsap.utils.toArray("[data-card]", scope);
      const N = cards.length;
      const mid = (N - 1) / 2;

      // Cards live in a normal grid (that's the static fallback). The tween
      // pulls them into a rotated stack, then deals them back out to their slots.
      const pull = () => {
        const d = deck.getBoundingClientRect();
        const dc = d.left + d.width / 2;
        return cards.map((c) => {
          const r = c.getBoundingClientRect();
          return dc - (r.left + r.width / 2);
        });
      };
      cards.forEach((c, i) => gsap.set(c, { zIndex: i + 1 }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "+=170%",
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });
      tl.from(cards, {
        x: (i) => pull()[i],
        y: (i) => (i - mid) * 9,
        rotation: (i) => (i - mid) * 5,
        duration: 1,
        ease: EASE_INOUT,
        stagger: 0.14,
      });
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section ref={ref} className="relative py-24 md:py-0">
      <div className="md:flex md:h-[100svh] md:flex-col md:justify-center">
        <div className="px-5 md:px-10">
          <SectionLabel index="05" label="Proof" />
          <h2 className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
            Teams that stopped <span className="text-acid">tab-switching.</span>
          </h2>
        </div>

        <div
          ref={deckRef}
          className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mt-14 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-10 md:pb-0 lg:grid-cols-5"
        >
          {QUOTES.map((t) => (
            <figure
              key={t.name}
              data-card
              className="w-[80vw] max-w-[24rem] shrink-0 snap-center rounded-2xl border border-line bg-coal p-6 md:w-auto md:max-w-none"
            >
              <div className="flex gap-1 text-acid" aria-label="Rated 5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-4 font-display text-xl font-medium leading-snug">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-acid font-display text-xs font-semibold text-ink">
                  {t.init}
                </span>
                <span>
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="block text-xs text-mute">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
