import { useEffect } from "react";
import { SITE_URL } from "./site";

/*
 * Client-side per-route metadata for the SPA. The initial HTML already ships
 * complete, correct metadata for every route (see scripts/build-seo.mjs);
 * this hook keeps the document head in sync when the client navigates, so
 * browser tabs, JS-rendering crawlers and history state always match.
 */
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO({ title, description, path = "/", noindex = false }) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:url", url);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }, [title, description, path, noindex]);
}
