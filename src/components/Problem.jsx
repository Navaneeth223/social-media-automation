import { useRef } from "react";
import gsap from "gsap";
import SectionLabel from "./SectionLabel";
import { useGsapAnim, EASE_INOUT } from "../lib/motion";

const LINES = [
  <>7 platforms.</>,
  <>
    <span className="text-acid">47</span> open tabs.
  </>,
  <>One tired human.</>,
];

export default function Problem() {
  const ref = useRef(null);
  const noteRef = useRef(null);

  useGsapAnim(ref, ({ desktop, reduce, scope }) => {
    if (reduce || !desktop) return; // static stacked lines on mobile / reduced motion
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".js-problem-line", scope);
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
      ).from(noteRef.current, { y: 30, opacity: 0, duration: 0.35, ease: EASE_INOUT }, ">-0.15");
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10"
    >
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
    </section>
  );
}
