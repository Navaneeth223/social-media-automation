import { Router } from "express";
import crypto from "node:crypto";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { PlatformAccount } from "../models/PlatformAccount.js";
import { authorizeUrl as linkedinAuthorize, exchangeCode as linkedinExchange, fetchMember, isConfigured as linkedinConfigured, SCOPES as LINKEDIN_SCOPES } from "../services/linkedin.js";
import {
  authorizeUrl as youtubeAuthorize,
  exchangeCode as youtubeExchange,
  fetchChannel,
  isConfigured as youtubeConfigured,
  GOOGLE_SCOPES,
} from "../services/youtube.js";

import {
  authorizeUrl as instagramAuthorize,
  exchangeCode as instagramExchange,
  exchangeLongLived,
  fetchAccount as fetchInstagramAccount,
  isConfigured as instagramConfigured,
  IG_SCOPES,
} from "../services/instagram.js";

export const oauthRouter = Router();

const STATE_COOKIE = "li_oauth_state";
const YT_STATE_COOKIE = "yt_oauth_state";
const IG_STATE_COOKIE = "ig_oauth_state";

function openState(res, cookieName) {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(cookieName, state, {
    httpOnly: true,
    sameSite: config.isProd ? "none" : "lax",
    secure: config.isProd,
    maxAge: 10 * 60 * 1000, // CSRF state lives 10 minutes
    path: "/",
  });
  return state;
}

/* Step 1 — send the logged-in user to LinkedIn's consent screen. */
oauthRouter.get("/linkedin", requireAuth, (req, res) => {
  if (!linkedinConfigured()) {
    return res.status(503).json({
      error:
        "LinkedIn isn't configured on this server yet — add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to server/.env, then restart the API.",
    });
  }
  return res.redirect(302, linkedinAuthorize(openState(res, STATE_COOKIE)));
});

/* Step 2 — exchange the code, encrypt the token, store the connection. */
oauthRouter.get("/linkedin/callback", requireAuth, async (req, res, next) => {
  try {
    const fail = (msg) => res.redirect(302, `/app?connected=linkedin&error=${encodeURIComponent(msg)}`);

    const { code, state, error, error_description: errorDescription } = req.query;
    if (error) return fail(errorDescription || error);
    const savedState = req.cookies?.[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { path: "/" });
    if (!code || !state || !savedState || state !== savedState) {
      return fail("LinkedIn connect failed — state mismatch. Try again.");
    }

    const { accessToken, expiresIn, scope } = await linkedinExchange(code);
    const member = await fetchMember(accessToken);

    await PlatformAccount.findOneAndUpdate(
      { user: req.user._id, platform: "linkedin" },
      {
        $set: {
          platformAccountId: `urn:li:person:${member.sub}`,
          displayName: member.name,
          email: member.email,
          accessTokenEnc: accessToken, // model setter encrypts before it hits Mongo
          scope: scope || LINKEDIN_SCOPES,
          connectedAt: new Date(),
        },
      },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );

    return res.redirect(302, "/app?connected=linkedin");
  } catch (e) {
    return next(e);
  }
});

/* ——— YouTube (Phase 3) — same pipeline, Google OAuth with offline access ——— */

oauthRouter.get("/youtube", requireAuth, (req, res) => {
  if (!youtubeConfigured()) {
    return res.status(503).json({
      error:
        "YouTube isn't configured on this server yet — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env, then restart the API.",
    });
  }
  return res.redirect(302, youtubeAuthorize(openState(res, YT_STATE_COOKIE)));
});

oauthRouter.get("/youtube/callback", requireAuth, async (req, res, next) => {
  try {
    const fail = (msg) => res.redirect(302, `/app?connected=youtube&error=${encodeURIComponent(msg)}`);

    const { code, state, error, error_description: errorDescription } = req.query;
    if (error) return fail(errorDescription || error);
    const savedState = req.cookies?.[YT_STATE_COOKIE];
    res.clearCookie(YT_STATE_COOKIE, { path: "/" });
    if (!code || !state || !savedState || state !== savedState) {
      return fail("YouTube connect failed — state mismatch. Try again.");
    }

    const { accessToken, refreshToken, expiresIn, scope } = await youtubeExchange(code);
    const channel = await fetchChannel(accessToken);

    await PlatformAccount.findOneAndUpdate(
      { user: req.user._id, platform: "youtube" },
      {
        $set: {
          platformAccountId: channel.id,
          displayName: channel.title,
          accessTokenEnc: accessToken, // setter encrypts
          // The refresh token is what keeps scheduled uploads alive after the
          // ~1h access token dies. Encrypt + persist it whenever Google grants one.
          ...(refreshToken ? { refreshTokenEnc: refreshToken } : {}),
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          scope: scope || GOOGLE_SCOPES,
          connectedAt: new Date(),
        },
      },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );

    return res.redirect(302, "/app?connected=youtube");
  } catch (e) {
    return next(e);
  }
});

