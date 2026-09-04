# Pulse — Premium SaaS Landing Page

A social-media-automation landing page built to an award-site standard: one signature color, a strict motion system, real product mock-UI, and scroll choreography that degrades gracefully.

**Product placeholder:** "Pulse" — swap it everywhere via one file (see *Customization*).

---

## Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | React 18 + Vite 7                                             |
| Motion     | GSAP 3.15 — ScrollTrigger, ScrollSmoother, SplitText, CustomEase (all free since GreenSock's 2025 licensing change) |
| Styling    | Tailwind CSS v4 (`@tailwindcss/vite`)                          |
| Icons      | lucide-react (pinned to `0.525.0` — v1.x removed brand icons)  |
| State      | None. No Zustand — nothing needed shared state beyond React.   |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # serve dist/ locally
```

Node 20.19+ (built and verified on Node 24).

## Design system

- **Signature color:** one acid lime `#D7FF3C` on near-black `#0A0B09` — no gradients as decoration (the only gradients are functional edge-fade masks on the marquee).
- **Type:** Clash Display (headlines) + General Sans (body), loaded from Fontshare in `index.html`.
- **Motion:** exactly two custom eases + one rule:
  - `pulse-out` `cubic-bezier(0.16, 1, 0.3, 1)` → every entrance,
  - `pulse-inout` `cubic-bezier(0.83, 0, 0.17, 1)` → every scrubbed state change,
  - `ease: "none"` → anything directly driven by scroll position.
  - Stagger rhythm is shared too (`STAGGER.chars = 0.016`, `STAGGER.ui = 0.09` in `src/lib/motion.js`).
- Only `transform` / `opacity` are animated (plus two cheap SVG paint props: `stroke-dashoffset` on the pipeline, and attribute updates on a single 6px dot).

## Architecture

```
src/
├── main.jsx                  # registers GSAP plugins once
├── App.jsx                   # ScrollSmoother, progress bar, section order
├── index.css                 # theme tokens, utilities, pre-JS states, reduced-motion rules
├── lib/
│   ├── motion.js             # EASE_OUT / EASE_INOUT, STAGGER, useGsapAnim(), scrollToId()
│   └── config.js             # ← PRODUCT NAME + PLATFORM LIST LIVE HERE
└── components/
    ├── Nav.jsx               # fixed, mix-blend-difference, mobile overlay
    ├── Hero.jsx              # SplitText char reveal + pinned tilting dashboard
    ├── Marquee.jsx           # seamless CSS marquee of all 7 platforms
    ├── Problem.jsx           # pinned one-line-at-a-time reveal
    ├── PlatformShowcase.jsx  # horizontal pinned tour (IG→TikTok→X→LinkedIn→YouTube)
    ├── DashboardPreview.jsx  # count-up stats, self-drawing chart, posting queue
    ├── Workflow.jsx          # SVG pipeline that draws itself + traveling pulse dot
    ├── SocialProof.jsx       # pinned card deal-out (grid → stack → dealt back out)
    ├── Pricing.jsx           # monthly/yearly switch with tweened prices
    ├── FinalCTA.jsx          # acid-block closer
    ├── Footer.jsx
    └── mocks/                # DashboardMock.jsx (hero) + FeedMocks.jsx (per-platform posts)
```

Every animated component runs through `useGsapAnim()` (`src/lib/motion.js`), which wraps `gsap.matchMedia()`:

- everything is reverted on unmount (StrictMode-safe),
- `(prefers-reduced-motion: reduce)` → the setup returns early; the markup's resting state **is** the static fallback,
- `(min-width: 768px)` → the branch point below which **no pinning happens** (horizontal sections become native scroll-snap carousels, the problem lines stack, the proof deck becomes a grid).

Pre-animation states are applied in CSS **only** under `@media (min-width: 768px) and (prefers-reduced-motion: no-preference)` — so with JS disabled or motion reduced, nothing is ever hidden or broken.

## Customization

1. **Product name / domain** → `src/lib/config.js` (`PRODUCT`). It flows into the nav, footer, hero copy, and the fake browser chrome.
2. **Platform list** → same file (`PLATFORMS`). The first five drive the showcase; all seven feed the marquee and the mocks.
3. **Colors / fonts** → the `@theme` block at the top of `src/index.css`. Change `--color-acid` to re-skin the entire site.
4. **Copy** → lives inline in each section component; nothing is buried in helpers.
5. **Real screenshots** → the hero and showcase mocks are plain JSX (`mocks/DashboardMock.jsx`, `mocks/FeedMocks.jsx`). To use real captures, replace a mock's return value with `<img src="..." loading="lazy" decoding="async" className="rounded-2xl border border-line" />` — `loading="lazy"` keeps below-the-fold images out of the critical path. All other imagery on the page is CSS/SVG, so there is nothing else to lazy-load.

## Performance notes

- ScrollSmoother is created only on desktop with motion allowed; mobile and reduced-motion run on native scroll.
- Pins use `scrub` + `anticipatePin` + `invalidateOnRefresh`, and `ScrollTrigger.refresh()` fires once webfonts land so measurements stay correct.
- Count-ups and reveals use `once: true` triggers so nothing re-runs on every scroll pass.
- The marquee is a pure CSS `transform` loop (paused entirely under reduced motion).

## Self-check

- **Generic-template test:** remove the logo and it still reads as a bespoke build — acid-on-ink palette, Clash Display, asymmetric headers, typographic mock feeds, numbered section labels. Not a Bootstrap grid with emoji icons.
- **Signature moments:** the hero dashboard pinned in 3D perspective that settles flat under your thumb; the workflow pipeline that inks itself in while a pulse dot rides the path; the testimonial deck that stacks and deals itself out.
- **One motion system:** two named CustomEases + `"none"` for scroll-driven positions; stagger values are constants, not vibes.
- **Reduced motion / no-JS:** every GSAP branch early-returns on `reduce`; CSS pre-states only apply where animation will run; the marquee, toggle, and hover transitions all collapse to static states. The page is fully readable with animations disabled.

