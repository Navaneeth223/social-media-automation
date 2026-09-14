/*
 * End-to-end smoke test for Phase 1 — runs the REAL app (same Express app,
 * same routes, same bcrypt/JWT/cookie code) against a throwaway in-memory
 * MongoDB, so it needs no Atlas cluster and no local Mongo:
 *
 *   cd server && npm run smoke
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "smoke-test-secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/pulse-smoke-placeholder";
process.env.LINKEDIN_CLIENT_ID = "test-client-id";
process.env.LINKEDIN_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_CLIENT_ID = "test-google-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
process.env.INSTAGRAM_CLIENT_ID = "test-instagram-id";
process.env.INSTAGRAM_CLIENT_SECRET = "test-instagram-secret";
process.env.TIKTOK_CLIENT_KEY = "test-tiktok-key";
process.env.TIKTOK_CLIENT_SECRET = "test-tiktok-secret";

import assert from "node:assert/strict";
import fs from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

let failures = 0;
const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(`PASS ${name}`);
    console.log("  ✓", name);
  } catch (e) {
    failures++;
    results.push(`FAIL ${name} — ${e.message}`);
    console.error("  ✗", name, "\n     ", e.message);
  }
};

console.log("Booting in-memory MongoDB…");
const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri("pulse");

const { connectDb } = await import("./src/db.js");
const { createApp } = await import("./src/app.js");
const mongoose = (await import("mongoose")).default;

await connectDb(process.env.MONGODB_URI);
const app = createApp();
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

/* Phase 2: intercept LinkedIn endpoints so the REAL service code (token
   exchange, userinfo, /rest/posts) runs end-to-end without live credentials. */
