import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/milestones")({
  head: () => ({
    meta: [
      { title: "Milestones — Sultan Park & Puff" },
      { name: "description", content: "The story of Sultan, told in moments. From the first night to the biggest summer campaign in our history." },
      { property: "og:title", content: "Sultan Milestones" },
      { property: "og:description", content: "The story of Sultan, told in moments." },
    ],
  }),
  component: MilestonesPage,
});

const MILESTONES = [
  { date: "Mar 2022", title: "The First Night", body: "A handful of friends, a single shisha, and a sound system borrowed from a cousin. The vibe was already there." },
  { date: "Aug 2022", title: "Park Hotel · USIU Road", body: "We took the rooftop. We never gave it back." },
  { date: "Dec 2022", title: "First Sold-Out Saturday", body: "We turned 80 people away. That was the night we knew." },
  { date: "May 2023", title: "Tusker Partnership", body: "Our first major collab. The bar got bigger, the crowd got louder." },
  { date: "Oct 2023", title: "Sultan Talks Launch", body: "A Sunday series of intimate sets, panel chats and acoustic nights." },
  { date: "Feb 2024", title: "10,000 Vibers", body: "Ten thousand people through the door in a single year." },
  { date: "Jan 2025", title: "Summer Tides Announced", body: "The biggest campaign in our history. Six weeks. One ocean. Coming summer 2025." },
];

function MilestonesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-16 pb-12">
        <div className="eyebrow">The Story</div>
        <h1 className="font-display text-5xl md:text-7xl mt-3">
          How Sultan <span className="text-gold-gradient">became Sultan.</span>
        </h1>
      </section>

      <section className="mx-auto max-w-3xl px-5 lg:px-8 pb-32">
        <div className="relative pl-8 sm:pl-12">
          <div className="absolute left-3 sm:left-5 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/40 to-transparent" />
          {MILESTONES.map((m, i) => (
            <div key={m.date} className="relative pb-14 last:pb-0">
              <div className="absolute -left-[18px] sm:-left-[14px] top-1.5 h-4 w-4 rounded-full bg-gold gold-pulse" />
              <div className="eyebrow">{m.date}</div>
              <h3 className="font-display text-2xl md:text-3xl mt-2">
                <span className={i === MILESTONES.length - 1 ? "text-gold-gradient" : ""}>{m.title}</span>
              </h3>
              <p className="mt-3 text-foreground/70 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
