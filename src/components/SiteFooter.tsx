import { Link } from "@tanstack/react-router";
import { Instagram, Music2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-32 border-t border-border/40 bg-night-deep">
      <div className="absolute inset-0 grain pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8 py-16 grid gap-12 lg:grid-cols-4">
        <div>
          <div className="font-display text-2xl text-gold-gradient">SULTAN</div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Where Nairobi comes to breathe. A chill-out lounge & events venue on USIU Road.
          </p>
        </div>

        <div>
          <div className="eyebrow mb-4">Explore</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/events" className="hover:text-gold">Upcoming Events</Link></li>
            <li><Link to="/summer-tides" className="hover:text-gold">Summer Tides</Link></li>
            <li><Link to="/milestones" className="hover:text-gold">Milestones</Link></li>
            <li><Link to="/about" className="hover:text-gold">About</Link></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow mb-4">Visit</div>
          <p className="text-sm text-muted-foreground">
            Park Hotel · USIU Road<br />
            Nairobi, Kenya
          </p>
          <p className="text-sm text-muted-foreground mt-3">Open Wed – Sun · 5pm – Late</p>
          <p className="text-xs text-muted-foreground mt-2">18+ venue</p>
        </div>

        <div>
          <div className="eyebrow mb-4">Follow</div>
          <div className="flex gap-3">
            <a href="https://instagram.com/sultanpuffandpark" target="_blank" rel="noreferrer"
               className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition">
              <Instagram size={16} />
            </a>
            <a href="https://tiktok.com/@sultanpuffandpark" target="_blank" rel="noreferrer"
               className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition">
              <Music2 size={16} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sultan Park & Puff · Crafted in Nairobi
      </div>
    </footer>
  );
}