const realFetch = globalThis.fetch;
// TikTok stub state — module scope so tests can read what the handler captured.
let tiktokStatus = "SEND_TO_USER_INBOX"; // flip to "FAILED" to test failure surfacing
let tiktokCapturedPrivacy = null;
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
  if (url.includes("linkedin.com/oauth/v2/accessToken")) {
    return json({ access_token: "fake-access-token", expires_in: 5184000, scope: "openid profile email w_member_social" });
  }
  if (url.includes("api.linkedin.com/v2/userinfo")) {
    return json({ sub: "abc123def", name: "Demo User", email: "demo@pulse.app" });
  }
  if (url.includes("api.linkedin.com/rest/posts")) {
    return json({ id: "urn:li:share:721234567890123456" }, 201);
  }
  /* Phase 3: Google / YouTube stubs — token exchange, refresh, channel, and
     the resumable upload session + byte-put. */
  if (url.includes("oauth2.googleapis.com/token")) {
    const isRefresh = String(init?.body || "").includes("grant_type=refresh_token");
    return json(
      isRefresh
        ? { access_token: "yt-fresh-token", expires_in: 3599 }
        : {
            access_token: "yt-access-token",
            refresh_token: "yt-refresh-token",
            expires_in: 3599,
            scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
          }
    );
  }
  if (url.includes("googleapis.com/youtube/v3/channels")) {
    return json({ items: [{ id: "UC123abc", snippet: { title: "Pulse Demo Channel" } }] });
  }
  if (url.includes("uploadType=resumable")) {
    return new Response(null, {
      status: 200,
      headers: { Location: "https://www.googleapis.com/upload/session/smoke-123" },
    });
  }
  if (url.includes("upload/session/smoke-123")) {
    return json({ id: "yt-video-123" }, 200);
  }
  /* The video "file" the upload streams from. */
  if (url === "https://example.com/demo-video.mp4") {
    return new Response("fake-video-bytes", {
      status: 200,
      headers: { "Content-Type": "video/mp4", "Content-Length": "16" },
    });
  }
  /* Phase 4: Instagram (graph.instagram.com) stubs — token exchange, long-lived
     exchange/refresh, identity, container creation + status, publish. */
  if (url.includes("graph.instagram.com/oauth/access_token")) {
    return json({ access_token: "ig-short-token" });
  }
  if (url.includes("refresh_access_token")) {
    return json({ access_token: "ig-refreshed-token", expires_in: 5184000 });
  }
  if (url.includes("graph.instagram.com/access_token")) {
    return json({ access_token: "ig-long-token", expires_in: 5184000 });
  }
  if (url.includes("/me?fields=user_id")) {
    return json({ user_id: "ig-user-123", username: "loopwear.studio", account_type: "BUSINESS" });
  }
  if (url.includes("/me/media_publish")) {
    return json({ id: "ig-post-123" });
  }
  if (url.includes("status_code")) {
    return json({ status_code: "FINISHED" });
  }
  if (url.includes("/me/media")) {
    return json({ id: "ig-container-123" });
  }
  /* Phase 5: TikTok (open.tiktokapis.com) stubs — token exchange/refresh,
     user info, Direct Post init (PULL_FROM_URL), status fetch. */
  if (url.includes("/oauth/token/")) {
    const isRefresh = String(init?.body || "").includes("grant_type=refresh_token");
    return json(
      isRefresh
        ? { access_token: "tt-fresh-token", refresh_token: "tt-refresh-2", expires_in: 86400 }
        : {
            access_token: "tt-access-token",
            refresh_token: "tt-refresh-token",
            open_id: "tt-open-123",
            expires_in: 86400,
            refresh_expires_in: 31536000,
            scope: "user.info.basic video.publish video.upload",
          }
    );
  }
  if (url.includes("/user/info/")) {
    return json({
      data: { user: { open_id: "tt-open-123", display_name: "TikTok Demo" } },
      error: { code: "ok", message: "" },
    });
  }
  if (url.includes("/post/publish/video/init/")) {
    try {
      const body = JSON.parse(init?.body);
      tiktokCapturedPrivacy = body?.post_info?.privacy_level || null;
    } catch {
      tiktokCapturedPrivacy = null;
    }
    return json({ data: { publish_id: "tt-publish-123" }, error: { code: "ok", message: "" } });
  }
  if (url.includes("/post/publish/status/fetch/")) {
    return json({
      data: { status: tiktokStatus, fail_reason: "video duration exceeds the limit" },
      error: { code: "ok", message: "" },
    });
  }
  return realFetch(input, init);
};

const j = async (path, opts = {}) => {
  const res = await fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, cookies: res.headers.getSetCookie() };
};
const cookieOf = (r) =>
  (r.cookies.find((c) => c.startsWith("pulse_token=")) || "").split(";")[0];
const me = (cookie) => j("/api/auth/me", { headers: { Cookie: cookie } });
const PASSWORD = "correct-horse-battery";

