import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import event1 from "@/assets/event-1.jpg";
import { Countdown } from "@/components/Countdown";
import { StatCounter } from "@/components/StatCounter";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sultan Park & Puff — Where Nairobi Comes to Breathe" },
      { name: "description", content: "Reserve your table, ride the Summer Tides 2025, and catch the vibe at Nairobi's premier shisha lounge & events venue." },
      { property: "og:title", content: "Sultan Park & Puff" },
      { property: "og:description", content: "Where Nairobi Comes to Breathe." },
    ],
  }),
  component: HomePage,
});

const COLLAB_LOGOS = [
  "Kenya Cane", "Tusker", "Heineken", "Captain Morgan", "Smirnoff", "Whitecap",
  "Guarana", "Black Label", "Hennessy", "Red Bull",
];

function HomePage() {
  // Summer Tides launch — 8 weeks out
  const summerTidesDate = new Date(Date.now() + 56 * 86_400_000);

  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Sultan Park & Puff lounge at night"
            className="h-full w-full object-cover kenburns"
            width={1920}
            height={1280}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-night-deep/70 via-night-deep/40 to-night-deep" />
        </div>
        <div className="absolute inset-0 grain pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8 pt-32 pb-20 min-h-[100svh] flex flex-col justify-center">
          <div className="rise inline-flex items-center gap-2 self-start glass rounded-full px-4 py-1.5 border border-gold/30 gold-pulse mb-8">
            <Sparkles size={14} className="text-gold" />
            <span className="text-xs uppercase tracking-[0.32em] text-gold font-mono">
              Summer Tides 2025
            </span>
          </div>

          <h1 className="rise rise-1 font-display text-[14vw] sm:text-7xl lg:text-[8.5rem] leading-[0.92] tracking-[-0.03em] max-w-5xl">
            <span className="text-gold-gradient">Where Nairobi</span>
            <br />
            <span className="text-foreground">comes to <em className="font-italic font-normal italic text-gold">breathe</em>.</span>
          </h1>

          <p className="rise rise-2 mt-8 max-w-xl text-lg text-foreground/75">
            Shisha. Sound. The slowest hours of Nairobi night, served cold. Reserve your seat at Park Hotel — USIU Road.
          </p>

          <div className="rise rise-3 mt-10 flex flex-wrap gap-3">
            <Link
              to="/events"
              className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
            >
              Book Your Spot
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-7 py-3.5 text-sm font-medium text-foreground hover:border-gold hover:text-gold transition"
            >
              See What's On
            </Link>
          </div>

          <div className="rise rise-4 absolute bottom-10 left-5 lg:left-8 right-5 lg:right-8 flex items-end justify-between text-xs text-foreground/60">
            <div className="font-mono">USIU RD · NAIROBI · 18+</div>
            <div className="font-mono hidden sm:block">SCROLL ↓</div>
          </div>
        </div>
      </section>

      {/* ───────────── SUMMER TIDES TEASER + COUNTDOWN ───────────── */}
      <section className="relative wave-bg">
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="eyebrow">Coming · Summer 2025</div>
            <h2 className="font-display text-5xl md:text-7xl mt-3 leading-[0.95]">
              <span className="text-gold-gradient">Summer Tides</span>
              <br />
              <span className="font-italic italic font-normal text-foreground/90">is rising.</span>
            </h2>
            <p className="mt-5 text-foreground/70 max-w-md">
              Six weeks. One island. The biggest sound system Sultan has ever assembled. Drop your number for early access — first 100 names get free entry.
            </p>
            <Link
              to="/events"
              className="inline-flex mt-8 items-center gap-2 text-gold hover:gap-3 transition-all"
            >
              See what's on <ArrowRight size={16} />
            </Link>
          </div>

          <div className="glass rounded-3xl p-6 lg:p-8 kente-border">
            <div className="eyebrow">Doors open in</div>
            <div className="mt-4">
              <Countdown target={summerTidesDate} />
            </div>
            <form className="mt-6 flex gap-2">
              <input
                type="tel"
                placeholder="+254 7XX XXX XXX"
                className="flex-1 bg-night/60 border border-border/60 rounded-full px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
              >
                Notify Me
              </button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              We'll WhatsApp you when the doors open. No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── STATS ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          <StatCounter value={120} label="Nights Hosted" suffix="+" />
          <StatCounter value={48000} label="Vibers Through The Door" suffix="+" />
          <StatCounter value={32} label="Brand Collabs" />
          <StatCounter value={94} label="DJs On The Decks" suffix="+" />
        </div>
      </section>

      {/* ─────────────────── FEATURED EVENT ─────────────────── */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-24">
        <div className="eyebrow">This Weekend</div>
        <h2 className="font-display text-4xl md:text-6xl mt-3 max-w-2xl">
          The night that everyone's <span className="text-gold-gradient">talking about.</span>
        </h2>

        <Link
          to="/events"
          className="group relative mt-12 block overflow-hidden rounded-3xl glass kente-border"
        >
          <div className="grid lg:grid-cols-[1.2fr_1fr]">
            <div className="relative aspect-[5/3] lg:aspect-auto overflow-hidden">
              <img
                src={event1}
                alt="DJ booth at Sultan"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-lava/90 px-3 py-1 text-xs font-mono uppercase tracking-wider text-cream">
                <span className="h-1.5 w-1.5 rounded-full bg-cream animate-pulse" />
                In 3 days
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-between gap-8">
              <div>
                <div className="eyebrow">Saturday · 22:00 till late</div>
                <h3 className="font-display text-3xl lg:text-5xl mt-3">
                  <span className="text-gold-gradient">Afro House</span><br/>Takeover
                </h3>
                <p className="mt-4 text-foreground/70">
                  Headliner secret. Resident set by DJ Kanyali. Special bottle pricing on Captain Morgan all night. Limited tables.
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {["Afro House", "Amapiano", "Live Sax"].map((t) => (
                    <span key={t} className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-gold/30 text-gold">{t}</span>
                  ))}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-gold font-medium">
                Reserve a table <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ─────────────────── COLLAB MARQUEE ─────────────────── */}
      <section className="border-y border-border/40 bg-night/40 overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-6 flex items-center gap-6">
          <span className="eyebrow shrink-0">Trusted Partners</span>
          <div className="flex-1 overflow-hidden relative">
            <div className="flex gap-12 marquee-track w-max">
              {[...COLLAB_LOGOS, ...COLLAB_LOGOS].map((l, i) => (
                <span key={i} className="font-display text-2xl text-foreground/40 hover:text-gold transition whitespace-nowrap">
                  {l}
                </span>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-night-deep to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-night-deep to-transparent pointer-events-none" />
          </div>
        </div>
      </section>
    </>
  );
}
