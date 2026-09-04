import { useRef } from "react";
import gsap from "gsap";
import { Check, Instagram, Linkedin, Music2, TrendingUp } from "lucide-react";
import SectionLabel from "./SectionLabel";
import { useGsapAnim, EASE_OUT, fmt } from "../lib/motion";

const STATS = [
  { value: 3214, decimals: 0, label: "Posts scheduled this month", delta: "+18% vs last month" },
  { value: 42, decimals: 0, suffix: "%", label: "Average engagement lift", delta: "vs manual posting" },
  { value: 6.4, decimals: 1, suffix: "h", label: "Saved per week, per person", delta: "across the whole team" },
];

const BARS = [46, 64, 52, 88, 74, 108, 96, 132, 118, 152, 140, 172];
const LINE_D =
  "M8 180 C 60 170, 90 150, 130 140 S 210 110, 260 100 S 380 60, 440 44 S 520 30, 552 26";

const QUEUE = [
  { time: "6:40 PM", Icon: Instagram, title: "Autumn drop teaser", status: "Queued" },
  { time: "8:15 PM", Icon: Music2, title: "Behind the seams", status: "Queued" },
  { time: "9:00 AM", Icon: Linkedin, title: "Q3 launch notes", status: "Posted" },
];

export default function DashboardPreview() {
  const ref = useRef(null);
  const numsRef = useRef([]);

  useGsapAnim(ref, ({ reduce, scope }) => {
    if (reduce) return; // static final values already rendered
    const ctx = gsap.context(() => {
      // Count-ups (not pinned — run on every viewport).
      numsRef.current.forEach((el) => {
        if (!el) return;
        const target = parseFloat(el.dataset.count);
        const dec = Number(el.dataset.decimals || 0);
        el.textContent = fmt(0, dec);
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 1.8,
          ease: EASE_OUT,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = fmt(o.v, dec);
          },
        });
      });

      // Chart: bars grow, engagement line draws itself.
      const bars = gsap.utils.toArray("[data-bar]", scope);
      gsap.from(bars, {
        scaleY: 0,
        transformOrigin: "50% 100%",
        duration: 1,
        ease: EASE_OUT,
        stagger: 0.045,
        scrollTrigger: { trigger: scope, start: "top 70%", once: true },
      });
      const line = scope.querySelector("[data-line]");
      const len = line.getTotalLength();
      gsap.fromTo(
        line,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: EASE_OUT,
          scrollTrigger: { trigger: scope, start: "top 70%", once: true },
        }
      );

      // Section entrance.
      gsap.from("[data-reveal]", {
        y: 36,
        opacity: 0,
        duration: 1,
        ease: EASE_OUT,
        stagger: 0.09,
        scrollTrigger: { trigger: scope, start: "top 75%", once: true },
      });
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section id="product" ref={ref} className="relative px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div data-reveal>
          <SectionLabel index="03" label="Product" />
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
            Your week, <span className="text-acid">at a glance.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-mute">
            Real numbers from a real workspace — they count up as you arrive, because that's what
            the dashboard does all day.
          </p>
        </div>

        <div
          data-reveal
          className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
          {/* stats */}
          <div className="flex flex-col justify-between gap-10 bg-coal p-7 md:p-9">
            {STATS.map((s, i) => (
              <div key={s.label}>
                <p className="text-[11px] uppercase tracking-[0.25em] text-mute">{s.label}</p>
                <p className="mt-2 font-display text-5xl font-semibold tracking-tight md:text-6xl">
                  <span
                    ref={(el) => {
                      numsRef.current[i] = el;
                    }}
                    data-count={s.value}
                    data-decimals={s.decimals}
                  >
                    {fmt(s.value, s.decimals)}
                  </span>
                  {s.suffix || ""}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-acid">
                  <TrendingUp size={13} /> {s.delta}
                </p>
              </div>
            ))}
          </div>

          {/* chart + queue */}
          <div className="bg-coal p-7 md:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">Engagement rate</p>
                <p className="text-[11px] text-mute">Last 30 days · all platforms</p>
              </div>
              <span className="chip border-acid/40 text-acid">
                <TrendingUp size={12} /> +12.4%
              </span>
            </div>

            <svg viewBox="0 0 560 220" className="mt-6 w-full" aria-hidden="true">
              {[40, 90, 140, 190].map((y) => (
                <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="#262a1c" strokeWidth="1" />
              ))}
              {BARS.map((h, i) => (
                <rect
                  key={i}
                  data-bar
                  x={i * 46 + 8}
                  width="26"
                  y={220 - h}
                  height={h}
                  rx="4"
                  fill="#1a1d13"
                  stroke="#262a1c"
                />
              ))}
              <path
                data-line
                d={LINE_D}
                fill="none"
                stroke="#d7ff3c"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-mute">Up next</p>
              <div className="mt-1">
                {QUEUE.map((q) => (
                  <div key={q.title} className="flex items-center gap-3 border-t border-line py-3">
                    <span className="w-16 shrink-0 text-xs text-mute">{q.time}</span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-soot">
                      <q.Icon size={14} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{q.title}</span>
                    <span
                      className={`chip ${
                        q.status === "Queued"
                          ? "border-acid/40 text-acid"
                          : "border-line bg-soot text-mute"
                      }`}
                    >
                      {q.status === "Posted" && <Check size={11} />} {q.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