try {
  await step("health reports db up", async () => {
    const r = await j("/api/health");
    assert.equal(r.status, 200);
    assert.equal(r.data.db, "up");
  });

  await step("register creates a real trial user + httpOnly session", async () => {
    const r = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Maya Chen", email: "maya@example.com", password: PASSWORD }),
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.user.email, "maya@example.com");
    assert.equal(r.data.user.plan, "trial");
    assert.ok(new Date(r.data.user.trialEndsAt) > new Date());
    assert.ok(cookieOf(r).startsWith("pulse_token="), "session cookie set");
    assert.ok(!JSON.stringify(r.data).includes("$2"), "password hash never leaks");
  });

  await step("register rejects short passwords (400)", async () => {
    const r = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "X", email: "x@example.com", password: "short" }),
    });
    assert.equal(r.status, 400);
  });

  await step("register rejects duplicate emails (409)", async () => {
    const r = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Maya Two", email: "maya@example.com", password: PASSWORD }),
    });
    assert.equal(r.status, 409);
  });

  await step("login with wrong password → generic 401", async () => {
    const r = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: "wrong-password" }),
    });
    assert.equal(r.status, 401);
    assert.equal(r.data.error, "Invalid email or password.");
  });

  await step("login with right password → 200 + cookie", async () => {
    const r = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    assert.equal(r.status, 200);
    assert.ok(cookieOf(r).startsWith("pulse_token="));
  });

  await step("/me returns the signed-in user (cookie auth)", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const r = await me(cookieOf(login));
    assert.equal(r.status, 200);
    assert.equal(r.data.user.name, "Maya Chen");
  });

  await step("/me also accepts Bearer tokens", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const token = cookieOf(login).split("=")[1];
    const r = await j("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(r.status, 200);
  });

  await step("/me without a session → 401", async () => {
    const r = await me("");
    assert.equal(r.status, 401);
  });

  await step("logout clears the session for good", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const out = await j("/api/auth/logout", { method: "POST", headers: { Cookie: cookie } });
    assert.equal(out.status, 200);
    const r = await me(cookie);
    assert.equal(r.status, 401);
  });

  await step("logout revokes every session, not just the cookie", async () => {
    const reg = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Ada Wait", email: "ada@example.com", password: PASSWORD }),
    });
    const cookieA = cookieOf(reg);
    const loginB = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "ada@example.com", password: PASSWORD }),
    });
    const cookieB = cookieOf(loginB);
    assert.ok(cookieA.startsWith("pulse_token=") && cookieB.startsWith("pulse_token="));
    const out = await j("/api/auth/logout", { method: "POST", headers: { Cookie: cookieB } });
    assert.equal(out.status, 200);
    assert.equal((await me(cookieA)).status, 401, "older session dies too");
    assert.equal((await me(cookieB)).status, 401, "current session dies");
  });

  await step("platform tokens encrypt at rest and round-trip", async () => {
    const { encrypt, decrypt } = await import("./src/services/crypto.js");
    const secret = "fake-access-token-plain";
    const stored = encrypt(secret);
    assert.ok(!stored.includes(secret), "plaintext never stored");
    assert.equal(decrypt(stored), secret);
  });

  await step("OAuth flow: authorize → callback stores an ENCRYPTED token", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const auth = await fetch(`${base}/api/auth/linkedin`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    assert.equal(auth.status, 302, "authorize redirects to LinkedIn");
    const loc = auth.headers.get("location");
    assert.ok(loc.includes("linkedin.com/oauth/v2/authorization"), loc);
    assert.ok(new URL(loc).searchParams.get("scope").includes("w_member_social"), "scopes requested");
    const stateUrl = new URL(loc).searchParams.get("state");
    const liCookie = auth
      .headers.getSetCookie()
      .find((c) => c.startsWith("li_oauth_state="))
      ?.split(";")[0];
    assert.ok(stateUrl && liCookie, "state param + CSRF state cookie set");

    const cb = await fetch(`${base}/api/auth/linkedin/callback?code=fake-code&state=${stateUrl}`, {
      headers: { Cookie: `${cookie}; ${liCookie}` },
      redirect: "manual",
    });
    assert.equal(cb.status, 302, "callback redirects");
    assert.ok(
      cb.headers.get("location").startsWith("/app?connected=linkedin"),
      cb.headers.get("location")
    );

    const conns = await j("/api/connections", { headers: { Cookie: cookie } });
    assert.equal(conns.data.configured.linkedin, true);
    assert.equal(conns.data.connected[0]?.platform, "linkedin");
    assert.equal(conns.data.connected[0]?.displayName, "Demo User");

    const { PlatformAccount } = await import("./src/models/PlatformAccount.js");
    const { decrypt } = await import("./src/services/crypto.js");
    const acct = await PlatformAccount.findOne({ platform: "linkedin" });
    assert.ok(acct, "account stored");
    assert.ok(!JSON.stringify(acct.toObject()).includes("fake-access-token"), "token encrypted at rest");
    assert.equal(decrypt(acct.accessTokenEnc), "fake-access-token", "decrypts for publishing");
  });

  await step("post now → real publish path (stubbed API) stores the platform id", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({ text: "Shipped with Pulse — one draft, seven feeds.", publishNow: true }),
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.post.status, "posted");
    assert.equal(r.data.post.publishedId, "urn:li:share:721234567890123456");
    assert.ok(r.data.post.publishedAt, "publish timestamp recorded");
  });

  await step("scheduled post publishes EXACTLY once (worker idempotency)", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({ text: "Scheduled by Pulse", scheduledFor: new Date(Date.now() - 1000).toISOString() }),
    });
    assert.equal(r.status, 201);
    const postId = r.data.post.id;
    assert.equal(r.data.post.status, "scheduled");

    const { processOnce } = await import("./src/worker.js");
    const first = await processOnce();
    assert.ok(first, "first claim wins");
    const again = await processOnce();
    assert.equal(again, null, "second pass never re-claims");

    const list = await j("/api/posts", { headers: { Cookie: cookie } });
    const posted = list.data.posts.find((p) => p.id === postId);
    assert.equal(posted.status, "posted", "post went out once");
  });

  await step("worker restart mid-publish FAILS honestly instead of double-posting", async () => {
    const { Post } = await import("./src/models/Post.js");
    const { processOnce } = await import("./src/worker.js");
    const { User } = await import("./src/models/User.js");
    const u = await User.findOne({ email: "maya@example.com" });
    await Post.create({
      user: u._id,
      platform: "linkedin",
      text: "stale claim from a dead worker",
      status: "publishing",
      scheduledFor: new Date(),
      claimedAt: new Date(Date.now() - 11 * 60 * 1000),
    });
    await processOnce();
    const p = await Post.findOne({ text: "stale claim from a dead worker" });
    assert.equal(p.status, "failed");
    assert.ok(p.error.includes("interrupted"), p.error);
  });

  await step("posts API: list + delete rules", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const list = await j("/api/posts", { headers: { Cookie: cookie } });
    assert.ok(list.data.posts.length >= 3, `${list.data.posts.length} posts`);

    const scheduled = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({ text: "delete me later", scheduledFor: new Date(Date.now() + 3600_000).toISOString() }),
    });
    assert.equal(scheduled.status, 201);
    const del = await j(`/api/posts/${scheduled.data.post.id}`, { method: "DELETE", headers: { Cookie: cookie } });
    assert.equal(del.status, 200);

    const posted = list.data.posts.find((p) => p.status === "posted");
    const delPosted = await j(`/api/posts/${posted.id}`, { method: "DELETE", headers: { Cookie: cookie } });
    assert.equal(delPosted.status, 400, "history cannot be deleted");
  });

  await step("YouTube OAuth: authorize → callback stores ENCRYPTED access + refresh tokens", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const auth = await fetch(`${base}/api/auth/youtube`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    assert.equal(auth.status, 302, "authorize redirects to Google");
    const loc = auth.headers.get("location");
    assert.ok(loc.includes("accounts.google.com/o/oauth2/v2/auth"), loc);
    const params = new URL(loc).searchParams;
    assert.ok(params.get("scope").includes("youtube.upload"), "upload scope requested");
    assert.equal(params.get("access_type"), "offline", "offline access for refresh token");
    const ytState = params.get("state");
    const ytCookie = auth
      .headers.getSetCookie()
      .find((c) => c.startsWith("yt_oauth_state="))
      ?.split(";")[0];
    assert.ok(ytState && ytCookie, "state param + CSRF cookie set");

    const cb = await fetch(`${base}/api/auth/youtube/callback?code=fake-code&state=${ytState}`, {
      headers: { Cookie: `${cookie}; ${ytCookie}` },
      redirect: "manual",
    });
    assert.ok(
      cb.headers.get("location").startsWith("/app?connected=youtube"),
      cb.headers.get("location")
    );

    const { PlatformAccount } = await import("./src/models/PlatformAccount.js");
    const { decrypt } = await import("./src/services/crypto.js");
    const acct = await PlatformAccount.findOne({ platform: "youtube" });
    assert.ok(acct, "account stored");
    assert.ok(!JSON.stringify(acct.toObject()).includes("yt-refresh-token"), "refresh token encrypted at rest");
    assert.equal(decrypt(acct.refreshTokenEnc), "yt-refresh-token");
    assert.equal(acct.displayName, "Pulse Demo Channel", "channel identity stored");
  });

  await step("YouTube post now → resumable upload stores the real video id", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookieOf(login) },
      body: JSON.stringify({
        platform: "youtube",
        title: "One draft, seven feeds",
        videoUrl: "https://example.com/demo-video.mp4",
        description: "Uploaded by Pulse",
        publishNow: true,
      }),
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.post.status, "posted");
    assert.equal(r.data.post.publishedId, "yt-video-123");
  });

  await step("YouTube validation: title + video URL required (400)", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookieOf(login) },
      body: JSON.stringify({ platform: "youtube", title: "", publishNow: true }),
    });
    assert.equal(r.status, 400);
  });

  await step("YouTube scheduled upload auto-REFRESHES the expired access token", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const { PlatformAccount } = await import("./src/models/PlatformAccount.js");
    // Simulate a token that expired a day after connecting.
    await PlatformAccount.findOneAndUpdate(
      { platform: "youtube" },
      { $set: { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    );
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        platform: "youtube",
        title: "Scheduled upload with refresh",
        videoUrl: "https://example.com/demo-video.mp4",
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
      }),
    });
    assert.equal(r.status, 201);
    const { processOnce } = await import("./src/worker.js");
    const first = await processOnce();
    assert.ok(first, "worker claimed the youtube post");
    const again = await processOnce();
    assert.equal(again, null, "never double-uploads");

    const list = await j("/api/posts", { headers: { Cookie: cookie } });
    const posted = list.data.posts.find((p) => p.id === r.data.post.id);
    assert.equal(posted.status, "posted", "upload went out once");
    assert.equal(posted.publishedId, "yt-video-123");

    const acct = await PlatformAccount.findOne({ platform: "youtube" });
    const { decrypt } = await import("./src/services/crypto.js");
    assert.equal(decrypt(acct.accessTokenEnc), "yt-fresh-token", "access token refreshed + re-encrypted");
  });

  await step("publish-now without a connected platform → honest 400", async () => {
    await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "No Conn", email: "noconn@example.com", password: PASSWORD }),
    });
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "noconn@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const li = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({ platform: "linkedin", text: "test", publishNow: true }),
    });
    assert.equal(li.status, 400);
    assert.ok(li.data.error.includes("Connect LinkedIn"), li.data.error);
    const yt = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        platform: "youtube",
        title: "test",
        videoUrl: "https://example.com/demo-video.mp4",
        publishNow: true,
      }),
    });
    assert.equal(yt.status, 400);
    assert.ok(yt.data.error.includes("Connect YouTube"), yt.data.error);
    const ig = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        platform: "instagram",
        text: "test",
        imageUrl: "https://example.com/photo.jpg",
        publishNow: true,
      }),
    });
    assert.equal(ig.status, 400);
    assert.ok(ig.data.error.includes("Connect Instagram"), ig.data.error);
  });

  await step("Instagram OAuth: authorize → callback stores an ENCRYPTED 60-day token", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const auth = await fetch(`${base}/api/auth/instagram`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    assert.equal(auth.status, 302, "authorize redirects to Instagram");
    const loc = auth.headers.get("location");
    assert.ok(loc.includes("instagram.com/oauth/authorize"), loc);
    const params = new URL(loc).searchParams;
    assert.ok(
      params.get("scope").includes("instagram_business_content_publish"),
      "publish scope requested"
    );
    const stateUrl = params.get("state");
    const igCookie = auth
      .headers.getSetCookie()
      .find((c) => c.startsWith("ig_oauth_state="))
      ?.split(";")[0];
    assert.ok(stateUrl && igCookie, "state param + CSRF cookie set");

    const cb = await fetch(`${base}/api/auth/instagram/callback?code=fake-code&state=${stateUrl}`, {
      headers: { Cookie: `${cookie}; ${igCookie}` },
      redirect: "manual",
    });
    assert.ok(
      cb.headers.get("location").startsWith("/app?connected=instagram"),
      cb.headers.get("location")
    );

    const conns = await j("/api/connections", { headers: { Cookie: cookie } });
    const ig = conns.data.connected.find((c) => c.platform === "instagram");
    assert.equal(ig.displayName, "loopwear.studio", "username stored");

    const { PlatformAccount } = await import("./src/models/PlatformAccount.js");
    const { decrypt } = await import("./src/services/crypto.js");
    const acct = await PlatformAccount.findOne({ platform: "instagram" });
    assert.ok(!JSON.stringify(acct.toObject()).includes("ig-long-token"), "token encrypted at rest");
    assert.equal(decrypt(acct.accessTokenEnc), "ig-long-token", "long-lived token round-trips");
    assert.ok(
      new Date(acct.expiresAt) > new Date(Date.now() + 50 * 24 * 3600 * 1000),
      "~60-day token stored"
    );
  });

  await step("Instagram post now → container → publish stores the real media id", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookieOf(login) },
      body: JSON.stringify({
        platform: "instagram",
        text: "New drop — caption by Pulse",
        videoUrl: "https://example.com/demo-video.mp4",
        publishNow: true,
      }),
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.post.status, "posted");
    assert.equal(r.data.post.publishedId, "ig-post-123");
  });

  await step("Instagram scheduled media auto-REFRESHES the long-lived token", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const { PlatformAccount } = await import("./src/models/PlatformAccount.js");
    // Simulate a token that expired a day after connecting.
    await PlatformAccount.findOneAndUpdate(
      { platform: "instagram" },
      { $set: { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    );
    const r = await j("/api/posts", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        platform: "instagram",
        text: "scheduled photo",
        imageUrl: "https://example.com/photo.jpg",
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
      }),
    });
    assert.equal(r.status, 201);
    const { processOnce } = await import("./src/worker.js");
    assert.ok(await processOnce(), "worker claimed the instagram post");

    const list = await j("/api/posts", { headers: { Cookie: cookie } });
    const p = list.data.posts.find((x) => x.text === "scheduled photo");
    assert.equal(p.status, "posted");
    assert.equal(p.publishedId, "ig-post-123");

    const acct = await PlatformAccount.findOne({ platform: "instagram" });
    const { decrypt } = await import("./src/services/crypto.js");
    assert.equal(decrypt(acct.accessTokenEnc), "ig-refreshed-token", "token refreshed + re-encrypted");
  });

  await step("TikTok OAuth: authorize → callback stores ENCRYPTED access + refresh tokens", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const auth = await fetch(`${base}/api/auth/tiktok`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    console.log(
      "[dbg authorize]",
      auth.status,
      JSON.stringify([...auth.headers]),
      (await auth.text()).slice(0, 150)
    );
    assert.equal(auth.status, 302, "authorize redirects to TikTok");
    const loc = auth.headers.get("location");
    assert.ok(loc.includes("tiktok.com/v2/auth/authorize"), loc);
    const params = new URL(loc).searchParams;
    assert.ok(params.get("scope").includes("video.publish"), "publish scope requested");
    assert.ok(params.get("client_key"), "client_key used (TikTok uses client_key, not client_id)");
    const ttState = params.get("state");
    const ttCookie = auth
      .headers.getSetCookie()
      .find((c) => c.startsWith("tt_oauth_state="))
      ?.split(";")[0];
    assert.ok(ttState && ttCookie, "state param + CSRF cookie set");

    const cb = await fetch(`${base}/api/auth/tiktok/callback?code=fake-code&state=${ttState}`, {
      headers: { Cookie: `${cookie}; ${ttCookie}` },
      redirect: "manual",
    });
    console.log(
      "[dbg callback]",
      cb.status,
      cb.headers.get("location"),
      (await cb.text()).slice(0, 250)
    );
    assert.ok(
      cb.headers.get("location").startsWith("/app?connected=tiktok"),
      cb.headers.get("location")
    );

    const { PlatformAccount } = await import("./src/models/PlatformAccount.js");
    const { decrypt } = await import("./src/services/crypto.js");
    const acct = await PlatformAccount.findOne({ platform: "tiktok" });
    assert.equal(acct.platformAccountId, "tt-open-123", "open_id stored");
    assert.equal(acct.displayName, "TikTok Demo");
    assert.ok(!JSON.stringify(acct.toObject()).includes("tt-access-token"), "access token encrypted");
    assert.ok(!JSON.stringify(acct.toObject()).includes("tt-refresh-token"), "refresh token encrypted");
    assert.equal(decrypt(acct.accessTokenEnc), "tt-access-token");
    assert.equal(decrypt(acct.refreshTokenEnc), "tt-refresh-token");
  });

  await step(
    "TikTok post now → PULL_FROM_URL accepted, SELF_ONLY forced, status publishing",
    async () => {
      const login = await j("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
      });
      const r = await j("/api/posts", {
        method: "POST",
        headers: { Cookie: cookieOf(login) },
        body: JSON.stringify({
          platform: "tiktok",
          title: "Sandbox upload — caption by Pulse",
          videoUrl: "https://example.com/demo-video.mp4",
          publishNow: true,
        }),
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.post.status, "publishing", "two-stage: TikTok is processing");
      assert.equal(r.data.post.publishedId, "tt-publish-123");
      assert.equal(tiktokCapturedPrivacy, "SELF_ONLY", "privacy FORCED to SELF_ONLY until audit");
    }
  );

  await step("TikTok status poll lands the post: publishing → posted", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const { processOnce } = await import("./src/worker.js");
    await processOnce(); // poll branch: tiktok status = SEND_TO_USER_INBOX
    const list = await j("/api/posts", { headers: { Cookie: cookie } });
    const posted = list.data.posts.find((p) => p.publishedId === "tt-publish-123");
    assert.equal(posted.status, "posted", "delivered to the TikTok inbox");
  });

  await step("TikTok FAILED status surfaces the REAL fail_reason", async () => {
    tiktokStatus = "FAILED";
    try {
      const login = await j("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
      });
      const r = await j("/api/posts", {
        method: "POST",
        headers: { Cookie: cookieOf(login) },
        body: JSON.stringify({
          platform: "tiktok",
          title: "this one will fail",
          videoUrl: "https://example.com/demo-video.mp4",
          publishNow: true,
        }),
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.post.status, "publishing", "accepted first");
      const { processOnce } = await import("./src/worker.js");
      await processOnce(); // poll: FAILED
      const list = await j("/api/posts", { headers: { Cookie: cookieOf(login) } });
      const failed = list.data.posts.find((p) => p.title === "this one will fail");
      assert.equal(failed.status, "failed");
      assert.equal(failed.error, "video duration exceeds the limit", "real TikTok reason shown");
    } finally {
      tiktokStatus = "SEND_TO_USER_INBOX";
    }
  });
} finally {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
}

console.log(
  failures
    ? `\n${failures} check(s) failed — fix before calling Phase 1 done.`
    : "\nAll Phase 1 checks passed — register → session → me → logout on the real app."
);

// Machine-readable summary — console encoding mangles ✓/✗ on Windows.
fs.writeFileSync("smoke-summary.txt", `failures=${failures}\n${results.join("\n")}\n`);
process.exit(failures ? 1 : 0);
