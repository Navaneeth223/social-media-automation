import { decrypt } from "./crypto.js";
import { config } from "../config.js";

/*
 * LinkedIn — the Phase 2 platform, fully live for the authenticated user's
 * own profile (w_member_social; no app review needed on the free tier).
 *
 * Hand-rolled OAuth 2.0 authorization-code flow (no Passport) — we already
 * own cookie/session handling, so this keeps dependencies at zero and every
 * step inspectable.
 */

const API = "https://api.linkedin.com";
export const SCOPES = "openid profile email w_member_social";
export const LINKEDIN_VERSION = "202405";

export const isConfigured = () =>
  Boolean(config.linkedin.clientId && config.linkedin.clientSecret);

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.redirectUri,
    state,
    scope: SCOPES,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${p}`;
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.linkedin.redirectUri,
    client_id: config.linkedin.clientId,
    client_secret: config.linkedin.clientSecret,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `LinkedIn token exchange failed (${res.status})`);
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in, scope: data.scope };
}

export async function fetchMember(accessToken) {
  const res = await fetch(`${API}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `LinkedIn profile fetch failed (${res.status})`);
  return { sub: data.sub, name: data.name || "LinkedIn member", email: data.email || "" };
}

/*
 * Publishes a text post to the member's own feed.
 * `accessTokenEnc` arrives encrypted from the DB and is decrypted here only,
 * in memory, for the single upstream request.
 */
export async function publishPost({ accessTokenEnc, memberUrn, text }) {
  const res = await fetch(`${API}/rest/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${decrypt(accessTokenEnc)}`,
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      author: memberUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface LinkedIn's REAL error text to the user — never a fake success.
    throw new Error(data.message || `LinkedIn publish failed (${res.status})`);
  }
  return { id: data.id };
}

/* Uniform publisher interface shared with the scheduler (worker.js). */
export function publish({ account, post }) {
  return publishPost({
    accessTokenEnc: account.accessTokenEnc,
    memberUrn: account.platformAccountId,
    text: post.text,
  });
}
