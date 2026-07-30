import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Check, KeyRound } from "lucide-react";
import { PasswordField } from "@/components/PasswordField";
import logo from "@/assets/empire-logo.webp";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password — Empire Kwa Sultan" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        const { error } = await supabase.auth.getSession();
        if (error) {
          toast.error("Invalid or expired reset link. Request a new one.");
          navigate({ to: "/auth" });
          return;
        }
        setValid(true);
      } else {
        toast.error("No reset token found. Request a new link.");
        navigate({ to: "/auth" });
        return;
      }
      setValidating(false);
    };
    check();
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
  };

  if (validating) {
    return (
      <section className="min-h-[calc(100svh-4rem)] flex items-center justify-center">
        <div className="text-sm text-foreground/60">Verifying reset link…</div>
      </section>
    );
  }

  if (done) {
    return (
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-night-deep via-night to-[oklch(0.18_0.03_60)]" />
        <div className="absolute inset-0 grain pointer-events-none opacity-60" />
        <div className="relative mx-auto max-w-xl px-5 py-32 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-savanna/20 flex items-center justify-center">
            <Check className="text-savanna" />
          </div>
          <h1 className="font-display text-4xl mt-6">Password updated</h1>
          <p className="mt-3 text-foreground/70">
            Your password has been changed. Sign in with your new password.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
          >
            Sign in <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  if (!valid) return null;

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-night-deep via-night to-[oklch(0.18_0.03_60)]" />
      <div className="absolute inset-0 grain pointer-events-none opacity-60" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-lg px-5 py-20">
        <div className="lg:text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <img src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className="font-display text-xl tracking-[0.24em] text-gold-gradient">
              EMPIRE
            </span>
          </Link>
        </div>

        <div className="glass rounded-3xl p-7 sm:p-9 kente-border shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound size={20} className="text-gold" />
            <h1 className="font-display text-3xl">
              New <span className="text-gold-gradient">password.</span>
            </h1>
          </div>
          <p className="text-foreground/60 text-sm">
            Enter your new password below. Make it something strong.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <PasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              showStrength
            />
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              showStrength={false}
            />

            {confirm.length > 0 && password !== confirm && (
              <p className="text-[11px] text-lava">Passwords don't match</p>
            )}

            <button
              disabled={busy || password.length < 8 || password !== confirm}
              type="submit"
              className="w-full rounded-2xl bg-gold px-6 py-4 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? "Updating…" : "Update password"} <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-foreground/60">
          <Link to="/auth" className="hover:text-gold">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
