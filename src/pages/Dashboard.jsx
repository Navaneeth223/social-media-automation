import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import {
  AtSign,
  CalendarDays,
  Instagram,
  Linkedin,
  LogOut,
  Music2,
  Send,
  Timer,
  Trash2,
  Twitter,
  Youtube,
} from "lucide-react";
import {
  createPost,
  deletePost,
  disconnectPlatform,
  getConnections,
  getMe,
  getPosts,
  logout,
} from "../lib/api";
import { PRODUCT } from "../lib/config";

/*
 * The real composer dashboard. The connection matrix tells the truth about
 * every platform (a button either starts a real OAuth flow or is visibly
 * disabled — never a dead click):
 *  - LinkedIn is LIVE (Phase 2): OAuth connect → composer → real publishing
 *    to your own feed (w_member_social, free tier, no app review),
 *  - YouTube Phase 3, Instagram Phase 4 (testers first), TikTok Phase 5
 *    (private posts until audit), X has no free API at all.
 */
const CONNECTIONS = [
  { name: "LinkedIn", Icon: Linkedin, phase: "Live", live: true, note: "Publishes to your own feed — free tier, no app review needed." },
  { name: "YouTube", Icon: Youtube, phase: "Live", live: true, note: "Resumable uploads via Data API v3 to your own channel. Unverified apps upload as private." },
  { name: "Instagram", Icon: Instagram, phase: "Phase 4", live: false, note: "Meta Graph API — works for accounts added as testers first." },
  { name: "TikTok", Icon: Music2, phase: "Phase 5", live: false, note: "Posts stay private until TikTok audits the app. We'll say so in the UI." },
  { name: "X (Twitter)", Icon: Twitter, phase: "No API", live: false, note: "No free API tier exists — a copy-to-clipboard helper is planned instead." },
  { name: "Threads", Icon: AtSign, phase: "Phase 4+", live: false, note: "Rides the same Meta app as Instagram." },
];

