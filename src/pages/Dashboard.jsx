import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useSEO } from "../lib/seo";
import {
  AtSign,
  CalendarDays,
  Instagram,
  Linkedin,
  LogOut,
  Music2,
  Twitter,
  Youtube,
} from "lucide-react";
import { getMe, logout } from "../lib/api";
import { PRODUCT } from "../lib/config";

/*
 * The connection matrix tells the truth about every platform (rule: a button
 * either starts a real OAuth flow or is visibly disabled — never a dead click):
 *  - LinkedIn ships live in Phase 2 (free w_member_social, no app review),
 *  - YouTube Phase 3, Instagram Phase 4 (testers first), TikTok Phase 5
 *    (private posts until audit), X has no free API at all.
 */
const CONNECTIONS = [
  { name: "LinkedIn", Icon: Linkedin, phase: "Phase 2", live: true, note: "Publishes to your own profile — free tier, no app review needed." },
  { name: "YouTube", Icon: Youtube, phase: "Phase 3", live: true, note: "Uploads via Data API v3 to your own channel." },
  { name: "Instagram", Icon: Instagram, phase: "Phase 4", live: true, note: "Meta Graph API — works for accounts added as testers first." },
  { name: "TikTok", Icon: Music2, phase: "Phase 5", live: true, note: "Posts stay private until TikTok audits the app. We'll say so in the UI." },
  { name: "X (Twitter)", Icon: Twitter, phase: "No API", live: false, note: "No free API tier exists — a copy-to-clipboard helper is planned instead." },
  { name: "Threads", Icon: AtSign, phase: "Phase 4+", live: true, note: "Rides the same Meta app as Instagram." },
];

export default function Dashboard() {
  useSEO({
    title: "Pulse — Dashboard",
    description: "Your private Pulse workspace.",
    path: "/app",
    noindex: true,
  });

  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, []);

  if (user === undefined) {
    return (
      <div className="grid min-h-svh place-items-center bg-ink text-sm text-mute">
        Loading your workspace…
      </div>
    );
  }
  if (user === null) return <Navigate to="/login" replace />;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(user.trialEndsAt) - Date.now()) / (24 * 60 * 60 * 1000))
  );
  const firstName = user.name.split(" ")[0];

  async function signOut() {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  }

  return (
    <div className="min-h-svh bg-ink text-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="flex items-baseline gap-1 font-display text-xl font-semibold tracking-tight"
          >
            {PRODUCT.name}
            <span className="text-acid">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="chip border-line bg-soot text-mute">{user.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-medium transition-colors hover:border-acid/60 hover:text-acid"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-mute">
          Your workspace
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Welcome, <span className="text-acid">{firstName}</span>.
        </h1>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          <div className="bg-coal p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-mute">Plan</p>
            <p className="mt-2 font-display text-3xl font-semibold capitalize">{user.plan}</p>
            <p className="mt-1 text-xs text-mute">14-day trial · no card required</p>
          </div>
          <div className="bg-coal p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-mute">Trial days left</p>
            <p className="mt-2 font-display text-3xl font-semibold">{daysLeft}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-mute">
              <CalendarDays size={12} className="text-acid" /> ends{" "}
              {new Date(user.trialEndsAt).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-coal p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-mute">Queue</p>
            <p className="mt-2 font-display text-3xl font-semibold">Empty</p>
            <p className="mt-1 text-xs text-mute">The composer ships with Phase 2 (LinkedIn live).</p>
          </div>
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold">Platform connections</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
          Each connect button goes live with its phase — and every platform only does what its API
          genuinely allows. No fake toggles here.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTIONS.map(({ name, Icon, note, phase, live }) => (
            <div key={name} className="flex flex-col rounded-2xl border border-line bg-coal p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-soot">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span
                  className={`chip ${live ? "border-acid/40 text-acid" : "border-line bg-soot text-mute"}`}
                >
                  {phase}
                </span>
              </div>
              <p className="mt-4 font-medium">{name}</p>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-mute">{note}</p>
              <button
                disabled
                title="Goes live in a later phase — never a dead click"
                className="mt-4 cursor-not-allowed rounded-full border border-line bg-soot py-2.5 text-[13px] font-medium text-mute"
              >
                Connect — coming soon
              </button>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}
