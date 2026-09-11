import { Router } from "express";
import crypto from "node:crypto";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { PlatformAccount } from "../models/PlatformAccount.js";
import { authorizeUrl, exchangeCode, fetchMember, isConfigured, SCOPES } from "../services/linkedin.js";

export const oauthRouter = Router();

const STATE_COOKIE = "li_oauth_state";

/* Step 1 — send the logged-in user to LinkedIn's consent screen. */
oauthRouter.get("/linkedin", requireAuth, (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error:
        "LinkedIn isn't configured on this server yet — add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to server/.env, then restart the API.",
    });
  }
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: config.isProd ? "none" : "lax",
    secure: config.isProd,
    maxAge: 10 * 60 * 1000, // CSRF state lives 10 minutes
    path: "/",
  });
  return res.redirect(302, authorizeUrl(state));
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

    const { accessToken, expiresIn, scope } = await exchangeCode(code);
    const member = await fetchMember(accessToken);

    await PlatformAccount.findOneAndUpdate(
      { user: req.user._id, platform: "linkedin" },
      {
        $set: {
          platformAccountId: `urn:li:person:${member.sub}`,
          displayName: member.name,
          email: member.email,
          accessTokenEnc: accessToken, // model setter encrypts before it hits Mongo
          scope: scope || SCOPES,
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
