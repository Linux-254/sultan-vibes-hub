import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Shield, Siren } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/vibe", label: "Vibe" },
  { to: "/events", label: "Events" },
  { to: "/recap", label: "Recap" },
  { to: "/products", label: "Shop" },
  { to: "/collabs", label: "Collabs" },
  { to: "/talent", label: "Talent" },
  { to: "/milestones", label: "Story" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isStaff } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="glass border-b border-border/50">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[oklch(0.85_0.13_80)] to-[oklch(0.55_0.14_60)] flex items-center justify-center text-night-deep font-display font-bold text-lg shadow-[var(--shadow-glow)]">
              S
            </span>
            <span className="font-display text-lg tracking-tight hidden sm:inline">
              <span className="text-gold-gradient">SULTAN</span>
              <span className="text-foreground/70 font-light"> · Park & Puff</span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="text-sm text-foreground/70 hover:text-gold transition-colors"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              to="/sos"
              className="text-xs uppercase tracking-wider px-3 py-2 rounded-full border border-lava/40 text-lava hover:bg-lava/10 transition flex items-center gap-1.5"
              aria-label="SOS"
            >
              <Siren size={14} /> SOS
            </Link>
            {isStaff && (
              <Link to="/admin" className="text-xs uppercase tracking-wider px-3 py-2 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition flex items-center gap-1.5">
                <Shield size={14} /> Admin
              </Link>
            )}
            {user ? (
              <Link to="/profile" className="text-sm text-foreground/70 hover:text-gold">Profile</Link>
            ) : (
              <Link to="/auth" className="text-sm text-foreground/70 hover:text-gold">Sign in</Link>
            )}
            <Link
              to="/reserve"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-gold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
            >
              Reserve
            </Link>
          </div>

          <button
            className="xl:hidden p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="xl:hidden border-t border-border/40 px-5 pb-5 pt-3 flex flex-col gap-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-foreground/80 hover:text-gold py-1"
              >
                {n.label}
              </Link>
            ))}
            <div className="border-t border-border/40 mt-2 pt-3 flex flex-col gap-2">
              <Link to="/reserve" onClick={() => setOpen(false)} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night-deep text-center">Reserve a table</Link>
              <div className="flex gap-2">
                <Link to="/sos" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-lava/40 text-lava text-xs uppercase tracking-wider px-3 py-2 text-center">SOS</Link>
                <Link to="/chat" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-border/40 text-xs uppercase tracking-wider px-3 py-2 text-center">Chat</Link>
                {user ? (
                  <Link to="/profile" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-border/40 text-xs uppercase tracking-wider px-3 py-2 text-center">Profile</Link>
                ) : (
                  <Link to="/auth" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-border/40 text-xs uppercase tracking-wider px-3 py-2 text-center">Sign in</Link>
                )}
              </div>
              {isStaff && (
                <Link to="/admin" onClick={() => setOpen(false)} className="rounded-full bg-gold/10 text-gold text-xs uppercase tracking-wider px-3 py-2 text-center">Admin</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
