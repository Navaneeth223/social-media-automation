import { decrypt } from "./crypto.js";
import { config } from "../config.js";
import { PlatformAccount } from "../models/PlatformAccount.js";

/*
 * YouTube — Phase 3, fully live via the free Data API v3.
 *  - OAuth 2.0 with OFFLINE access: Google access tokens expire in ~1h, so we
 *    store the refresh token (encrypted) and auto-refresh before publishing.
 *  - Uploads use the resumable session protocol: the video is streamed
 *    straight from its public URL to Google — nothing buffered in memory.
 *  - Honest constraint: uploads from UNVERIFIED API projects are locked to
 *    "private" by YouTube — the UI says so, and privacyStatus is stored so a
 *    verified project can publish publicly with no code change.
 */

const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const UPLOAD = "https://www.googleapis.com/upload/youtube/v3/videos";
export const GOOGLE_SCOPES =
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";

const MAX_VIDEO_BYTES = 256 * 1024 * 1024; // Cloudinary free tier is 100MB anyway

export const isConfigured = () =>
  Boolean(config.google.clientId && config.google.clientSecret);

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    state,
    scope: GOOGLE_SCOPES,
    access_type: "offline", // we need a refresh token for scheduled uploads
    prompt: "consent",
  });
  return `${AUTH}?${p}`;
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.google.redirectUri,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
  });
  const res = await fetch(TOKEN, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `Google token exchange failed (${res.status})`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 3599,
    scope: data.scope || "",
  };
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
  });
  const res = await fetch(TOKEN, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || `YouTube token refresh failed (${res.status}) — reconnect the channel`);
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in || 3599 };
}

export async function fetchChannel(accessToken) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `YouTube channel fetch failed (${res.status})`);
  const item = data.items?.[0];
  return { id: item?.id || "", title: item?.snippet?.title || "YouTube channel" };
}

/*
 * Returns a usable access token, refreshing + persisting when expired.
 * Runs right before any publish so scheduled uploads work days later.
 */
export async function ensureFreshAccessToken(account) {
  const notExpired =
    !account.expiresAt || new Date(account.expiresAt) > new Date(Date.now() + 60 * 1000);
  if (notExpired) return decrypt(account.accessTokenEnc);

  if (!account.refreshTokenEnc) {
    throw new Error("YouTube token expired and no refresh token was stored — reconnect the channel");
  }
  const { accessToken, expiresIn } = await refreshAccessToken(decrypt(account.refreshTokenEnc));
  await PlatformAccount.findByIdAndUpdate(account._id, {
    accessTokenEnc: accessToken, // setter encrypts
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  });
  return accessToken;
}

/* Streams the video from its public URL straight into a resumable upload. */
async function resumableUpload({ accessToken, videoUrl, title, description, privacyStatus }) {
  const src = await fetch(videoUrl, { headers: { Range: "bytes=0-" } });
  if (!src.ok && src.status !== 206) {
    throw new Error(`Can't fetch the video from that URL (HTTP ${src.status})`);
  }
  const size = Number(src.headers.get("content-length"));
  if (!size) throw new Error("The video URL didn't report its size (content-length missing)");
  if (size > MAX_VIDEO_BYTES) {
    throw new Error(
      `Video is ${(size / 1024 / 1024).toFixed(0)}MB — over the ${MAX_VIDEO_BYTES / 1024 / 1024}MB limit for this phase`
    );
  }
  const type = src.headers.get("content-type") || "video/mp4";

  // 1) open a resumable session
  const init = await fetch(`${UPLOAD}?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(size),
      "X-Upload-Content-Type": type,
    },
    body: JSON.stringify({
      snippet: { title, description, categoryId: "22" },
      status: { privacyStatus, selfDeclaredMadeForKids: false },
    }),
  });
  if (!init.ok) {
    const d = await init.json().catch(() => ({}));
    throw new Error(d.error?.message || `YouTube upload session failed (${init.status})`);
  }
  const sessionUrl = init.headers.get("location");
  if (!sessionUrl) throw new Error("YouTube didn't return an upload session URL");

  // 2) stream the bytes up
  const up = await fetch(sessionUrl, {
    method: "PUT",
    headers: { "Content-Length": String(size), "Content-Type": type },
    body: src.body,
    duplex: "half",
  });
  const data = await up.json().catch(() => ({}));
  if (!up.ok) {
    throw new Error(data.error?.message || `YouTube upload failed (${up.status})`);
  }
  return { id: data.id };
}

/* Uniform publisher interface shared with the scheduler (worker.js). */
export function publish({ account, post }) {
  return ensureFreshAccessToken(account).then((accessToken) =>
    resumableUpload({
      accessToken,
      videoUrl: post.videoUrl,
      title: post.title,
      description: post.description,
      privacyStatus: post.privacyStatus,
    })
  );
}

