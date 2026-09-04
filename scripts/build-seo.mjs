/*
 * Post-build SEO artifacts. Runs after `vite build`:
 *   - dist/robots.txt              (absolute sitemap URL from the site config)
 *   - dist/sitemap.xml             (indexable pages only)
 *   - dist/<route>/index.html      (per-route head for the SPA routes: correct
 *                                  title/description/canonical/robots in the
 *                                  initial HTML — crawlers & social cards)
 *
 * Public site URL: VITE_SITE_URL (Vercel env var, or the committed .env).
 * A future custom domain = change that one value, rebuild, redeploy.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const stripSlash = (u) => u.replace(/\/+$/, "");

function resolveSiteUrl() {
  if (process.env.VITE_SITE_URL) return stripSlash(process.env.VITE_SITE_URL);
  const envFile = path.join(root, ".env");
  if (fs.existsSync(envFile)) {
    const m = fs.readFileSync(envFile, "utf8").match(/^\s*VITE_SITE_URL\s*=\s*(\S+)\s*$/m);
    if (m) return stripSlash(m[1]);
  }
  return "https://social-media-automation-jet.vercel.app";
}

const SITE = resolveSiteUrl();

/* Everything NOT listed here is either the homepage (already correct in the
   bundle's index.html) or private/noindex. Auth + dashboard pages ship with
   noindex in both meta AND an X-Robots-Tag header (see vercel.json). */
const noindexRoutes = [
  {
    path: "/login",
    title: "Log in — Pulse",
    description: "Log in to your Pulse workspace to schedule and publish across 7 social platforms.",
  },
  {
    path: "/signup",
    title: "Start your free trial — Pulse",
    description:
      "Create your Pulse account — schedule and publish to 7 social platforms. 14-day trial, no credit card.",
  },
  {
    path: "/app",
    title: "Pulse — Dashboard",
    description: "Your private Pulse workspace.",
  },
];

if (!fs.existsSync(dist)) {
  console.error("dist/ not found — run `vite build` first.");
  process.exit(1);
}

// robots.txt — public pages and assets crawlable; the API is never public.
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`
);

// sitemap.xml — only pages intended for indexing; URLs match canonicals.
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc></url>\n</urlset>\n`
);

// Per-route initial HTML for the private/utility routes.
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
for (const route of noindexRoutes) {
  const url = `${SITE}${route.path}`;
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${route.description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="robots" content=")[^"]*(")/, `$1noindex, nofollow$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${route.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${route.description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${route.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${route.description}$2`);
  const dir = path.join(dist, route.path.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

console.log(`SEO artifacts built for ${SITE}:`);
console.log("  robots.txt · sitemap.xml · " + noindexRoutes.map((r) => r.path).join(" ") + " (noindex)");
