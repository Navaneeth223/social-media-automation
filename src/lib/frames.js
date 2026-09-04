/* The 300-frame UI video that backs the Problem section.
   Lives in public/problem-frames as 0001.jpg … 0300.jpg — a renamed copy of
   the source "ul cards" folder (1280×720 JPGs, ~5 MB total). */

export const FRAME_COUNT = 300;

export const frameSrc = (i) =>
  `${import.meta.env.BASE_URL}problem-frames/${String(i + 1).padStart(4, "0")}.jpg`;
