import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FRAME_COUNT, frameSrc } from "../lib/frames";
import { DESKTOP, REDUCE } from "../lib/motion";

const isLoaded = (s, i) =>
  i >= 0 && i < FRAME_COUNT && s.frames[i]?.complete && s.frames[i]?.naturalWidth > 0;

/*
 * Apple-style scroll-driven image sequence: 300 frames of the product UI
 * painted to a <canvas>. Problem.jsx scrubs draw(i) inside its pinned
 * timeline, so frames map 1:1 to the scroll range.
 *  - Mobile / prefers-reduced-motion → one static mid-video frame
 *  - Preloads in idle time; scrubbing always draws the nearest LOADED frame,
 *    so scrolling never waits on the network.
 */
const ProblemSequence = forwardRef(function ProblemSequence(_props, ref) {
  const canvasRef = useRef(null);
  const state = useRef({ frames: [], ctx: null, current: -1 });

  function draw(index) {
    const s = state.current;
    const canvas = canvasRef.current;
    if (!canvas || !s.ctx || s.frames.length === 0) return;

    let target = Math.max(0, Math.min(FRAME_COUNT - 1, index));
    if (!isLoaded(s, target)) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (isLoaded(s, target - d)) {
          target -= d;
          break;
        }
        if (isLoaded(s, target + d)) {
          target += d;
          break;
        }
      }
    }
    if (target === s.current) return;
    const img = s.frames[target];
    if (!img || !img.naturalWidth) return;
    s.current = target;

    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    s.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function fit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
      state.current.current = -1; // force a repaint at the new size
    }
  }

  useImperativeHandle(ref, () => ({ draw }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = state.current;
    s.ctx = canvas.getContext("2d");
    fit();

    const scrubbed =
      window.matchMedia(DESKTOP).matches && !window.matchMedia(REDUCE).matches;
    const fallbackIndex = Math.floor(FRAME_COUNT * 0.55); // representative mid-video frame

    const imgs = Array.from({ length: FRAME_COUNT }, () => {
      const img = new Image();
      img.decoding = "async";
      return img;
    });
    s.frames = imgs;

    const onLoaded = () => {
      if (s.current === -1) draw(scrubbed ? 0 : fallbackIndex);
    };

    // Start fetching once the browser is idle — hero assets go first.
    let idleId;
    let cancelIdle = () => {};
    const start = () => {
      imgs.forEach((img, i) => {
        img.src = frameSrc(i);
        img.addEventListener("load", onLoaded, { once: true });
      });
    };
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 1500 });
      cancelIdle = () => window.cancelIdleCallback(idleId);
    } else {
      idleId = setTimeout(start, 600);
      cancelIdle = () => clearTimeout(idleId);
    }

    const onResize = () => {
      fit();
      draw(s.current === -1 ? (scrubbed ? 0 : fallbackIndex) : s.current);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelIdle();
      imgs.forEach((img) => img.removeEventListener("load", onLoaded));
      window.removeEventListener("resize", onResize);
      s.frames = [];
      s.current = -1;
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
});

export default ProblemSequence;
