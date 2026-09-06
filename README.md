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

---

## Phase 1 — real accounts + real auth (LIVE)

The site is no longer just marketing. `server/` is a real Express API: MongoDB (Atlas M0 or local), JWT sessions in httpOnly cookies, bcrypt-hashed passwords, rate-limited credential routes, and a real dashboard at `/app` fed by `GET /api/auth/me`.

### Run both halves

```bash
# API — first run: copy server/.env.example → server/.env, set JWT_SECRET (+ MONGODB_URI for Atlas)
cd server
npm install
npm run smoke      # boots a real in-memory Mongo and exercises the whole auth flow
npm run dev        # http://localhost:8787

# Web (second terminal)
npm install        # react-router-dom was added
npm run dev        # http://localhost:5173 — /api proxies to :8787 in dev
```

### What's real now

- `/signup` + `/login` create and verify **real user records** (bcrypt 12 rounds, zod validation, 409 on duplicates, generic 401s that never reveal which field was wrong).
- Every "Start free" CTA on the landing page routes to the real signup; pricing tiers pass their plan through the URL.
- `/app` reads your actual account: plan, trial days left, sign-out — plus a connection matrix that only promises what each platform's free tier can do (X is labeled "No API" honestly; nothing is a dead click).
- `server/smoke.js` is the phase gate: 10 end-to-end checks against the real Express app (register → session → me → logout, hashing, 401/409 paths).

### Honesty rules baked in

- Passwords: bcrypt, never stored or returned in any response.
- Sessions: signed JWT in an httpOnly cookie (`sameSite=lax` dev, `none`+`secure` prod behind a proxy).
- Platform tokens (from Phase 2 on) will be encrypted at rest with a server-side key before they ever touch the database — never plaintext.

### Next

Phase 2 — LinkedIn OAuth (`passport-linkedin-oauth2`), encrypted token storage, post composer, BullMQ + Redis scheduling, real publish to your own profile. Say "Build Phase 2" to proceed.

---

## Problem-section background — the 300-frame UI video

Section 01 scrubs a 300-frame canvas sequence of the product UI behind the copy, Apple-style: frames map 1:1 to the pinned scroll range, with a slow scale settle and a left-weighted scrim keeping the type readable.

- **Source:** the `ul cards/` folder (300 × `ezgif-frame-NNN.jpg`, 1280×720, ~5 MB) — kept out of git via `.gitignore`.
- **Shipped frames:** `public/problem-frames/0001.jpg … 0300.jpg` (renamed copy, served statically).
- **Count + URL pattern:** one constant in `src/lib/frames.js` (`FRAME_COUNT`, `frameSrc`) — swap the video by replacing the folder and updating that constant.
- **Renderer:** `src/components/ProblemSequence.jsx` — paints to `<canvas>` (device-pixel-ratio capped at 1.5), preloads during browser idle time after the hero, and always draws the *nearest loaded* frame so scrubbing never stalls on the network.
- **Fallbacks:** one static mid-video frame on mobile and under `prefers-reduced-motion`; the section is fully readable even with zero frames loaded (ink background).

---

## SEO & sharing

- **Site identity is centralized:** `VITE_SITE_URL` in the committed `.env` (single source of truth — also readable as a Vercel env var). Canonical, `og:url`, `og:image`, `twitter:image`, sitemap, robots and JSON-LD all derive from it. Custom domain later = change that one value + rebuild.
- **Social cards:** `/og-image.png` (1200×630, generated by `scripts/generate-images.ps1`), `summary_large_image` Twitter card, full Open Graph set.
- **Crawler HTML:** `scripts/build-seo.mjs` (runs as part of `npm run build`) writes `dist/robots.txt`, `dist/sitemap.xml`, and prerendered per-route heads — `/login`, `/signup`, `/app` ship `noindex` in meta **and** an `X-Robots-Tag` header (see `vercel.json`); the homepage is the only indexable page and matches the sitemap.
- **Per-route titles** at runtime via the `useSEO` hook (`src/lib/seo.js`), so browser tabs/history stay correct after client navigation.
- Regenerate social/brand images after a rebrand: `powershell -File scripts/generate-images.ps1`.

---

## Local demo mode — everything on this computer (no cloud, no cost)

```bash
npm install    # once (adds concurrently)
npm run up     # local MongoDB → seed demo account → web + API together
```

Then open http://localhost:5173, click any "Start free", or go straight to the login page.

- **Demo login:** `demo@pulse.app` / `demo12345` — the login page also has a "Fill demo login" button. `npm run seed` resets it any time.
- **MongoDB without installing anything:** `server/scripts/local-db.mjs` reuses the mongod binary the smoke test already downloaded and runs it against a real on-disk data dir (`server/.local-db`, gitignored) — **data persists across restarts**. Managed by `npm run db:up` / `db:down` / `seed`.
- **`server/.env`** (gitignored) holds a generated `JWT_SECRET` and the local `MONGODB_URI` — the API refuses to boot without it by design.
- **Why signup may appear broken:** the API isn't running. The frontend now says so explicitly ("Can't reach the Pulse API — start it with `npm run up`…") instead of a cryptic network error.
- **Moving to the cloud later:** zero code changes — point `MONGODB_URI` at a free Atlas M0, deploy the API to Render/Railway, set `CLIENT_ORIGIN` to your Vercel URL. Cookies flip to `sameSite=none; secure` automatically in production.

