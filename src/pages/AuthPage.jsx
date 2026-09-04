import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { login, register } from "../lib/api";
import { PRODUCT } from "../lib/config";

const PLANS = { starter: "Starter", growth: "Growth", agency: "Agency" };

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = PLANS[params.get("plan")?.toLowerCase()] || null;

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (isSignup) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-ink px-5 py-6 text-paper">
      <Link
        to="/"
        className="flex w-max items-baseline gap-1 font-display text-xl font-semibold tracking-tight"
      >
        {PRODUCT.name}
        <span className="text-acid">.</span>
      </Link>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 py-10 lg:grid-cols-2">
        {/* left: the pitch */}
        <div className="hidden lg:block">
          <h1 className="font-display text-6xl font-semibold leading-[0.95] tracking-[-0.02em]">
            {isSignup ? (
              <>
                Post everywhere.
                <br />
                <span className="text-acid">Once.</span>
              </>
            ) : (
              <>Welcome back.</>
            )}
          </h1>
          <p className="mt-6 max-w-sm leading-relaxed text-mute">
            Real accounts, real publishing. Your trial starts the moment you sign up — no credit
            card, no walkthrough videos.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-mute">
            {[
              "Email + password — your data is yours",
              "Platform connections ship phase by phase",
              "Dashboard numbers come from real APIs only",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-acid" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* right: the form */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-line bg-coal p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-mute">
              {isSignup ? "Start free trial" : "Log in"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              {isSignup ? "Create your account" : "Back to the queue"}
            </h2>
            {plan && <span className="chip mt-3 border-acid/40 text-acid">{plan} plan selected</span>}

            <form onSubmit={submit} className="mt-7 space-y-5">
              {isSignup && (
                <Field label="Name">
                  <input
                    required
                    value={form.name}
                    onChange={set("name")}
                    autoComplete="name"
                    className={inputCls}
                    placeholder="Maya Chen"
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  className={inputCls}
                  placeholder="you@studio.com"
                />
              </Field>
              <Field label="Password">
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className={inputCls}
                  placeholder={isSignup ? "8+ characters" : "••••••••"}
                />
              </Field>

              {error && (
                <p className="rounded-lg border-l-2 border-acid bg-soot px-4 py-3 text-sm">{error}</p>
              )}

              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-acid py-3.5 text-sm font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? "One sec…" : isSignup ? "Create account" : "Log in"}
                {!busy && <ArrowRight size={15} />}
              </button>
            </form>

            <p className="mt-6 text-sm text-mute">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-paper underline decoration-line underline-offset-4 hover:decoration-acid"
                  >
                    Log in
                  </Link>
                </>
              ) : (
                <>
                  New to {PRODUCT.name}?{" "}
                  <Link
                    to="/signup"
                    className="text-paper underline decoration-line underline-offset-4 hover:decoration-acid"
                  >
                    Start the free trial
                  </Link>
                </>
              )}
            </p>
          </div>
          <Link
            to="/"
            className="mt-6 flex w-max items-center gap-2 text-xs text-mute transition-colors hover:text-paper"
          >
            <ArrowLeft size={13} /> Back to the site
          </Link>
        </div>

      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-soot px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-mute/60 focus:border-acid/60";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.25em] text-mute">
        {label}
      </span>
      {children}
    </label>
  );
}
