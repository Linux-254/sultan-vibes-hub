import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, User as UserIcon, Crown, ShieldCheck, Flame } from "lucide-react";
import logo from "@/assets/empire-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Empire Park & Puff" },
      { name: "description", content: "Sign in or create an account to manage reservations at Empire Park & Puff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile" });
  }, [loading, user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/profile" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-night-deep via-night to-[oklch(0.18_0.03_60)]" />
      <div className="absolute inset-0 grain pointer-events-none opacity-60" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-lava/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        {/* Left — brand story */}
        <div className="hidden lg:flex flex-col justify-between h-full min-h-[560px]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img src={logo} alt="" width={44} height={44} className="h-11 w-11 object-contain drop-shadow-[0_0_16px_rgba(212,175,55,0.4)] transition-all duration-500 group-hover:rotate-[8deg]" />
              <span className="font-display text-2xl tracking-[0.24em] text-gold-gradient">EMPIRE</span>
            </Link>
            <div className="mt-14">
              <div className="eyebrow">Members & Crew</div>
              <h1 className="font-display text-6xl xl:text-7xl mt-4 leading-[0.95]">
                <span className="text-gold-gradient">Reserve.</span><br />
                <span className="font-italic italic font-normal text-foreground/90">Rule the night.</span>
              </h1>
              <p className="mt-6 text-foreground/70 max-w-md">
                One account for reservations, event access, the recap gallery, and — for our crew — the control room.
              </p>
            </div>
          </div>

          <ul className="mt-12 space-y-4 text-sm">
            {[
              { icon: Crown, text: "Priority booking on Summer Tides nights" },
              { icon: Flame, text: "Track your reservations, deposits & receipts" },
              { icon: ShieldCheck, text: "Bank-grade auth. Your data stays yours." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-foreground/75">
                <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Icon size={14} className="text-gold" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="w-full">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
              <span className="font-display text-xl tracking-[0.24em] text-gold-gradient">EMPIRE</span>
            </Link>
          </div>

          <div className="glass rounded-3xl p-7 sm:p-9 kente-border shadow-[var(--shadow-elevated)]">
            {/* Tab switch */}
            <div className="flex bg-night-deep/60 rounded-2xl p-1 mb-7">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                    mode === m ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <h2 className="font-display text-3xl">
              {mode === "signin" ? <>Welcome <span className="text-gold-gradient">back.</span></> : <>Join the <span className="text-gold-gradient">Empire.</span></>}
            </h2>
            <p className="text-foreground/60 text-sm mt-2">
              {mode === "signin" ? "Sign in to manage bookings and access your dashboard." : "Create your account in under 30 seconds."}
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === "signup" && (
                <Field icon={<UserIcon size={16} className="text-gold" />} label="Display name">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="flex-1 bg-transparent focus:outline-none text-sm" />
                </Field>
              )}
              <Field icon={<Mail size={16} className="text-gold" />} label="Email">
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 bg-transparent focus:outline-none text-sm" />
              </Field>
              <Field icon={<Lock size={16} className="text-gold" />} label="Password">
                <input type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="flex-1 bg-transparent focus:outline-none text-sm" />
              </Field>

              <button disabled={busy} type="submit" className="w-full rounded-2xl bg-gold px-6 py-4 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight size={16} />
              </button>

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                By continuing you agree to Empire's house rules · 18+ venue
              </p>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-foreground/60">
            <Link to="/" className="hover:text-gold">← Back to Empire</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2 flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3.5 focus-within:border-gold transition-colors">
        {icon}
        {children}
      </div>
    </label>
  );
}
