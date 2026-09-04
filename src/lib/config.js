import { Instagram, Music2, Twitter, Linkedin, Youtube, Facebook, AtSign } from "lucide-react";

export const PRODUCT = {
  name: "Pulse",
  domain: "app.pulse.social",
};

/*
 * Order matters: the first five drive the Platform Showcase,
 * all seven feed the marquee. Swap or reorder here and both follow.
 */
export const PLATFORMS = [
  { name: "Instagram", Icon: Instagram, note: "Grid-perfect scheduling with auto alt-text." },
  { name: "TikTok", Icon: Music2, note: "Vertical video, published at your audience's peak." },
  { name: "X", Icon: Twitter, note: "Threads that thread themselves." },
  { name: "LinkedIn", Icon: Linkedin, note: "Turn posts into pipeline with UTM-perfect links." },
  { name: "YouTube", Icon: Youtube, note: "Premiere-ready uploads and community posts." },
  { name: "Facebook", Icon: Facebook, note: "Pages and groups fed from the same queue." },
  { name: "Threads", Icon: AtSign, note: "Ride the conversation while it's hot." },
];
