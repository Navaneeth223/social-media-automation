import { PLATFORMS } from "../lib/config";

export default function Marquee() {
  return (
    <div
      className="relative mt-20 border-y border-line py-5 md:mt-28"
      role="img"
      aria-label="Works with Instagram, TikTok, X, LinkedIn, YouTube, Facebook, and Threads"
    >
      <div className="marquee-track flex items-center">
        {[0, 1].map((g) => (
          <div key={g} aria-hidden={g === 1} className="flex items-center gap-14 pr-14">
            {PLATFORMS.map(({ name, Icon }) => (
              <span key={name} className="flex items-center gap-3 text-mute">
                <Icon size={20} strokeWidth={1.5} />
                <span className="font-display text-lg font-medium tracking-wide">{name}</span>
                <span className="ml-11 h-1 w-1 rounded-full bg-line" aria-hidden="true" />
              </span>
            ))}
          </div>
        ))}
      </div>
      {/* edge fades — functional masks, not decoration */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
