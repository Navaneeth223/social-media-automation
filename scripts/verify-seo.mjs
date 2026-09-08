/*
 * Production share-preview / SEO QA. Run after every deploy:
 *
 *   node scripts/verify-seo.mjs [baseUrl]
 *   (defaults to VITE_SITE_URL from .env, or the vercel.app URL)
 *
 * Checks the ACTUAL served HTML + assets — the same thing an external
 * crawler or social-card scraper receives. Exits non-zero on any failure.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let base = process.argv[2];
if (!base) {
  const envFile = path.join(root, ".env");
  if (fs.existsSync(envFile)) {
    const m = fs.readFileSync(envFile, "utf8").match(/^\s*VITE_SITE_URL\s*=\s*(\S+)\s*$/m);
    if (m) base = m[1];
  }
}
base = (base || "https://social-media-automation-jet.vercel.app").replace(/\/+$/, "");

const get = async (p) => {
  const res = await fetch(base + p, { redirect: "manual" });
  const buf = res.status === 200 ? Buffer.from(await res.arrayBuffer()) : null;
  return { status: res.status, type: res.headers.get("content-type") || "", buf };
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

console.log(`Verifying ${base}\n`);

// 1) Homepage head — what crawlers and social scrapers actually receive.
const home = await get("/");
check("GET /", home.status === 200, `status ${home.status}`);
const html = home.buf ? home.buf.toString("utf8") : "";
const meta = (attr, key) => {
  const m = html.match(new RegExp(`${attr}="${key}"[^>]*content="([^"]*)"`));
  return m ? m[1] : null;
};
const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || null;

check("title", !!title && title.includes("AI-Powered Social Media Automation"), title || "missing");
check(
  "meta description",
  (meta("name", "description") || "").includes("Draft once, post everywhere"),
  (meta("name", "description") || "").slice(0, 60) + "…"
);
check("canonical", meta("name", "canonical") || html.match(/rel="canonical" href="([^"]*)"/)?.[1] === `${base}/`, html.match(/rel="canonical" href="([^"]*)"/)?.[1] || "missing");
for (const [tag, expect] of [
  ["og:type", "website"],
  ["og:site_name", "Pulse"],
  ["og:url", `${base}/`],
  ["og:image", `${base}/og-image.png`],
  ["og:image:width", "1200"],
  ["og:image:height", "630"],
  ["twitter:card", "summary_large_image"],
  ["twitter:image", `${base}/og-image.png`],
]) {
  const v = meta("property", tag) || meta("name", tag);
  check(tag, v === expect, v || "missing");
}
check("og:image:alt", !!meta("property", "og:image:alt"));
check("twitter:image:alt", !!meta("name", "twitter:image:alt"));
check("JSON-LD present", html.includes("application/ld+json"));
check(
  "JSON-LD types",
  ["Organization", "WebSite", "SoftwareApplication"].every((t) => html.includes(`"@type": "${t}"`))
);

// 2) OG image — public, PNG, 1200x630.
const og = await get("/og-image.png");
check("GET /og-image.png", og.status === 200, `status ${og.status}`);
check("og-image content-type", og.type.startsWith("image/png"), og.type);
if (og.buf) {
  const w = og.buf.readUInt32BE(16);
  const h = og.buf.readUInt32BE(20);
  check("og-image dimensions 1200x630", w === 1200 && h === 630, `${w}x${h}`);
  check("og-image size < 300KB", og.buf.length < 300 * 1024, `${Math.round(og.buf.length / 1024)}KB`);
}

// 3) robots.txt + sitemap.xml.
const robots = await get("/robots.txt");
const robotsTxt = robots.buf ? robots.buf.toString("utf8") : "";
check("GET /robots.txt", robots.status === 200);
check("robots.txt sitemap line", robotsTxt.includes(`Sitemap: ${base}/sitemap.xml`));
check("robots.txt allows public pages", robotsTxt.includes("Allow: /"));

const sitemap = await get("/sitemap.xml");
const sitemapXml = sitemap.buf ? sitemap.buf.toString("utf8") : "";
check("GET /sitemap.xml", sitemap.status === 200);
check("sitemap lists homepage", sitemapXml.includes(`<loc>${base}/</loc>`));
check("sitemap excludes private pages", !sitemapXml.includes("/app") && !sitemapXml.includes("/login"));

// 4) Private routes — noindex in the initial HTML.
for (const p of ["/login", "/signup", "/app"]) {
  const r = await get(p);
  const body = r.buf ? r.buf.toString("utf8") : "";
  check(
    `GET ${p} noindex`,
    r.status === 200 && body.includes('content="noindex, nofollow"'),
    `status ${r.status}`
  );
}

console.log(
  failures ? `\n${failures} check(s) failed — fix before sharing the link.` : "\nAll production SEO checks passed."
);
process.exit(failures ? 1 : 0);