export default function Dashboard() {
  useSEO({
    title: "Pulse — Dashboard",
    description: "Your private Pulse workspace.",
    path: "/app",
    noindex: true,
  });

  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [connections, setConnections] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [tab, setTab] = useState("linkedin"); // composer target platform
  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytDesc, setYtDesc] = useState("");
  const [ytPrivacy, setYtPrivacy] = useState("private");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const liAccount = connections?.connected.find((c) => c.platform === "linkedin") || null;
  const liConfigured = connections?.configured.linkedin ?? false;
  const ytAccount = connections?.connected.find((c) => c.platform === "youtube") || null;
  const ytConfigured = connections?.configured.youtube ?? false;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([getConnections(), getPosts()]);
      setConnections(c);
      setPosts(p.posts);
    } catch (e) {
      setNotice({ error: e.message });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && setUser(null));
    load();
    const poll = setInterval(() => {
      if (alive) load(); // watch scheduled → posted transitions live
    }, 4000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [load]);

  // Returned from the LinkedIn OAuth redirect: /app?connected=linkedin[&error=…]
  useEffect(() => {
    if (params.get("connected") === "linkedin") {
      const error = params.get("error");
      setNotice(
        error
          ? { error: decodeURIComponent(error) }
          : { ok: "LinkedIn connected — write something and post it for real." }
      );
    }
  }, [params]);

  async function handleCreate(publishNow) {
    if (busy) return;
    setNotice(null);

    let payload;
    if (tab === "youtube") {
      if (!ytTitle.trim() || !ytUrl.trim()) {
        setNotice({ error: "A title and a video URL are required for YouTube." });
        return;
      }
      payload = {
        platform: "youtube",
        title: ytTitle.trim(),
        videoUrl: ytUrl.trim(),
        description: ytDesc.trim(),
        privacyStatus: ytPrivacy,
      };
    } else {
      if (!text.trim()) return;
      payload = { platform: "linkedin", text: text.trim() };
    }

    if (publishNow) {
      payload.publishNow = true;
    } else {
      if (!when) {
        setNotice({ error: "Pick a date and time first." });
        return;
      }
      payload.scheduledFor = new Date(when).toISOString();
    }

    setBusy(true);
    try {
      const r = await createPost(payload);
      if (publishNow) {
        setNotice(
          r.post.status === "posted"
            ? {
                ok:
                  tab === "youtube"
                    ? "Video uploaded to YouTube ✓ — private until you publish it there."
                    : "Posted to LinkedIn ✓",
              }
            : { error: r.post.error || "The platform refused the post — see the queue for the real error." }
        );
      } else {
        setNotice({ ok: "Scheduled ✓ — Pulse publishes it at the right moment." });
      }
      setText("");
      setYtTitle("");
      setYtUrl("");
      setYtDesc("");
      setWhen("");
    } catch (e) {
      setNotice({ error: e.message });
    } finally {
      setBusy(false);
      load();
    }
  }

  async function handleDelete(id) {
    try {
      await deletePost(id);
    } finally {
      load();
    }
  }

  async function handleDisconnect(platform) {
    try {
      await disconnectPlatform(platform);
      setNotice({ ok: "LinkedIn disconnected." });
    } catch (e) {
      setNotice({ error: e.message });
    } finally {
      load();
    }
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  }


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
        {notice && (
          <p
            className={`mb-6 rounded-lg border-l-2 px-4 py-3 text-sm ${
              notice.ok ? "border-acid bg-acid/10 text-paper" : "border-acid bg-soot text-paper"
            }`}
          >
            {notice.ok || notice.error}
          </p>
        )}

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
            <p className="mt-2 font-display text-3xl font-semibold">{scheduledCount}</p>
            <p className="mt-1 text-xs text-mute">
              {scheduledCount ? "publishing automatically" : "nothing scheduled yet"}
            </p>
          </div>
        </div>

        {/* LinkedIn connection — the Phase 2 platform */}
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-acid/30 bg-coal p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-soot">
              <Linkedin size={19} strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-medium">LinkedIn</p>
              <p className="text-[13px] text-mute">
                {liAccount
                  ? `Connected as ${liAccount.displayName} — posting to your own feed.`
                  : "Connect your profile to publish for real. Posts to your own feed only."}
              </p>
            </div>
          </div>
          {liAccount ? (
            <button
              onClick={() => handleDisconnect("linkedin")}
              className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-acid/60 hover:text-acid"
            >
              Disconnect
            </button>
          ) : liConfigured ? (
            <a
              href="/api/auth/linkedin"
              className="shrink-0 rounded-full bg-acid px-5 py-2.5 text-[13px] font-semibold text-ink"
            >
              Connect LinkedIn
            </a>
          ) : (
            <span className="shrink-0 rounded-full border border-line bg-soot px-5 py-2.5 text-[13px] font-medium text-mute">
              Not configured on this server
            </span>
          )}
        </div>
        {/* YouTube connection — the Phase 3 platform */}
        <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-line bg-coal p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-soot">
              <Youtube size={19} strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-medium">YouTube</p>
              <p className="text-[13px] text-mute">
                {ytAccount
                  ? `Connected as ${ytAccount.displayName} — uploads to your channel.`
                  : "Connect your Google account to upload videos. Works while the app is in Testing mode."}
              </p>
            </div>
          </div>
          {ytAccount ? (
            <button
              onClick={() => handleDisconnect("youtube")}
              className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-acid/60 hover:text-acid"
            >
              Disconnect
            </button>
          ) : ytConfigured ? (
            <a
              href="/api/auth/youtube"
              className="shrink-0 rounded-full bg-acid px-5 py-2.5 text-[13px] font-semibold text-ink"
            >
              Connect YouTube
            </a>
          ) : (
            <span className="shrink-0 rounded-full border border-line bg-soot px-5 py-2.5 text-[13px] font-medium text-mute">
              Not configured on this server
            </span>
          )}
        </div>
        {!ytConfigured && !ytAccount && (
          <p className="mt-2 text-xs leading-relaxed text-mute">
            To go live: console.cloud.google.com → create a project → enable "YouTube Data API v3"
            → OAuth consent screen (External, <span className="text-paper/80">Testing</span> mode,
            add yourself as a test user) → OAuth client (Web) with redirect
            <code className="mx-1 text-paper/80">http://localhost:8787/api/auth/youtube/callback</code>
            → paste GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET into server/.env.
          </p>
        )}
        {!liConfigured && !liAccount && (
          <p className="mt-2 text-xs leading-relaxed text-mute">
            To go live: create an app at developer.linkedin.com, add the "Sign In with LinkedIn
            using OpenID Connect" + "Share on LinkedIn" products, set the redirect URL to
            <code className="mx-1 text-paper/80">http://localhost:8787/api/auth/linkedin/callback</code>
            and paste LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET into server/.env.
          </p>
        )}


        {/* Composer — per-platform */}
        <div className="mt-8 rounded-2xl border border-line bg-coal p-6">
          <div className="flex items-center gap-2">
            {[
              { id: "linkedin", label: "LinkedIn" },
              { id: "youtube", label: "YouTube" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === t.id ? "bg-acid text-ink" : "border border-line text-mute hover:text-paper"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "youtube" ? (
            <div className="mt-4 space-y-3">
              <input
                value={ytTitle}
                onChange={(e) => setYtTitle(e.target.value)}
                maxLength={100}
                placeholder="Video title"
                className="w-full rounded-xl border border-line bg-soot px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-mute/60 focus:border-acid/60"
              />
              <input
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="Public video URL — e.g. https://res.cloudinary.com/…/my-video.mp4"
                className="w-full rounded-xl border border-line bg-soot px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-mute/60 focus:border-acid/60"
              />
              <textarea
                value={ytDesc}
                onChange={(e) => setYtDesc(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Description (optional)"
                className="w-full resize-none rounded-xl border border-line bg-soot px-4 py-3 text-sm leading-relaxed text-paper outline-none transition-colors placeholder:text-mute/60 focus:border-acid/60"
              />
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={ytPrivacy}
                  onChange={(e) => setYtPrivacy(e.target.value)}
                  className="rounded-full border border-line bg-soot px-4 py-2 text-[13px] text-paper outline-none focus:border-acid/60"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
                <p className="text-xs leading-relaxed text-mute">
                  Unverified apps upload as <span className="text-paper/80">private</span> — flip
                  public on YouTube or complete OAuth verification. 1 upload ≈ 1,600 of your
                  10,000 free daily quota units.
                </p>
              </div>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder="What should go out today?"
              className="mt-4 w-full resize-none rounded-xl border border-line bg-soot px-4 py-3 text-sm leading-relaxed text-paper outline-none transition-colors placeholder:text-mute/60 focus:border-acid/60"
            />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleCreate(true)}
              disabled={
                busy ||
                (tab === "linkedin" ? !text.trim() || !liAccount : !ytTitle.trim() || !ytUrl.trim() || !ytAccount)
              }
              title={
                tab === "youtube" && !ytAccount
                  ? "Connect YouTube to upload instantly"
                  : tab === "linkedin" && !liAccount
                    ? "Connect LinkedIn to post instantly"
                    : undefined
              }
              className="flex items-center gap-2 rounded-full bg-acid px-5 py-2.5 text-[13px] font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <Send size={14} /> {tab === "youtube" ? "Upload now" : "Post now"}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="rounded-full border border-line bg-soot px-4 py-2 text-[13px] text-paper outline-none focus:border-acid/60"
              />
              <button
                onClick={() => handleCreate(false)}
                disabled={busy || (tab === "linkedin" ? !text.trim() : !ytTitle.trim() || !ytUrl.trim()) || !when}
                title="Schedules the post — Pulse publishes it automatically"
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium transition-colors hover:border-acid/60 hover:text-acid disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Timer size={14} /> Schedule
              </button>
            </div>
          </div>
        </div>


        {/* Queue — real posts, real statuses, real errors */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Queue</h2>
            <span className="text-xs text-mute">auto-refreshing</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            {posts.length === 0 ? (
              <p className="bg-coal p-6 text-sm text-mute">
                Nothing here yet — write something above and post it or schedule it.
              </p>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="border-t border-line bg-coal p-4 first:border-t-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`chip ${
                        p.status === "posted" || p.status === "scheduled"
                          ? "border-acid/40 text-acid"
                          : "border-line bg-soot text-mute"
                      }`}
                    >
                      {p.status}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm">{p.title || p.text}</p>
                    <span className="text-xs text-mute">
                      {p.status === "posted" && p.publishedAt
                        ? `posted ${new Date(p.publishedAt).toLocaleString()}`
                        : p.status === "scheduled"
                          ? `due ${new Date(p.scheduledFor).toLocaleString()}`
                          : p.status === "failed"
                            ? "failed"
                            : "publishing…"}
                    </span>
                    {p.status === "scheduled" && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label="Delete scheduled post"
                        className="text-mute transition-colors hover:text-acid"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  {p.status === "failed" && p.error && (
                    <p className="mt-2 border-l-2 border-acid pl-3 text-xs leading-relaxed text-mute">
                      {p.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>


        {/* Connection matrix — honest about what each platform can do today */}
        <h2 className="mt-12 font-display text-2xl font-semibold">Platform connections</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
          Every platform only does what its API genuinely allows. No fake toggles.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTIONS.map(({ name, Icon, note, phase, live }) => {
            const isLinkedIn = name === "LinkedIn";
            const isYouTube = name === "YouTube";
            const isConnected = (isLinkedIn && liAccount) || (isYouTube && ytAccount);
            return (
              <div key={name} className="flex flex-col rounded-2xl border border-line bg-coal p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-soot">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span
                    className={`chip ${live || isConnected ? "border-acid/40 text-acid" : "border-line bg-soot text-mute"}`}
                  >
                    {isConnected ? "connected" : phase}
                  </span>
                </div>
                <p className="mt-4 font-medium">{name}</p>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-mute">{note}</p>
                {!isLinkedIn && !isYouTube && (
                  <button
                    disabled
                    title="Goes live in a later phase — never a dead click"
                    className="mt-4 cursor-not-allowed rounded-full border border-line bg-soot py-2.5 text-[13px] font-medium text-mute"
                  >
                    Connect — coming soon
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
