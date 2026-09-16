/*
 * Post-build SEO artifacts. Runs after `vite build`:
 *   - dist/robots.txt              (absolute sitemap URL from the site config)
 *   - dist/sitemap.xml             (indexable pages only)
 *   - dist/<route>/index.html      (per-route head for every SPA route: correct
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

/* Homepage + public legal pages are indexable. Everything NOT listed here is
   either handled by the homepage's own head or is private (noindex). */
const indexableRoutes = [
  { path: "/" },
  {
    path: "/privacy",
    title: "Privacy Policy — Pulse",
    description:
      "What data Pulse collects, the exact platform permissions we request, how it is protected, and how to delete it.",
  },
  {
    path: "/terms",
    title: "Terms of Service — Pulse",
    description: "The terms that apply when you create a Pulse account and schedule content.",
  },
  {
    path: "/data-deletion",
    title: "Data Deletion — Pulse",
    description:
      "How to disconnect a platform or delete your entire Pulse account and all associated data.",
  },
];

/* Private/utility routes — noindex in meta AND an X-Robots-Tag header. */
const noindexRoutes = [
  {
    path: "/login",
    title: "Log in — Pulse",
    description:
      "Log in to your Pulse workspace to schedule and publish across 7 social platforms.",
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

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

function prerender(route, robotsContent) {
  const url = `${SITE}${route.path}`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${route.description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${route.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${route.description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${route.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${route.description}$2`);
  if (robotsContent) {
    html = html.replace(/(<meta name="robots" content=")[^"]*(")/, `$1${robotsContent}$2`);
  }
  const dir = path.join(dist, route.path.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// robots.txt — public pages and assets crawlable; the API is never public.
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`
);

// sitemap.xml — indexable pages only; URLs match canonicals.
const sitemapEntries = indexableRoutes.map((r) => `  <url><loc>${SITE}${r.path}</loc></url>`);
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join(
    "\n"
  )}\n</urlset>\n`
);

for (const route of indexableRoutes) {
  prerender(route, route.path === "/" ? null : "index, follow");
}
for (const route of noindexRoutes) {
  prerender(route, "noindex, nofollow");
}

console.log(`SEO artifacts built for ${SITE}:`);
console.log("  robots.txt · sitemap.xml (" + indexableRoutes.length + " indexable) · " + noindexRoutes.map((r) => r.path).join(" ") + " (noindex)");
