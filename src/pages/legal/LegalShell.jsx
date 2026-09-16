import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "../lib/seo";
import { PRODUCT, SUPPORT_EMAIL } from "../lib/site";

export const LAST_UPDATED = "September 14, 2026";

/* Shared layout for the legal pages: plain, static, high-contrast, no scroll
   animation — Meta/TikTok reviewers and search crawlers read these. */
export function LegalShell({ title, description, path, updated, children }) {
  useSEO({ title, description, path });

  return (
    <div className="min-h-svh bg-ink text-paper">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <Link
          to="/"
          className="flex w-max items-baseline gap-1 font-display text-xl font-semibold tracking-tight"
        >
          {PRODUCT.name}
          <span className="text-acid">.</span>
        </Link>

        <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-mute">
          Last updated: {updated}
        </p>

        <div className="legal-prose mt-10 space-y-8">{children}</div>

        <div className="mt-14 border-t border-line pt-6">
          <Link
            to="/"
            className="flex w-max items-center gap-2 text-sm text-mute transition-colors hover:text-paper"
          >
            <ArrowLeft size={14} /> Back to {PRODUCT.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-paper">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function P({ children }) {
  return <p className="text-[15px] leading-relaxed text-paper/90">{children}</p>;
}

export function L({ children }) {
  // internal link
  return <Link className="text-acid underline decoration-line underline-offset-4 hover:decoration-acid">{children}</Link>;
}

export function Mail({ email = SUPPORT_EMAIL }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-acid underline decoration-line underline-offset-4 hover:decoration-acid"
    >
      {email}
    </a>
  );
}

export function Li({ children }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-paper/90">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acid" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}
