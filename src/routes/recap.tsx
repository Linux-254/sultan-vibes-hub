import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Download, Lock, Search, Video } from "lucide-react";
import { useState } from "react";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

export const Route = createFileRoute("/recap")({
  head: () => ({
    meta: [
      { title: "Recap — Sultan Park & Puff" },
      { name: "description", content: "Find your night at Sultan. Photos and videos from past events — preview free, download via M-Pesa." },
      { property: "og:title", content: "Recap — find your night" },
      { property: "og:description", content: "Photos and videos from past events. Preview free, download via M-Pesa." },
    ],
  }),
  component: RecapPage,
});

const EVENTS = [
  { id: "1", name: "Afro House Takeover", date: "May 4, 2026", cover: event1, photos: 184, videos: 22, bundle: 700 },
  { id: "2", name: "Amapiano Sundays vol. 12", date: "Apr 27, 2026", cover: event2, photos: 96, videos: 14, bundle: 500 },
  { id: "3", name: "Big League · DJ Kanyali", date: "Apr 19, 2026", cover: event3, photos: 220, videos: 31, bundle: 700 },
];

function RecapPage() {
  const [q, setQ] = useState("");
  const filtered = EVENTS.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
      <div className="eyebrow">Recap</div>
      <div className="mt-3 flex items-end justify-between flex-wrap gap-6">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-2xl">
          Find your <span className="text-gold-gradient">night</span>.
        </h1>
        <div className="text-sm text-foreground/65 max-w-sm">
          Watermarked previews are free. Pay-once via M-Pesa to unlock the full-res download.
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3 max-w-md glass rounded-2xl px-4">
        <Search size={16} className="text-gold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by event name…" className="flex-1 bg-transparent py-3 text-sm focus:outline-none" />
      </div>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((e) => (
          <Link key={e.id} to="/recap" className="group glass rounded-3xl overflow-hidden kente-border">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={e.cover} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-night-deep/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-[10px] uppercase tracking-wider font-mono text-foreground/80">
                <span className="inline-flex items-center gap-1"><Camera size={12} /> {e.photos}</span>
                <span className="inline-flex items-center gap-1"><Video size={12} /> {e.videos}</span>
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-foreground/55">{e.date}</div>
              <div className="font-display text-xl mt-1">{e.name}</div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-foreground/55">Bundle from <span className="text-gold">KES {e.bundle}</span></span>
                <span className="inline-flex items-center gap-1 text-gold">Browse <Download size={12} /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 glass rounded-3xl p-7 lg:p-10 kente-border max-w-3xl">
        <Lock className="text-gold" />
        <h3 className="font-display text-2xl mt-3">Find My Photos · <span className="text-foreground/60 font-italic italic font-normal">coming soon</span></h3>
        <p className="mt-2 text-sm text-foreground/65 max-w-xl">
          Upload a selfie, we'll surface every shot you're in across every Sultan event. Strictly opt-in. Compliant with Kenya Data Protection Act 2019.
        </p>
      </div>
    </section>
  );
}
