import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  User as UserIcon,
  Crown,
  ShieldCheck,
  Flame,
  KeyRound,
  Mic2,
  Handshake,
  Loader2,
} from "lucide-react";
import { PasswordField } from "@/components/PasswordField";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import logo from "@/assets/empire-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Empire Kwa Sultan" },
      {
        name: "description",
        content: "Sign in or create an account to manage reservations at Empire Kwa Sultan.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const USER_TYPES = [
  { value: "user", label: "Guest", desc: "Reserve tables, attend events", icon: Crown },
  { value: "talent", label: "Talent", desc: "DJ, artist, MC, photographer", icon: Mic2 },
  { value: "collab", label: "Collaborator", desc: "Brand, agency, partner", icon: Handshake },
] as const;

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<string>("user");
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(() => {
    if (typeof window !== "undefined")
      return sessionStorage.getItem("empire_age_confirmed") === "true";
    return false;
  });
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile" });
  }, [loading, user, navigate]);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const resolveEmail = async (input: string): Promise<string> => {
    if (isEmail(input)) return input;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("display_name", input)
      .limit(1)
      .maybeSingle();
    if (!data) throw new Error("No account found with that display name.");
    const { data: userData } = await supabase.auth.admin.getUserById(data.id);
    if (userData?.user?.email) return userData.user.email;
    throw new Error("Could not resolve display name to an account.");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (password.length < 8) return toast.error("Password must be at least 8 characters.");
        const { error } = await supabase.auth.signUp({
          email: identifier,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { display_name: name || identifier.split("@")[0], user_type: userType },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify, then sign in.");
        setMode("signin");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your email.");
        setMode("signin");
      } else {
        setResolving(true);
        let email: string;
        try {
          email = await resolveEmail(identifier);
        } catch {
          toast.error("No account found. Try your email address instead.");
          setResolving(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/profile" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setResolving(false);
    }
  };

  const isWorking = busy || resolving;

  const formContent = (
    <form onSubmit={submit} className="mt-4 space-y-2.5">
      {mode === "signup" && (
        <Field icon={<UserIcon size={15} className="text-gold" />} label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
        </Field>
      )}

      <Field
        icon={<UserIcon size={15} className="text-gold" />}
        label={mode === "forgot" ? "Email" : "Email or display name"}
      >
        <input
          type={mode === "forgot" ? "email" : "text"}
          required
          autoComplete={mode === "signin" ? "username" : "email"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={mode === "forgot" ? "you@example.com" : "you@example.com or your name"}
          className="flex-1 bg-transparent focus:outline-none text-sm"
        />
      </Field>

      {mode !== "forgot" && (
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          showStrength={mode === "signup"}
        />
      )}

      {mode === "signup" && (
        <div>
          <span className="eyebrow">I am a...</span>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {USER_TYPES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setUserType(value)}
                className={`flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center transition ${
                  userType === value
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border/50 bg-night/40 text-foreground/60 hover:border-gold/50"
                }`}
              >
                <Icon size={14} />
                <span className="text-[11px] font-medium leading-tight">{label}</span>
                <span className="text-[8px] leading-tight text-foreground/40">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        disabled={isWorking || (mode === "signup" && password.length < 8)}
        type="submit"
        className="w-full rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition flex items-center justify-center gap-2 disabled:opacity-60 mt-1.5"
      >
        {isWorking ? (
          <>
            <Loader2 size={15} className="animate-spin" />{" "}
            {resolving ? "Looking up..." : "Working..."}
          </>
        ) : mode === "signin" ? (
          "Sign in"
        ) : mode === "signup" ? (
          "Create account"
        ) : (
          "Send reset link"
        )}
      </button>

      {mode === "signin" && (
        <button
          type="button"
          onClick={() => setMode("forgot")}
          className="w-full text-center text-xs text-gold/70 hover:text-gold transition"
        >
          Forgot password?
        </button>
      )}

      {mode === "forgot" && (
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="w-full text-center text-xs text-foreground/50 hover:text-foreground transition"
        >
          &larr; Back to sign in
        </button>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-0.5">
        By continuing you agree to Empire's house rules &middot; 18+ venue
      </p>
    </form>
  );

  return (
    <section className="relative min-h-[100svh] overflow-hidden flex flex-col">
      {/* Vibrant background slideshow */}
      <HeroSlideshow slot="auth" />

      {/* Age Gate Overlay */}
      {!ageConfirmed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-night-deep/90 backdrop-blur-sm">
          <div className="glass rounded-3xl p-8 sm:p-10 kente-border max-w-sm mx-4 text-center shadow-[var(--shadow-elevated)]">
            <div className="text-5xl mb-4">🔞</div>
            <h2 className="font-display text-2xl sm:text-3xl">
              Are you <span className="text-gold-gradient">18+</span>?
            </h2>
            <p className="text-foreground/60 text-sm mt-2">
              Empire Kwa Sultan is an 18+ venue. You must be of legal age to enter.
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => {
                  setAgeConfirmed(true);
                  sessionStorage.setItem("empire_age_confirmed", "true");
                }}
                className="w-full rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
              >
                Yes, I'm 18+
              </button>
              <Link
                to="/"
                className="block w-full rounded-2xl border border-foreground/20 px-6 py-3 text-sm text-foreground/60 hover:border-lava hover:text-lava transition"
              >
                No, take me back
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ──── MOBILE: single tight column ──── */}
      <div className="relative lg:hidden flex flex-col min-h-[100svh]">
        {/* Compact top bar */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-display text-base tracking-[0.22em] text-gold-gradient">
              EMPIRE
            </span>
          </Link>
          <Link to="/" className="text-xs text-foreground/50 hover:text-gold transition">
            ← Back
          </Link>
        </div>

        {/* Form card */}
        <div className="flex-1 flex flex-col justify-center px-4 pb-5">
          <div className="glass rounded-3xl p-5 kente-border shadow-[var(--shadow-elevated)]">
            {mode !== "forgot" && (
              <div className="flex bg-night-deep/60 rounded-2xl p-1 mb-4">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${mode === m ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]" : "text-foreground/60 hover:text-foreground"}`}
                  >
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
            )}
            <h2 className="font-display text-2xl">
              {mode === "signin" && (
                <>
                  Welcome <span className="text-gold-gradient">back.</span>
                </>
              )}
              {mode === "signup" && (
                <>
                  Join the <span className="text-gold-gradient">Empire.</span>
                </>
              )}
              {mode === "forgot" && (
                <>
                  Reset your <span className="text-gold-gradient">password.</span>
                </>
              )}
            </h2>
            <p className="text-foreground/60 text-xs mt-1">
              {mode === "signin" && "Sign in with your email or display name."}
              {mode === "signup" && "Create your account in under 30 seconds."}
              {mode === "forgot" && "Enter your email and we'll send you a reset link."}
            </p>
            {formContent}
          </div>
        </div>
      </div>

      {/* ──── DESKTOP: left panel + centered form ──── */}
      <div className="hidden lg:flex relative flex-1">
        {/* Left branding panel */}
        <div className="w-full max-w-lg px-12 pt-12 flex flex-col justify-center">
          <Link to="/" className="inline-flex items-center gap-3 group mb-12">
            <img
              src={logo}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-contain drop-shadow-[0_0_16px_rgba(212,175,55,0.4)] transition-all duration-500 group-hover:rotate-[8deg]"
            />
            <span className="font-display text-2xl tracking-[0.24em] text-gold-gradient">
              EMPIRE
            </span>
          </Link>
          <div>
            <div className="eyebrow">Members & Crew</div>
            <h1 className="font-display text-5xl xl:text-6xl mt-4 leading-[0.95]">
              <span className="text-gold-gradient">Reserve.</span>
              <br />
              <span className="font-italic italic font-normal text-foreground/90">
                Rule the night.
              </span>
            </h1>
            <p className="mt-5 text-foreground/70 max-w-sm text-sm">
              One account for reservations, event access, the recap gallery, and the control room.
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Crown, text: "Priority booking on event nights" },
              { icon: Flame, text: "Track reservations, deposits & receipts" },
              { icon: ShieldCheck, text: "Bank-grade auth. Your data stays yours." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-foreground/75">
                <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Icon size={13} className="text-gold" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-md">
            <div className="glass rounded-3xl p-7 kente-border shadow-[var(--shadow-elevated)]">
              {mode !== "forgot" && (
                <div className="flex bg-night-deep/60 rounded-2xl p-1 mb-5">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${mode === m ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]" : "text-foreground/60 hover:text-foreground"}`}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>
              )}
              <h2 className="font-display text-3xl">
                {mode === "signin" && (
                  <>
                    Welcome <span className="text-gold-gradient">back.</span>
                  </>
                )}
                {mode === "signup" && (
                  <>
                    Join the <span className="text-gold-gradient">Empire.</span>
                  </>
                )}
                {mode === "forgot" && (
                  <>
                    Reset your <span className="text-gold-gradient">password.</span>
                  </>
                )}
              </h2>
              <p className="text-foreground/60 text-sm mt-1.5">
                {mode === "signin" && "Sign in with your email or display name."}
                {mode === "signup" && "Create your account in under 30 seconds."}
                {mode === "forgot" && "Enter your email and we'll send you a reset link."}
              </p>
              {formContent}
            </div>
            <div className="mt-6 text-center text-sm text-foreground/60">
              <Link to="/" className="hover:text-gold">
                &larr; Back to Empire
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3 focus-within:border-gold transition-colors">
        {icon}
        {children}
      </div>
    </label>
  );
}
