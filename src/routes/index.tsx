import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import event1 from "@/assets/event-1.jpg";
import { Countdown } from "@/components/Countdown";
import { StatCounter } from "@/components/StatCounter";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ArrowRight, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { localBusinessJsonLd } from "@/lib/json-ld";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empire Kwa Sultan — Where Nairobi Comes to Breathe" },
      {
        name: "description",
        content:
          "Shisha, cocktails, liquor, and the best nightlife in Nairobi. Reserve your table at Empire Kwa Sultan — USIU Road.",
      },
      {
        name: "keywords",
        content:
          "Empire Kwa Sultan, shisha lounge Nairobi, cocktails Nairobi, nightlife USIU Road, hookah bar, events venue Nairobi, VIP lounge, bar Nairobi Kenya",
      },
      { property: "og:title", content: "Empire Kwa Sultan" },
      {
        property: "og:description",
        content: "Where Nairobi Comes to Breathe. Shisha. Cocktails. Sound.",
      },
    ],
  }),
  component: HomePage,
});

const FALLBACK_LOGOS = [
  "Kenya Cane",
  "Tusker",
  "Heineken",
  "Captain Morgan",
  "Smirnoff",
  "Whitecap",
  "Guarana",
  "Black Label",
  "Hennessy",
  "Red Bull",
];

interface SpecialEvent {
  id: string;
  name: string;
  description: string | null;
  ticket_price: number;
  event_date: string;
  event_time: string | null;
  countdown_enabled: boolean;
}

function HomePage() {
  const [activeEvent, setActiveEvent] = useState<SpecialEvent | null>(null);
  const [partners, setPartners] = useState<Array<{ name: string; logo_url: string | null }>>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();
      const [eventRes, partnersRes] = await Promise.all([
        supabase
          .from("special_events")
          .select("*")
          .eq("countdown_enabled", true)
          .gte("event_date", now.slice(0, 10))
          .order("event_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("trusted_partners")
          .select("name, logo_url")
          .eq("active", true)
          .order("sort_order"),
      ]);
      setActiveEvent(eventRes.data);
      if (partnersRes.data && partnersRes.data.length > 0) {
        setPartners(partnersRes.data);
      } else {
        setPartners(FALLBACK_LOGOS.map((n) => ({ name: n, logo_url: null })));
      }
    };
    load();
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
      />
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <HeroSlideshow slot="hero" />
        <div className="absolute inset-0 grain pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 pt-28 sm:pt-32 pb-20 min-h-[100svh] flex flex-col justify-center">
          <h1 className="rise hero-title font-display text-[11.5vw] sm:text-7xl lg:text-[8.5rem] leading-[0.92] tracking-[-0.03em] max-w-5xl">
            <span className="text-gold-gradient">Where Nairobi</span>
            <br />
            <span className="text-foreground">
              comes to <em className="font-italic font-normal italic text-gold">breathe</em>.
            </span>
          </h1>

          <p className="rise rise-2 mt-8 max-w-xl text-lg text-foreground/75">
            Shisha. Sound. The slowest hours of Nairobi night, served cold. Reserve your seat at
            Park Hotel — USIU Road.
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

      {/* ───────────── SPECIAL EVENT COUNTDOWN ───────────── */}
      {activeEvent && (
        <section className="relative wave-bg">
          <div className="absolute inset-0 grain pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-16 lg:py-32 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="eyebrow">Special Event</div>
              <h2 className="font-display text-5xl md:text-7xl mt-3 leading-[0.95]">
                <span className="text-gold-gradient">{activeEvent.name}</span>
                <br />
                <span className="font-italic italic font-normal text-foreground/90">
                  is rising.
                </span>
              </h2>
              {activeEvent.description && (
                <p className="mt-5 text-foreground/70 max-w-md">{activeEvent.description}</p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <Ticket size={16} className="text-gold" />
                <span className="text-foreground/80">
                  KES {activeEvent.ticket_price.toLocaleString()} per ticket
                </span>
              </div>
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
                <Countdown target={new Date(activeEvent.event_date)} />
              </div>
              {activeEvent.event_time && (
                <p className="mt-4 text-sm text-foreground/60">
                  {new Date(activeEvent.event_date).toLocaleDateString("en-KE", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · {activeEvent.event_time}
                </p>
              )}
              <Link
                to="/reserve"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
              >
                Reserve a table <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── STATS ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-16 lg:py-32">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
          <StatCounter value={120} label="Nights Hosted" suffix="+" />
          <StatCounter value={48000} label="Vibers Through The Door" suffix="+" />
          <StatCounter value={32} label="Brand Collabs" />
          <StatCounter value={94} label="DJs On The Decks" suffix="+" />
        </div>
      </section>

      {/* ─────────────────── FEATURED EVENT ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 pb-16 sm:pb-24">
        <div className="eyebrow">This Weekend</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-6xl mt-3 max-w-2xl">
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
                alt="DJ booth at Empire"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-lava/90 px-3 py-1 text-xs font-mono uppercase tracking-wider text-cream">
                <span className="h-1.5 w-1.5 rounded-full bg-cream animate-pulse" />
                In 3 days
              </div>
            </div>
            <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-between gap-6 sm:gap-8">
              <div>
                <div className="eyebrow">Saturday · 22:00 till late</div>
                <h3 className="font-display text-3xl lg:text-5xl mt-3">
                  <span className="text-gold-gradient">Afro House</span>
                  <br />
                  Takeover
                </h3>
                <p className="mt-4 text-foreground/70">
                  Headliner secret. Resident set by DJ Kanyali. Special bottle pricing on Captain
                  Morgan all night. Limited tables.
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {["Afro House", "Amapiano", "Live Sax"].map((t) => (
                    <span
                      key={t}
                      className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-gold/30 text-gold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-gold font-medium">
                Reserve a table{" "}
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ─────────────────── COLLAB MARQUEE ─────────────────── */}
      <section className="border-y border-border/40 bg-night/40 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-6 flex items-center gap-6">
          <span className="eyebrow shrink-0">Trusted Partners</span>
          <div className="flex-1 overflow-hidden relative">
            <div className="flex gap-12 marquee-track w-max">
              {[...partners, ...partners].map((p, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 font-display text-2xl text-foreground/40 hover:text-gold transition whitespace-nowrap"
                >
                  {p.logo_url && (
                    <img
                      src={p.logo_url}
                      alt={p.name}
                      className="h-6 w-auto object-contain opacity-70"
                    />
                  )}
                  {!p.logo_url && p.name}
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
