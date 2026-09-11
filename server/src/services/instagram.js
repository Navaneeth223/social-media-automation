import { decrypt } from "./crypto.js";
import { config } from "../config.js";
import { PlatformAccount } from "../models/PlatformAccount.js";

/*
 * Instagram — Phase 4, sandbox-honest via "Instagram API with Instagram Login".
 *
 *  - Free, no app review needed — but in Development mode it ONLY works for
 *    Instagram PROFESSIONAL accounts added as Testers in your Meta app.
 *    The UI says exactly that; arbitrary third-party users need Meta App Review.
 *  - Container-based publish: create media container → wait for Meta to finish
 *    processing → publish the container. Media must come from a PUBLIC https
 *    URL (Cloudinary free tier).
 *  - Tokens: short-lived on connect → exchanged for a 60-day long-lived token
 *    (encrypted at rest) and auto-refreshed before it expires.
 */

const GRAPH = "https://graph.instagram.com/v23.0";
const TOKEN_URL = "https://graph.instagram.com/oauth/access_token";
const LONG_LIVED_URL = "https://graph.instagram.com/access_token";
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";

// comma-separated in the Instagram authorize URL
export const IG_SCOPES = "instagram_business_basic,instagram_business_content_publish";

const CONTAINER_POLL_MS = 5000;
const CONTAINER_TIMEOUT_MS = 5 * 60 * 1000;

export const isConfigured = () =>
  Boolean(config.instagram.clientId && config.instagram.clientSecret);

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    client_id: config.instagram.clientId,
    redirect_uri: config.instagram.redirectUri,
    response_type: "code",
    scope: IG_SCOPES,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: config.instagram.clientId,
    client_secret: config.instagram.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: config.instagram.redirectUri,
    code,
  });
  const res = await fetch(TOKEN_URL, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_message || `Instagram token exchange failed (${res.status})`);
  }
  return { accessToken: data.access_token }; // short-lived (~1h)
}

export async function exchangeLongLived(shortToken) {
  const p = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: config.instagram.clientSecret,
    access_token: shortToken,
  });
  const res = await fetch(`${LONG_LIVED_URL}?${p}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `Instagram long-lived exchange failed (${res.status})`);
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in || 60 * 24 * 3600 }; // ~60 days
}

export async function refreshLongLived(longToken) {
  const p = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: longToken });
  const res = await fetch(`${REFRESH_URL}?${p}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `Instagram token refresh failed (${res.status}) — reconnect the account`);
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in || 60 * 24 * 3600 };
}

export async function fetchAccount(accessToken) {
  const p = new URLSearchParams({
    fields: "user_id,username,account_type",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH}/me?${p}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Instagram profile fetch failed (${res.status})`);
  return { userId: data.user_id, username: data.username || "Instagram account", accountType: data.account_type || "" };
}

/*
 * Returns a usable access token — auto-refreshes the 60-day long-lived token
 * a day before expiry, so scheduled media never dies with the token.
 */
export async function ensureFreshAccessToken(account) {
  const day = 24 * 60 * 60 * 1000;
  const fresh = !account.expiresAt || new Date(account.expiresAt) > new Date(Date.now() + day);
  if (fresh) return decrypt(account.accessTokenEnc);

  const { accessToken, expiresIn } = await refreshLongLived(decrypt(account.accessTokenEnc));
  await PlatformAccount.findByIdAndUpdate(account._id, {
    accessTokenEnc: accessToken, // setter encrypts
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  });
  return accessToken;
}

/* Waits for Meta to finish processing the container (REELS can take minutes). */
async function waitForContainer(containerId, accessToken) {
  const deadline = Date.now() + CONTAINER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const p = new URLSearchParams({ fields: "status_code", access_token: accessToken });
    const res = await fetch(`${GRAPH}/${containerId}?${p}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || `Container status failed (${res.status})`);
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(`Media container ${data.status_code} — check the media URL and try again`);
    }
    await new Promise((r) => setTimeout(r, CONTAINER_POLL_MS));
  }
  throw new Error("Meta didn't finish processing the media in 5 minutes — try again shortly");
}

/* Uniform publisher interface shared with the scheduler (worker.js). */
export function publish({ account, post }) {
  return ensureFreshAccessToken(account).then(async (accessToken) => {
    const caption = post.text || "";

    // 1) create the media container — media must be publicly reachable
    const container = post.videoUrl
      ? { media_type: "REELS", video_url: post.videoUrl, caption, share_to_feed: "true" }
      : { image_url: post.imageUrl, caption };
    const cRes = await fetch(`${GRAPH}/me/media`, {
      method: "POST",
      body: new URLSearchParams({ ...container, access_token: accessToken }),
    });
    const cData = await cRes.json().catch(() => ({}));
    if (!cRes.ok) {
      throw new Error(cData.error?.message || `Instagram container failed (${cRes.status})`);
    }

    // 2) wait for Meta to process it
    await waitForContainer(cData.id, accessToken);

    // 3) publish the container to the feed
    const pRes = await fetch(`${GRAPH}/me/media_publish`, {
      method: "POST",
      body: new URLSearchParams({ creation_id: cData.id, access_token: accessToken }),
    });
    const pData = await pRes.json().catch(() => ({}));
    if (!pRes.ok) {
      throw new Error(pData.error?.message || `Instagram publish failed (${pRes.status})`);
    }
    return { id: pData.id };
  });
}

