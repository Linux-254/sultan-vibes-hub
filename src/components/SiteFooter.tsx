import { Link } from "@tanstack/react-router";
import { Instagram, Music2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function SiteFooter() {
  const { isStaff } = useAuth();
  return (
    <footer className="relative mt-20 sm:mt-32 border-t border-border/40 bg-night-deep">
      <div className="absolute inset-0 grain pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
        <div>
          <div className="font-display text-2xl sm:text-3xl text-gold-gradient">
            EMPIRE KWA SULTAN
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-xs leading-relaxed">
            Where Nairobi comes to breathe. Shisha, cocktails, liquor & events venue on USIU Road.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href="https://instagram.com/empirepuffandpark"
              target="_blank"
              rel="noreferrer"
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://tiktok.com/@empirepuffandpark"
              target="_blank"
              rel="noreferrer"
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition"
            >
              <Music2 size={16} />
            </a>
          </div>
        </div>

        <div>
          <div className="eyebrow mb-4">Explore</div>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/events" className="hover:text-gold transition">
                Upcoming Events
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-gold transition">
                Drinks Menu
              </Link>
            </li>
            <li>
              <Link to="/recap" className="hover:text-gold transition">
                Recap
              </Link>
            </li>
            <li>
              <Link to="/milestones" className="hover:text-gold transition">
                Milestones
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-gold transition">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="eyebrow mb-4">Visit</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Park Hotel · USIU Road
            <br />
            Nairobi, Kenya
          </p>
          <p className="text-sm text-muted-foreground mt-3">Open Mon – Sun · 5pm – Late</p>
          <p className="text-xs text-muted-foreground/60 mt-2">18+ venue</p>
        </div>

        <div>
          <div className="eyebrow mb-4">Quick Links</div>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/reserve" className="hover:text-gold transition">
                Reserve a Table
              </Link>
            </li>
            <li>
              <Link to="/vibe" className="hover:text-gold transition">
                The Vibe
              </Link>
            </li>
            <li>
              <Link to="/collabs" className="hover:text-gold transition">
                Collaborate
              </Link>
            </li>
            <li>
              <Link to="/sos" className="hover:text-gold transition">
                SOS / Report
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        © {new Date().getFullYear()} Empire Kwa Sultan · Crafted in Nairobi
        {isStaff && (
          <Link
            to="/admin"
            className="inline-flex items-center justify-center h-4 w-4 rounded-full opacity-20 hover:opacity-80 hover:bg-gold/20 transition-all ml-1"
            aria-label="Control Room"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          </Link>
        )}
      </div>
    </footer>
  );
}
