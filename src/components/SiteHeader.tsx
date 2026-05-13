import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/summer-tides", label: "Summer Tides" },
  { to: "/events", label: "Events" },
  { to: "/milestones", label: "Milestones" },
  { to: "/about", label: "About" },
  { to: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isStaff } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="glass border-b border-border/50">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[oklch(0.85_0.13_80)] to-[oklch(0.55_0.14_60)] flex items-center justify-center text-night-deep font-display font-bold text-lg shadow-[var(--shadow-glow)]">
              S
            </span>
            <span className="font-display text-lg tracking-tight">
              <span className="text-gold-gradient">SULTAN</span>
              <span className="text-foreground/70 font-light"> · Park & Puff</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
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

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/events"
              className="text-sm font-medium px-4 py-2 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition"
            >
              Reserve a Table
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/40 px-5 pb-5 pt-3 flex flex-col gap-3">
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
          </div>
        )}
      </div>
    </header>
  );
}
