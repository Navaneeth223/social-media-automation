import { useRef } from "react";
import gsap from "gsap";
import { BarChart3, PenLine, Send, Sparkles } from "lucide-react";
import SectionLabel from "./SectionLabel";
import { useGsapAnim, EASE_INOUT } from "../lib/motion";

/* Draft → AI Caption → Post ×7 → Analytics. Zig-zags behind the nodes. */
const PATH =
  "M 40 120 C 200 120 420 240 580 240 C 660 240 640 120 700 120 L 900 120 C 990 120 910 240 1000 240";

const NODES = [
  { x: 40, y: 60, label: "DRAFT" },
  { x: 380, y: 180, label: "AI CAPTION" },
  { x: 700, y: 60, label: "POST ×7" },
  { x: 1000, y: 180, label: "ANALYTICS" },
];

const STEPS = [
  { Icon: PenLine, title: "Draft once", desc: "Write it, drop a link, or upload the cut. One draft is the whole job." },
  { Icon: Sparkles, title: "AI captions", desc: "Pulse rewrites it natively for each platform's tone, length, and tags." },
  { Icon: Send, title: "Post ×7", desc: "Published to the minute your audience is actually online." },
  { Icon: BarChart3, title: "Analytics", desc: "See what worked, then recycle winners in one click." },
];

export default function Workflow() {
  const ref = useRef(null);
  const basePathRef = useRef(null);
  const drawPathRef = useRef(null);
  const dotRef = useRef(null);

  useGsapAnim(ref, ({ desktop, reduce, scope }) => {
    if (reduce || !desktop) return; // mobile: SVG hidden, steps stack statically
    const ctx = gsap.context(() => {
      // drawSVG-style, by hand: measure once, scrub the dashoffset,
      // and ride a pulse dot along the same path with getPointAtLength().
      const path = drawPathRef.current;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(dotRef.current, { opacity: 1 });

      const o = { p: 0 };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "+=130%",
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      });
      tl.to(o, {
        p: 1,
        duration: 1,
        onUpdate: () => {
          const L = o.p * len;
          gsap.set(path, { strokeDashoffset: len - L });
          const pt = basePathRef.current.getPointAtLength(L);
          gsap.set(dotRef.current, { attr: { cx: pt.x, cy: pt.y } });
        },
      })
        .from(".wf-node", { opacity: 0, y: 14, duration: 0.16, stagger: 0.2, ease: EASE_INOUT }, 0.05)
        .from(
          "[data-wf-caption]",
          { opacity: 0, y: 24, duration: 0.14, stagger: 0.06, ease: EASE_INOUT },
          0.55
        );
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section
      id="workflow"
      ref={ref}
      className="relative px-5 py-28 md:px-10 md:py-0 md:pt-24 md:pb-10 lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center"
    >
      <div>
        <SectionLabel index="04" label="Workflow" />
        <h2 className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
          From draft to done.
          <br />
          <span className="text-acid">On autopilot.</span>
        </h2>
      </div>

      {/* Desktop: the pipeline draws itself as you scroll. */}
      <div className="mt-10 hidden md:mt-14 md:block">
        <svg viewBox="0 0 1200 360" className="w-full" fill="none" aria-hidden="true">
          <path ref={basePathRef} d={PATH} stroke="#262a1c" strokeWidth="2" />
          <path ref={drawPathRef} d={PATH} stroke="#d7ff3c" strokeWidth="2.5" strokeLinecap="round" />
          <circle ref={dotRef} r="6" fill="#d7ff3c" opacity="0" />
          {NODES.map((n, i) => (
            <g key={n.label} className="wf-node">
              <rect x={n.x} y={n.y} width="200" height="120" rx="16" fill="#12140e" stroke="#262a1c" />
              <text x={n.x + 16} y={n.y + 30} fill="#8f9484" fontSize="11" letterSpacing="2">
                0{i + 1}
              </text>
              <text
                x={n.x + 100}
                y={n.y + 78}
                textAnchor="middle"
                fill="#f2f3ec"
                fontSize="21"
                fontWeight="600"
                className="font-display"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, desc }) => (
          <div key={title} data-wf-caption className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-coal text-acid">
              <Icon size={17} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
