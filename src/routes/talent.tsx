import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Music2, Mic2, Camera, Headphones, User2 } from "lucide-react";

export const Route = createFileRoute("/talent")({
  head: () => ({
    meta: [
      { title: "Talent — Sultan Park & Puff" },
      { name: "description", content: "Sultan scouts and books DJs, artists, MCs, dancers, photographers and videographers across Nairobi." },
      { property: "og:title", content: "Sultan Talent Hub" },
      { property: "og:description", content: "Get scouted. Get booked. Get featured." },
    ],
  }),
  component: TalentPage,
});

const TYPES = ["All", "DJ", "Live Artist", "MC", "Dancer", "Photographer", "Videographer"] as const;

const ROSTER = [
  { username: "kanyali", stage: "DJ Kanyali", type: "DJ", status: "Resident · Friday" },
  { username: "amina-soul", stage: "Amina Soul", type: "Live Artist", status: "Booked · May 18" },
  { username: "mc-tafari", stage: "MC Tafari", type: "MC", status: "Available" },
  { username: "lensa-frames", stage: "Lensa Frames", type: "Photographer", status: "Available" },
  { username: "khalid-decks", stage: "Khalid on Decks", type: "DJ", status: "Booked · Jun 7" },
  { username: "petra-moves", stage: "Petra Moves", type: "Dancer", status: "Available" },
];

const ICONS: Record<string, typeof Music2> = {
  DJ: Headphones,
  "Live Artist": Music2,
  MC: Mic2,
  Dancer: User2,
  Photographer: Camera,
  Videographer: Camera,
};

const BIG_LEAGUE = ["Alcapone", "Bag DJs", "Steph Kapela", "Bensoul", "Karun", "Wakadinali"];

function TalentPage() {
  const [tab, setTab] = useState<(typeof TYPES)[number]>("All");
  const visible = tab === "All" ? ROSTER : ROSTER.filter((r) => r.type === tab);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
        <div className="eyebrow">Talent hub</div>
        <h1 className="font-display text-5xl md:text-7xl mt-3 leading-[0.95]">
          Get <span className="text-gold-gradient">scouted</span>.
          <br />
          Get <em className="font-italic italic font-normal">booked</em>.
        </h1>
        <p className="mt-5 max-w-xl text-foreground/70">
          DJs, artists, MCs, dancers, photographers and videographers — Sultan books fresh talent every week. Submit your work, we review and respond.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition ${tab === t ? "bg-gold text-night-deep border-gold" : "border-border/40 hover:border-gold text-foreground/70"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((r) => {
            const Icon = ICONS[r.type] ?? Music2;
            const available = r.status === "Available";
            return (
              <Link key={r.username} to="/talent/$username" params={{ username: r.username }} className="group glass rounded-3xl p-5 hover:border-gold/40 transition">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gold to-lava/60 flex items-center justify-center text-night-deep">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg truncate">{r.stage}</div>
                    <div className="text-[11px] uppercase tracking-wider text-foreground/55">{r.type}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs ${available ? "text-savanna" : "text-foreground/55"}`}>{r.status}</span>
                  <span className="text-xs text-gold inline-flex items-center gap-1">View <ArrowRight size={12} className="transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Big League Showcase */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-20">
        <div className="glass rounded-3xl p-8 lg:p-12 kente-border">
          <div className="eyebrow">Big League</div>
          <h2 className="font-display text-4xl md:text-5xl mt-3">Who we've worked with</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {BIG_LEAGUE.map((b) => (
              <span key={b} className="px-4 py-2 rounded-full border border-gold/30 text-foreground/80 font-display text-sm hover:bg-gold/10 transition">{b}</span>
            ))}
          </div>
          <Link to="/talent" className="mt-8 inline-flex items-center gap-2 text-gold hover:gap-3 transition-all">
            Join the league <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Application form */}
      <section className="mx-auto max-w-4xl px-5 lg:px-8 pb-32">
        <div className="glass rounded-3xl p-7 lg:p-10">
          <div className="eyebrow">Submit your portfolio</div>
          <h3 className="font-display text-3xl mt-3">Tell us why <span className="text-gold-gradient">Sultan</span>.</h3>
          <form onSubmit={(e) => e.preventDefault()} className="mt-8 grid sm:grid-cols-2 gap-3">
            <I label="Stage name" />
            <S label="Talent type" options={TYPES.filter((t) => t !== "All") as unknown as string[]} />
            <I label="Demo link (SoundCloud / YouTube)" placeholder="https://…" />
            <I label="Booking rate range (KES)" placeholder="e.g. 8,000 – 25,000" />
            <I label="Instagram" placeholder="@handle" />
            <I label="TikTok" placeholder="@handle" />
            <div className="sm:col-span-2">
              <label className="block">
                <span className="text-xs text-foreground/60">Why Sultan? (200 chars)</span>
                <textarea maxLength={200} rows={3} className="mt-1.5 w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none" />
              </label>
            </div>
            <button className="sm:col-span-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] inline-flex items-center justify-center gap-2">
              Submit <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function I({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-foreground/60">{label}</span>
      <input placeholder={placeholder} className="mt-1.5 w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
    </label>
  );
}
function S({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs text-foreground/60">{label}</span>
      <select className="mt-1.5 w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}
