import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";

const Avatar = ({ className = "" }) => (
  <span
    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-acid font-display text-[10px] font-semibold text-ink ${className}`}
  >
    LW
  </span>
);

export function IGPost() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink">
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar className="h-6 w-6" />
        <span className="text-[11px] font-medium">loopwear.studio</span>
        <BadgeCheck size={12} className="text-acid" />
        <MoreHorizontal size={14} className="ml-auto text-mute" />
      </div>
      <div className="mx-auto grid aspect-square w-full max-w-[240px] place-items-center bg-soot md:max-w-[260px]">
        <p className="text-stroke font-display text-4xl font-semibold tracking-tight">NEW DROP</p>
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3.5 text-paper">
          <Heart size={15} />
          <MessageCircle size={15} />
          <Send size={15} />
          <Bookmark size={15} className="ml-auto" />
        </div>
        <p className="mt-2 text-[11px] font-semibold">4,912 likes</p>
        <p className="text-[11px] leading-snug text-mute">
          <span className="font-medium text-paper">loopwear.studio</span> Autumn drop — live
          Thursday, 09:00. Best time found by Pulse.
        </p>
      </div>
    </div>
  );
}

export function TikTokPost() {
  const rail = [
    { Icon: Heart, n: "12.4k" },
    { Icon: MessageCircle, n: "843" },
    { Icon: Bookmark, n: "2.1k" },
    { Icon: Share2, n: "906" },
  ];
  return (
    <div className="relative mx-auto aspect-[9/16] h-[280px] overflow-hidden rounded-xl border border-line bg-ink md:h-[300px]">
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-acid text-ink">
          <Play size={18} fill="currentColor" />
        </span>
      </div>
      <div className="absolute bottom-14 right-2 flex flex-col items-center gap-3.5 text-paper">
        {rail.map(({ Icon, n }) => (
          <span key={n} className="flex flex-col items-center gap-0.5">
            <Icon size={17} />
            <span className="text-[9px]">{n}</span>
          </span>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-ink/70 p-3 backdrop-blur-sm">
        <p className="text-[11px] font-medium">@loopwear.studio</p>
        <p className="text-[10px] text-paper/70">POV: your whole week posted itself</p>
        <p className="mt-1 flex items-center gap-1 text-[9px] text-paper/60">
          <Music2 size={10} /> original sound — loopwear.studio
        </p>
      </div>
    </div>
  );
}

export function XPost() {
  return (
    <div className="rounded-xl border border-line bg-ink p-4">
      <div className="flex gap-3">
        <Avatar />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-1.5 text-[12px]">
            <span className="font-semibold">Loopwear</span>
            <BadgeCheck size={12} className="text-acid" />
            <span className="text-mute">@loopwear · 2h</span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed">
            We shipped one campaign to 7 platforms in 41 seconds. Same copy, native captions, zero
            tabs. Here's the setup:
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6 border-t border-line pt-3 text-mute">
        <span className="flex items-center gap-1.5 text-[11px]">
          <MessageCircle size={13} /> 214
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <Repeat2 size={13} /> 1.2k
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <Heart size={13} /> 5.4k
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <BarChart3 size={13} /> 89k
        </span>
      </div>
    </div>
  );
}

export function LinkedInPost() {
  return (
    <div className="rounded-xl border border-line bg-ink p-4">
      <div className="flex gap-3">
        <Avatar />
        <div>
          <p className="text-[12px] font-semibold leading-tight">Maya Chen</p>
          <p className="text-[10px] text-mute">Head of Growth · Loopwear · 2h</p>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-paper/90">
        Our social team went from 4 people to 1. Output tripled. The stack: one draft, AI-native
        captions per platform, and best-time slots we don't even think about anymore.
      </p>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 text-[11px] text-mute">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-acid text-ink">
          <ThumbsUp size={9} />
        </span>
        347 · 89 comments
      </div>
    </div>
  );
}

export function YouTubePost() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink">
      <div className="relative aspect-video bg-soot">
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-acid text-ink">
            <Play size={16} fill="currentColor" />
          </span>
        </div>
        <span className="absolute bottom-2 right-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium">
          12:04
        </span>
      </div>
      <div className="flex gap-3 p-3">
        <Avatar />
        <div className="min-w-0">
          <p className="text-[12px] font-medium leading-snug">
            How we 3x'd reach in 30 days (without posting more)
          </p>
          <p className="mt-1 text-[10px] text-mute">Loopwear Studio · 84K views · 2 days ago</p>
        </div>
      </div>
    </div>
  );
}

export function Panel({ platform, index, children }) {
  const { name, Icon, note } = platform;
  return (
    <article className="flex w-[82vw] shrink-0 snap-center flex-col sm:w-[26rem] md:w-[24rem] lg:w-[28rem]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-coal">
          <Icon size={18} strokeWidth={1.5} />
        </span>
        <div>
          <p className="font-display text-xl font-semibold leading-none">{name}</p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-mute">
            0{index} · native feed
          </p>
        </div>
      </div>
      <p className="mt-4 max-w-[26rem] text-[15px] leading-relaxed text-mute">{note}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

