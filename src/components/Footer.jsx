import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { PRODUCT } from "../lib/config";

const COLS = [
  { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Status"] },
];

const SOCIALS = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Twitter, label: "X (Twitter)" },
  { Icon: Linkedin, label: "LinkedIn" },
  { Icon: Youtube, label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">
            {PRODUCT.name}
            <span className="text-acid">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">
            Post everywhere. Once. Made for people who hate tab-switching.
          </p>
          <div className="mt-6 flex gap-2.5">
            {SOCIALS.map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-mute transition-colors hover:border-acid/60 hover:text-acid"
              >
                <Icon size={15} strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-mute">
                {c.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-paper/70 transition-colors hover:text-paper">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-line pt-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
        <p>© 2026 {PRODUCT.name} Labs, Inc. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-acid" /> All systems posting.
        </p>
      </div>
    </footer>
  );
}
