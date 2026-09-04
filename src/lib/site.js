/*
 * Single source of truth for the public site identity.
 *
 * VITE_SITE_URL lives in the committed .env (and can be overridden as a
 * Vercel environment variable). When the custom domain arrives, change that
 * one value and rebuild — canonical, og:url, og:image, twitter:image,
 * sitemap, robots and JSON-LD all derive from it.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://social-media-automation-jet.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Pulse";

export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
