import { createFileRoute, Link } from "@tanstack/react-router";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";
import { Calendar, Users } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Upcoming Events — Sultan Park & Puff" },
      { name: "description", content: "Afro House, Amapiano, live sax sessions and more. Browse upcoming nights at Sultan Park & Puff in Nairobi." },
      { property: "og:title", content: "Upcoming Events at Sultan" },
      { property: "og:description", content: "Browse upcoming nights and reserve your table." },
    ],
  }),
  component: EventsPage,
});

const EVENTS = [
  {
    slug: "afro-house-takeover",
    title: "Afro House Takeover",
    date: "Sat · Mar 15 · 22:00",
    image: event1,
    tags: ["Afro House", "Amapiano"],
    djs: "DJ Kanyali · Special Guest",
    going: 184,
    featured: true,
    daysOut: 3,
  },
  {
    slug: "shisha-sundays",
    title: "Shisha Sundays · Acoustic",
    date: "Sun · Mar 16 · 18:00",
    image: event2,
    tags: ["Live", "Acoustic"],
    djs: "Karun · Friends",
    going: 96,
    featured: false,
    daysOut: 4,
  },
  {
    slug: "summer-tides-launch",
    title: "Summer Tides — Opening Wave",
    date: "Fri · Apr 04 · 20:00",
    image: event3,
    tags: ["Summer Tides", "Mixed"],
    djs: "Lineup TBA",
    going: 312,
    featured: false,
    daysOut: 24,
  },
];

function EventsPage() {
  const featured = EVENTS.find((e) => e.featured)!;
  const rest = EVENTS.filter((e) => !e.featured);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-16 pb-12">
        <div className="eyebrow">What's On</div>
        <h1 className="font-display text-5xl md:text-7xl mt-3">
          Upcoming <span className="text-gold-gradient">Nights.</span>
        </h1>
        <p className="mt-4 text-foreground/70 max-w-xl">
          Reserve early — Saturdays at Sultan sell out by Wednesday.
        </p>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <article className="relative rounded-3xl overflow-hidden glass kente-border">
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            <div className="relative aspect-[5/3] lg:aspect-auto overflow-hidden">
              <img src={featured.image} alt={featured.title} className="h-full w-full object-cover" loading="eager" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-lava px-3 py-1 text-xs font-mono uppercase text-cream gold-pulse">
                In {featured.daysOut} days
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col gap-6 justify-between">
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <Calendar size={12} /> {featured.date}
                </div>
                <h2 className="font-display text-4xl lg:text-5xl mt-3">
                  <span className="text-gold-gradient">{featured.title}</span>
                </h2>
                <p className="mt-4 text-foreground/70">{featured.djs}</p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {featured.tags.map((t) => (
                    <span key={t} className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-gold/30 text-gold">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)]">
                  Reserve a table
                </button>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
                  <Users size={14} /> {featured.going} going
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid sm:grid-cols-2 gap-6">
        {rest.map((e) => (
          <article key={e.slug} className="group relative rounded-2xl overflow-hidden glass border border-border/40">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={e.image} alt={e.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-night-deep/30 to-transparent" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-mono uppercase tracking-wider">
                In {e.daysOut} days
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="eyebrow">{e.date}</div>
                <h3 className="font-display text-3xl mt-2 text-foreground">{e.title}</h3>
                <p className="text-sm text-foreground/70 mt-1">{e.djs}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {e.tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold/30 text-gold">{t}</span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Users size={12} /> {e.going} going
                  </span>
                  <button className="text-xs font-medium text-gold hover:underline">Reserve →</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
