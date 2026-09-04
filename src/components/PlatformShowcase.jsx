import { useRef } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import SectionLabel from "./SectionLabel";
import { IGPost, TikTokPost, XPost, LinkedInPost, YouTubePost, Panel } from "./mocks/FeedMocks";
import { PLATFORMS } from "../lib/config";
import { useGsapAnim } from "../lib/motion";

const POSTS = [IGPost, TikTokPost, XPost, LinkedInPost, YouTubePost];

export default function PlatformShowcase() {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);

  useGsapAnim(ref, ({ desktop, reduce, scope }) => {
    if (reduce || !desktop) return; // mobile: native snap carousel, no pinning
    const ctx = gsap.context(() => {
      gsap.set(fillRef.current, { scaleX: 0 });
      const track = trackRef.current;
      const wrap = wrapRef.current;
      const distance = () => Math.max(0, track.scrollWidth - wrap.clientWidth);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });
      tl.to(track, { x: () => -distance() }).to(fillRef.current, { scaleX: 1 }, 0);
    }, scope);
    return () => ctx.revert();
  });

  return (
    <section
      id="platforms"
      ref={ref}
      className="relative md:flex md:h-[100svh] md:flex-col md:justify-center md:overflow-hidden"
    >
      <div className="px-5 pt-20 md:px-10 md:pt-0">
        <SectionLabel index="02" label="Platforms" />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
            One queue.
            <br />
            <span className="text-acid">Every feed.</span>
          </h2>
          <p className="hidden items-center gap-2 text-xs uppercase tracking-[0.25em] text-mute md:flex">
            Keep scrolling <ArrowRight size={14} className="text-acid" />
          </p>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="no-scrollbar mt-10 snap-x snap-mandatory overflow-x-auto pb-6 md:mt-8 md:snap-none md:overflow-visible md:pb-0"
      >
        <div ref={trackRef} className="flex w-max items-stretch gap-6 px-5 md:gap-10 md:px-10">
          <article className="flex w-[82vw] shrink-0 snap-center flex-col justify-center sm:w-[24rem]">
            <p className="font-display text-5xl font-semibold leading-[0.95] tracking-[-0.02em]">
              5 feeds.
              <br />
              <span className="text-acid">1 tab.</span>
            </p>
            <p className="mt-5 max-w-[20rem] text-[15px] leading-relaxed text-mute">
              Every platform, treated natively — sizes, captions, and best times included.
            </p>
          </article>
          {PLATFORMS.slice(0, 5).map((p, i) => {
            const Post = POSTS[i];
            return (
              <Panel key={p.name} platform={p} index={i + 1}>
                <Post />
              </Panel>
            );
          })}
        </div>
      </div>

      <div className="mx-5 mt-6 hidden h-px bg-line md:mx-10 md:mt-8 md:block">
        <div ref={fillRef} className="h-full w-full origin-left bg-acid" />
      </div>
    </section>
  );
}
