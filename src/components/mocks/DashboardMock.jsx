import {
  AtSign,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Plus,
  Search,
  Settings,
  Sparkles,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import { PRODUCT } from "../../lib/config";

const NAV = [
  { Icon: CalendarDays, label: "Calendar", active: true },
  { Icon: BarChart3, label: "Analytics" },
  { Icon: Sparkles, label: "AI Studio" },
  { Icon: Users, label: "Team" },
  { Icon: Settings, label: "Settings" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = 2;

const CHIPS = [
  [{ Icon: Instagram, t: "9:00" }, { Icon: Linkedin, t: "17:30" }],
  [{ Icon: Music2, t: "12:30" }],
  [{ Icon: Twitter, t: "8:15" }],
  [{ Icon: AtSign, t: "18:45" }, { Icon: Instagram, t: "20:00" }],
  [{ Icon: Youtube, t: "16:00" }],
  [],
  [],
];

const SPARK = [34, 48, 40, 62, 55, 78, 70];

function Chip({ Icon, t, today }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-medium ${
        today ? "border-acid/50 bg-acid/10 text-acid" : "border-line bg-soot text-paper/80"
      }`}
    >
      <Icon size={10} strokeWidth={2} />
      {t}
    </span>
  );
}

/* Believable product UI — no abstract illustration standing in for the app. */
export default function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-coal text-left shadow-[0_60px_140px_-40px_rgba(0,0,0,0.85)]">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-acid/70" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-soot px-3 py-1 text-[10px] text-mute">
          <Globe size={10} /> {PRODUCT.domain}
        </div>
        <span className="w-10" />
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col justify-between border-r border-line p-3 md:flex">
          <div>
            <p className="px-2 pb-3 font-display text-base font-semibold">
              Pulse<span className="text-acid">.</span>
            </p>
            <nav className="flex flex-col gap-0.5">
              {NAV.map(({ Icon, label, active }) => (
                <span
                  key={label}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${
                    active ? "bg-soot font-medium text-paper" : "text-mute"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} /> {label}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-soot p-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-acid font-display text-[9px] font-semibold text-ink">
              LW
            </span>
            <span className="flex-1 text-[11px] font-medium">Loopwear</span>
            <ChevronDown size={12} className="text-mute" />
          </div>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Wednesday, Sep 9</p>
              <p className="mt-0.5 text-sm font-medium md:text-base">Welcome back, Maya</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-soot px-3 py-1.5 text-[11px] text-mute sm:flex">
                <Search size={11} /> Search posts
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-mute">
                <Bell size={12} />
              </span>
              <span className="flex items-center gap-1 rounded-full bg-acid px-3 py-1.5 text-[11px] font-semibold text-ink">
                <Plus size={12} strokeWidth={2.5} /> New post
              </span>
            </div>
          </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
              {/* calendar */}
              <div className="rounded-xl border border-line p-3">
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d, i) => (
                    <p
                      key={d}
                      className={`pb-1.5 text-center text-[9px] font-medium uppercase tracking-[0.15em] ${
                        i === TODAY ? "text-acid" : "text-mute"
                      }`}
                    >
                      {d}
                    </p>
                  ))}
                  {CHIPS.map((chips, i) => (
                    <div
                      key={i}
                      className={`flex min-h-[72px] flex-col gap-1 rounded-lg border p-1.5 sm:min-h-[96px] ${
                        i === TODAY ? "border-acid/40 bg-acid/[0.04]" : "border-line/70 bg-soot/40"
                      }`}
                    >
                      {chips.map((c, j) => (
                        <Chip key={j} {...c} today={i === TODAY} />
                      ))}
                      {i === TODAY && (
                        <span className="mt-auto text-[8px] uppercase tracking-widest text-acid/70">
                          Today
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* right rail */}
              <div className="hidden flex-col gap-3 lg:flex">
                <div className="rounded-xl border border-line p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-mute">
                    <Clock size={11} className="text-acid" /> Best time today
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    6:40 <span className="text-sm text-mute">PM</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-mute">Instagram · +32% vs avg</p>
                  <div className="mt-3 flex h-8 items-end gap-1">
                    {SPARK.map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-full rounded-sm ${i === 5 ? "bg-acid" : "bg-line"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-line p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-mute">
                    <Sparkles size={11} className="text-acid" /> AI captions
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-paper/80">
                    "Autumn drop — 48 hours early access."
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-acid">
                    <Check size={11} /> 3 variants ready
                  </p>
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}
