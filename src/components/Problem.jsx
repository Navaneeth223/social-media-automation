import { useRef } from "react";
import gsap from "gsap";
import {
  AtSign,
  ClipboardList,
  Clock,
  Copy,
  Hash,
  Image as ImageIcon,
  MessageSquareWarning,
  Repeat2,
  Scissors,
  Send,
} from "lucide-react";
import SectionLabel from "./SectionLabel";
import { useGsapAnim, EASE_INOUT } from "../lib/motion";

const LINES = [
  <>7 platforms.</>,
  <>
    <span className="text-acid">47</span> open tabs.
  </>,
  <>One tired human.</>,
];

/* The mess the copy describes: a pile of manual-posting chores that flies in
   alongside the lines, ticks a tab counter toward 47, then sags — exhausted —
   when "One tired human." lands. Static fallback: the pile just sits there. */
const TABS = [
  { l: "6%",  t: "10%", r: -7, Icon: Copy,                 label: "Copy caption" },
  { l: "40%", t: "6%",  r: 6,  Icon: Scissors,             label: "Re-size 9:16" },
  { l: "66%", t: "20%", r: -3, Icon: AtSign,               label: "X · 280 chars" },
  { l: "0%",  t: "32%", r: 5,  Icon: Repeat2,              label: "Paste again" },
  { l: "34%", t: "30%", r: 9,  Icon: Hash,                 label: "Re-add hashtags" },
  { l: "64%", t: "46%", r: -8, Icon: ImageIcon,            label: "Alt text… ugh" },
  { l: "8%",  t: "56%", r: -4, Icon: Clock,                label: "Best time? Guess." },
  { l: "36%", t: "56%", r: 7,  Icon: Send,                 label: "Post manually ×7" },
  { l: "62%", t: "70%", r: 3,  Icon: MessageSquareWarning, label: "Posted twice?!" },
  { l: "20%", t: "80%", r: -9, Icon: ClipboardList,        label: "Analytics: 5 tabs" },
];

export default function Problem() {
  const ref = useRef(null);
  const noteRef = useRef(null);
  const countRef = useRef(null);

  useGsapAnim(ref, ({ desktop, reduce, scope }) => {
    if (reduce || !desktop) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".js-problem-line", scope);
      const chips = gsap.utils.toArray("[data-tab]", scope);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "+=170%",
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      });

      tl.fromTo(
        lines,
        { yPercent: 115 },
        { yPercent: 0, duration: 0.6, stagger: 0.5, ease: EASE_INOUT }
      );

      // Chore pile flies in with the first two lines.
      tl.from(
        chips,
        {
          x: (i) => 340 + (i % 4) * 130,
          y: (i) => ((i % 3) - 1) * 70,
          rotation: (i) => TABS[i].r + 18,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: EASE_INOUT,
        },
        0.08
      );

      // Tab counter ticks toward 47 while the pile grows.
      const tally = { n: 0 };
      tl.fromTo(
        tally,
        { n: 0 },
        {
          n: 47,
          duration: 0.9,
          ease: "none",
          onUpdate: () => {
            countRef.current.textContent = Math.round(tally.n);
          },
        },
        0.45
      );

      // The whole pile sags as the third line lands.
      tl.to(
        chips,
        { y: "+=26", rotation: (i) => TABS[i].r + 6, duration: 0.35, ease: EASE_INOUT },
        1.28
      );

      tl.from(noteRef.current, { y: 30, opacity: 0, duration: 0.35, ease: EASE_INOUT }, ">-0.15");
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 py-24 md:px-10"
    >
      <div className="relative z-10">
        <SectionLabel index="01" label="The problem" />
        <div className="mt-10 md:mt-14">
          {LINES.map((line, i) => (
            <div key={i} className="overflow-hidden py-1">
              <h2 className="js-problem-line font-display text-[clamp(2.8rem,9vw,8rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
                {line}
              </h2>
            </div>
          ))}
        </div>
        <p ref={noteRef} className="mt-10 max-w-md text-base leading-relaxed text-mute md:text-lg">
          The average social manager burns <span className="text-paper">6+ hours a week</span>{" "}
          copy-pasting the same post. Pulse hands them back.
        </p>
      </div>

      <div
        className="pointer-events-none absolute right-[1%] top-1/2 hidden h-[27rem] w-[21rem] -translate-y-1/2 lg:block xl:w-[26rem]"
        aria-hidden="true"
      >
        <div className="absolute right-0 top-0 flex items-center gap-2 rounded-full border border-acid/40 bg-acid/10 px-3 py-1.5 text-[11px] font-medium text-acid">
          <span className="h-1.5 w-1.5 rounded-full bg-acid" />
          tabs open right now
          <span ref={countRef} className="font-display text-sm font-semibold">
            47
          </span>
        </div>
        {TABS.map(({ l, t, r, Icon, label }, i) => (
          <span
            key={label}
            data-tab
            style={{ left: l, top: t, transform: `rotate(${r}deg)` }}
            className={`absolute flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-[0_14px_40px_-16px_rgba(0,0,0,0.7)] ${
              i === 8 ? "border-acid/50 bg-acid/10 text-acid" : "border-line bg-coal text-paper/85"
            }`}
          >
            <Icon size={13} className="shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
