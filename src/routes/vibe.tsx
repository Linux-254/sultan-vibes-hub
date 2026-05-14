import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Music, Users, Sparkles, Wine, Cigarette } from "lucide-react";
import event2 from "@/assets/event-2.jpg";

export const Route = createFileRoute("/vibe")({
  head: () => ({
    meta: [
      { title: "Vibe With Us — Sultan Park & Puff" },
      { name: "description", content: "Shisha, sound, sections — the full Sultan experience. Pick your package and meet us at Park Hotel." },
      { property: "og:title", content: "Vibe With Us — Sultan Park & Puff" },
      { property: "og:description", content: "Pick your package and meet us at Park Hotel." },
    ],
  }),
  component: VibePage,
});

const PACKAGES = [
  { id: "solo", name: "Solo Vibe", capacity: "1", price: 700, includes: ["1 seat", "Shisha of choice"] },
  { id: "duo", name: "Duo Pack", capacity: "2", price: 1200, includes: ["2 seats", "Shisha", "2 sodas"] },
  { id: "squad", name: "Squad", capacity: "4–6", price: 4500, includes: ["Reserved section", "Shisha × 2", "1 crate of choice"] },
  { id: "vip", name: "VIP Table", capacity: "6–10", price: 9000, includes: ["Premium section", "Shisha × 3", "Captain Morgan bottle", "Mixers"] },
  { id: "sultan", name: "The Sultan", capacity: "10+", price: 18000, includes: ["Entire section", "Premium shisha × 4", "Kenya Cane + Captain Morgan", "Cigars", "Personal attendant"] },
];

const PILLARS = [
  { icon: Flame, t: "Shisha, done right", d: "Hand-packed bowls, premium flavours, glass bongs and pots — every set up under KES 550." },
  { icon: Music, t: "The right sound", d: "Resident DJs and Big-League guests. Afro House, Amapiano, R&B, slow Sundays." },
  { icon: Users, t: "Sections that breathe", d: "From a corner for two to a full lounge for ten — your space, your night." },
  { icon: Wine, t: "Curated bar", d: "Kenya Cane, Captain Morgan, Tusker, Whitecap, Smirnoff and a clean mocktail list." },
];

function VibePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={event2} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-night-deep via-night-deep/60 to-night-deep" />
        </div>
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-5 lg:px-8 py-32 lg:py-40">
          <div className="eyebrow">Vibe With Us</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-4 leading-[0.92] max-w-4xl">
            Pick your <span className="text-gold-gradient">section</span>.<br />
            Meet us at the <em className="font-italic italic font-normal text-gold">door</em>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/75">
            Five ways to spend a night at Sultan — from a single seat and a shisha to the entire lounge with a personal attendant.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/reserve" className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition">
              Reserve a table <ArrowRight size={16} />
            </Link>
            <Link to="/events" className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-7 py-3.5 text-sm hover:border-gold hover:text-gold transition">
              See what's on
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((p) => (
            <div key={p.t} className="glass rounded-3xl p-6 kente-border">
              <p.icon className="text-gold" />
              <div className="font-display text-xl mt-4">{p.t}</div>
              <p className="mt-2 text-sm text-foreground/65">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="eyebrow">Packages</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3">
              Five ways to <span className="text-gold-gradient">spend the night</span>
            </h2>
          </div>
          <Link to="/reserve" className="text-sm text-gold hover:underline inline-flex items-center gap-1">
            Build your own <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PACKAGES.map((p, i) => {
            const featured = i === 3;
            return (
              <div key={p.id} className={`relative rounded-3xl p-7 ${featured ? "bg-gradient-to-br from-gold/15 to-lava/10 border border-gold/40 gold-pulse" : "glass kente-border"}`}>
                {featured && <div className="absolute -top-3 left-7 text-[10px] uppercase tracking-[0.32em] font-mono bg-gold text-night-deep px-3 py-1 rounded-full">Most loved</div>}
                <div className="eyebrow">For {p.capacity}</div>
                <div className="font-display text-3xl mt-2">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-foreground/60 text-sm">KES</span>
                  <span className="font-display text-4xl text-gold-gradient">{p.price.toLocaleString()}</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-foreground/75">
                  {p.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-2">
                      <Sparkles size={12} className="text-gold mt-1 shrink-0" /> {inc}
                    </li>
                  ))}
                </ul>
                <Link to="/reserve" search={{ pkg: p.id }} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground/5 hover:bg-gold hover:text-night-deep px-5 py-3 text-sm font-semibold transition">
                  Choose {p.name} <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 lg:px-8 pb-32">
        <div className="glass rounded-3xl p-8 lg:p-12 kente-border">
          <Cigarette className="text-gold" />
          <h3 className="font-display text-3xl mt-4">A note on <span className="text-gold-gradient">shisha</span>.</h3>
          <p className="mt-4 text-foreground/75">
            Every shisha, pot and bong on our menu sits at <strong className="text-gold">KES 550 or under</strong> — no inflated bottle-table mark-ups. Premium flavours, fresh coals, replaced bowls on request.
          </p>
        </div>
      </section>
    </>
  );
}
