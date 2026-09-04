import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase, ScrollSmoother);

/*
 * The one easing system everything shares.
 *  - EASE_OUT   → entrances (page load, scroll-into-view reveals)
 *  - EASE_INOUT → scrubbed state changes (pinned reveals, card deals)
 *  - "none"     → scroll-scrubbed positions (horizontal track, progress fill)
 */
export const EASE_OUT = CustomEase.create("pulse-out", "0.16, 1, 0.3, 1");
export const EASE_INOUT = CustomEase.create("pulse-inout", "0.83, 0, 0.17, 1");

export const STAGGER = { chars: 0.016, ui: 0.09 };

export const DESKTOP = "(min-width: 768px)";
export const REDUCE = "(prefers-reduced-motion: reduce)";

export const fmt = (n, decimals = 0) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/*
 * Every section runs its animations through this hook:
 *  - gsap.matchMedia() reverts everything on unmount (StrictMode-safe),
 *  - `reduce`  → setup returns early; the markup's resting state IS the
 *                static fallback, so nothing looks broken without motion,
 *  - `desktop` → branch point for pinning (never pin below 768px).
 * Setup may return a cleanup function (e.g. () => ctx.revert()).
 */
export function useGsapAnim(ref, setup) {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ desktop: DESKTOP, reduce: REDUCE }, (ctx) => {
      const cleanup = setup({
        desktop: ctx.conditions.desktop,
        reduce: ctx.conditions.reduce,
        scope: ref.current,
      });
      return typeof cleanup === "function" ? cleanup : undefined;
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(el, true, "top top");
  else
    el.scrollIntoView({
      behavior: window.matchMedia(REDUCE).matches ? "auto" : "smooth",
    });
}
