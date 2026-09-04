import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { PRODUCT } from "../lib/config";
import { scrollToId } from "../lib/motion";

const LINKS = [
  { label: "Product", id: "product" },
  { label: "Platforms", id: "platforms" },
  { label: "Workflow", id: "workflow" },
  { label: "Pricing", id: "pricing" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const go = (id) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      {/* Mobile overlay lives OUTSIDE the blend so it stays pure ink. */}
      {open && (
        <div className="fixed inset-0 z-[64] flex flex-col justify-center gap-1 bg-ink/95 px-8 backdrop-blur-sm md:hidden">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="py-3 text-left font-display text-4xl font-semibold text-paper"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => navigate("/signup")}
            className="mt-8 w-max rounded-full bg-acid px-6 py-3 text-sm font-semibold text-ink"
          >
            Start free
          </button>
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-[65] mix-blend-difference">
        <nav className="flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
          <button
            onClick={() => go("top")}
            className="flex items-baseline gap-1 text-paper"
            aria-label={`${PRODUCT.name} — back to top`}
          >
            <span className="font-display text-xl font-semibold tracking-tight">{PRODUCT.name}</span>
            <span className="h-2 w-2 rounded-full bg-paper" aria-hidden="true" />
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="text-[13px] font-medium tracking-wide text-paper/70 transition-colors hover:text-paper"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => navigate("/signup")}
              className="group flex items-center gap-1.5 rounded-full border border-paper/30 px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-paper hover:text-black"
            >
              Start free
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </button>
          </div>

          <button
            className="text-paper md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>
    </>
  );
}
