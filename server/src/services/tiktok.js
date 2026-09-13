import { decrypt, encrypt } from "./crypto.js";
import { config } from "../config.js";
import { PlatformAccount } from "../models/PlatformAccount.js";

/*
 * TikTok — Phase 5, sandbox-honest via the Content Posting API (Direct Post).
 *
 *  - OAuth (Login Kit): client_key + client_secret; access tokens live ~24h,
 *    refresh tokens ~1y — both encrypted at rest.
 *  - Publishing: video/init with source "PULL_FROM_URL" — TikTok pulls the
 *    video from its public URL (Cloudinary free tier), then processes it.
 *  - Sandbox-honest: until TikTok audits the app, privacy_level is forced to
 *    SELF_ONLY (only the uploader can see the video). The UI says so; when
 *    the app is approved, set TIKTOK_PRIVACY_LEVEL=PUBLIC_TO_EVERYONE.
 *  - Two-stage lifecycle: init returns a publish_id while TikTok processes —
 *    the worker polls /status/fetch until it lands in the user's inbox or fails.
 */

const OPEN = "https://open.tiktokapis.com/v2";
const AUTH = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_SCOPES = "user.info.basic,video.publish,video.upload";

export const isConfigured = () =>
  Boolean(config.tiktok.clientKey && config.tiktok.clientSecret);

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    client_key: config.tiktok.clientKey,
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: config.tiktok.redirectUri,
    state,
  });
  return `${AUTH}?${p}`;
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_key: config.tiktok.clientKey,
    client_secret: config.tiktok.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.tiktok.redirectUri,
  });
  const res = await fetch(`${OPEN}/oauth/token/`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || `TikTok token exchange failed (${res.status})`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    openId: data.open_id || "",
    expiresIn: data.expires_in || 86400,
    scope: data.scope || "",
  };
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_key: config.tiktok.clientKey,
    client_secret: config.tiktok.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(`${OPEN}/oauth/token/`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || `TikTok token refresh failed (${res.status}) — reconnect the account`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in || 86400,
  };
}

export async function fetchUser(accessToken) {
  const p = new URLSearchParams({ fields: "open_id,display_name" });
  const res = await fetch(`${OPEN}/user/info/?${p}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error?.code !== "ok") {
    throw new Error(data.error?.message || `TikTok user info failed (${res.status})`);
  }
  const u = data.data?.user || {};
  return { openId: u.open_id || "", displayName: u.display_name || "TikTok account" };
}

/* Returns a usable access token — auto-refreshes when the ~24h token expires. */
export async function ensureFreshAccessToken(account) {
  const hour = 60 * 60 * 1000;
  const fresh = !account.expiresAt || new Date(account.expiresAt) > new Date(Date.now() + hour);
  if (fresh) return decrypt(account.accessTokenEnc);

  if (!account.refreshTokenEnc) {
    throw new Error("TikTok token expired and no refresh token was stored — reconnect the account");
  }
  const { accessToken, refreshToken, expiresIn } = await refreshAccessToken(
    decrypt(account.refreshTokenEnc)
  );
  const update = {
    accessTokenEnc: accessToken, // setter encrypts
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
  if (refreshToken !== decrypt(account.refreshTokenEnc)) {
    update.refreshTokenEnc = refreshToken; // setter encrypts
  }
  await PlatformAccount.findByIdAndUpdate(account._id, update);
  return accessToken;
}

/*
 * Stage 1 — ask TikTok to pull the video from its public URL. Returns a
 * publish_id while TikTok processes; status is polled on later worker ticks.
 * Sandbox-honest: privacy_level is FORCED to SELF_ONLY until audit (config).
 */
export async function initDirectPost({ accessToken, title, videoUrl }) {
  const res = await fetch(`${OPEN}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: config.tiktok.privacyLevel, // SELF_ONLY until audit — by design
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
    throw new Error(data.error?.message || `TikTok upload init failed (${res.status})`);
  }
  return { id: data.data?.publish_id, pending: true }; // pending → worker polls status
}

/*
 * Stage 2 — check where the accepted upload landed.
 *  SEND_TO_USER_INBOX → processed and delivered (private, per sandbox)
 *  PROCESSING         → still working, keep the claim alive
 *  FAILED / PUBLISH_FAILED → real fail_reason surfaced to the user
 */
export async function checkStatus({ accessToken, publishId }) {
  const res = await fetch(`${OPEN}/post/publish/status/fetch/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
    throw new Error(data.error?.message || `TikTok status check failed (${res.status})`);
  }
  return {
    status: data.data?.status || "PROCESSING",
    failReason: data.data?.fail_reason || "",
  };
}

/* Uniform publisher interface shared with the scheduler (worker.js). */
export function publish({ account, post }) {
  return ensureFreshAccessToken(account).then((accessToken) =>
    initDirectPost({ accessToken, title: post.title || "", videoUrl: post.videoUrl })
  );
}

/* Second-stage poll for posts that already have a publish_id. */
export function pollPending({ account, post }) {
  return ensureFreshAccessToken(account).then((accessToken) =>
    checkStatus({ accessToken, publishId: post.publishedId })
  );
}

