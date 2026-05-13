import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Sultan Park & Puff" },
      { name: "description", content: "Sign in or create an account to manage reservations at Sultan Park & Puff." },
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
  const { user } = useAuth();

  if (user) {
    // already signed in — bounce to profile
    setTimeout(() => navigate({ to: "/profile" }), 0);
  }

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
    <section className="mx-auto max-w-md px-5 lg:px-8 py-24">
      <div className="text-center">
        <div className="eyebrow">Members & Crew</div>
        <h1 className="font-display text-5xl mt-3">
          {mode === "signin" ? <>Welcome <span className="text-gold-gradient">back.</span></> : <>Join <span className="text-gold-gradient">Sultan.</span></>}
        </h1>
        <p className="text-foreground/70 mt-3 text-sm">
          {mode === "signin" ? "Sign in to manage bookings and access the admin panel." : "Create your account to reserve and ride the vibe."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 glass rounded-3xl p-7 kente-border space-y-4">
        {mode === "signup" && (
          <Field icon={<UserIcon size={16} className="text-gold" />} label="Display name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="flex-1 bg-transparent focus:outline-none text-sm" />
          </Field>
        )}
        <Field icon={<Mail size={16} className="text-gold" />} label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 bg-transparent focus:outline-none text-sm" />
        </Field>
        <Field icon={<Lock size={16} className="text-gold" />} label="Password">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent focus:outline-none text-sm" />
        </Field>

        <button disabled={busy} type="submit" className="w-full rounded-2xl bg-gold px-6 py-4 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition flex items-center justify-center gap-2 disabled:opacity-60">
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight size={16} />
        </button>

        <p className="text-xs text-muted-foreground text-center">
          {mode === "signin" ? (
            <>No account?{" "}<button type="button" onClick={() => setMode("signup")} className="text-gold hover:underline">Sign up</button></>
          ) : (
            <>Already have one?{" "}<button type="button" onClick={() => setMode("signin")} className="text-gold hover:underline">Sign in</button></>
          )}
        </p>
      </form>

      <div className="mt-8 text-center text-sm text-foreground/60">
        <Link to="/" className="hover:text-gold">← Back to Sultan</Link>
      </div>
    </section>
  );
}

function Field({ icon, label, children }: { icon: ReactNodeIcon; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2 flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3.5 focus-within:border-gold">
        {icon}
        {children}
      </div>
    </label>
  );
}
type ReactNodeIcon = React.ReactNode;
