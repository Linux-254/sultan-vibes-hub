import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Sultan Park & Puff" },
      { name: "description", content: "Sign in with your Kenyan phone number to manage bookings, points and downloads." },
      { property: "og:title", content: "Your Sultan Profile" },
      { property: "og:description", content: "Sign in to manage bookings, Sultan Points and downloads." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <section className="mx-auto max-w-md px-5 lg:px-8 py-24">
      <div className="text-center">
        <div className="eyebrow">Members</div>
        <h1 className="font-display text-5xl mt-3">
          Welcome to <span className="text-gold-gradient">Sultan.</span>
        </h1>
        <p className="text-foreground/70 mt-3">
          Sign in with your M-Pesa number. We'll send a one-time code via SMS.
        </p>
      </div>

      <form className="mt-10 glass rounded-3xl p-7 kente-border space-y-4">
        <label className="block">
          <span className="eyebrow">Phone Number</span>
          <div className="mt-2 flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3.5 focus-within:border-gold">
            <Phone size={16} className="text-gold" />
            <input
              type="tel"
              placeholder="+254 7XX XXX XXX"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm"
            />
          </div>
        </label>

        <button
          type="button"
          className="w-full rounded-2xl bg-gold px-6 py-4 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition flex items-center justify-center gap-2"
        >
          Send me a code <ArrowRight size={16} />
        </button>

        <p className="text-xs text-muted-foreground text-center">
          By continuing you confirm you're 18+ and accept our T&Cs and privacy policy.
        </p>
      </form>

      <div className="mt-10 text-center text-sm text-foreground/70">
        New to Sultan?{" "}
        <Link to="/about" className="text-gold hover:underline">Read our story</Link>
      </div>
    </section>
  );
}
