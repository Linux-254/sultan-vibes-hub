import { createFileRoute, Link } from "@tanstack/react-router";
import summerImg from "@/assets/summer-tides.jpg";
import event3 from "@/assets/event-3.jpg";
import { Countdown } from "@/components/Countdown";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/summer-tides")({
  head: () => ({
    meta: [
      { title: "Summer Tides 2025 — Sultan Park & Puff" },
      { name: "description", content: "Six weeks. One island. The biggest sound system Sultan has ever assembled. Get early access." },
      { property: "og:title", content: "Summer Tides 2025" },
      { property: "og:description", content: "Sultan's biggest summer campaign ever. Drop your number for early access." },
    ],
  }),
  component: SummerTides,
});

function SummerTides() {
  const launch = new Date(Date.now() + 56 * 86_400_000);

  return (
    <>
      <section className="relative min-h-[90svh] overflow-hidden wave-bg">
        <div className="absolute inset-0">
          <img src={summerImg} alt="" className="h-full w-full object-cover opacity-50 mix-blend-overlay" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-night-deep/30 via-transparent to-night-deep" />
        </div>
        <div className="absolute inset-0 grain" />
        <div className="relative mx-auto max-w-6xl px-5 lg:px-8 py-32 text-center min-h-[90svh] flex flex-col justify-center">
          <div className="eyebrow rise">Sultan Park & Puff Presents</div>
          <h1 className="rise rise-1 font-display text-6xl sm:text-8xl lg:text-[10rem] leading-[0.92] mt-4">
            <span className="text-gold-gradient">SUMMER</span>
            <br />
            <span className="font-italic italic font-normal">tides</span>
          </h1>
          <p className="rise rise-2 mt-8 max-w-2xl mx-auto text-lg text-foreground/80">
            The ocean is coming inland. Six weeks of curated nights, secret lineups, and the kind of summer Nairobi only gets once.
          </p>
          <div className="rise rise-3 mt-12 max-w-xl mx-auto w-full">
            <Countdown target={launch} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 lg:px-8 py-24 text-center">
        <p className="font-italic italic text-2xl md:text-4xl text-foreground/85 leading-snug">
          "We weren't built for ordinary summers. We were built for the night a wave rolls into Nairobi and refuses to leave. <span className="text-gold-gradient">This is that night, for six weeks.</span>"
        </p>
        <div className="eyebrow mt-6">— The Sultan Manifesto</div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden kente-border">
          <img src={event3} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-night-deep/80 via-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="eyebrow">The Lineup</div>
            <p className="font-display text-3xl mt-2 blur-md select-none">DJ ████████ · ████ ███████ · █████</p>
            <p className="text-xs text-muted-foreground mt-2">Revealed in 4 weeks</p>
          </div>
        </div>

        <div>
          <div className="eyebrow">Get on the list</div>
          <h2 className="font-display text-4xl md:text-5xl mt-3">
            First <span className="text-gold-gradient">100 names</span> walk in free.
          </h2>
          <p className="mt-4 text-foreground/70">
            Drop your number. We'll WhatsApp you when tickets go live, and the first 100 of you don't pay a single shilling at the door.
          </p>
          <form className="mt-8 space-y-3">
            <input
              type="text"
              placeholder="Your name"
              className="w-full bg-night/60 border border-border/60 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-gold"
            />
            <input
              type="tel"
              placeholder="+254 7XX XXX XXX"
              className="w-full bg-night/60 border border-border/60 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-gold"
            />
            <button
              type="button"
              className="w-full rounded-2xl bg-gold px-6 py-4 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition flex items-center justify-center gap-2"
            >
              Lock my early access <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-24 grid sm:grid-cols-3 gap-6">
        {[
          { t: "Curated Nights", d: "Six themed weekends. Each one a different sound, a different story." },
          { t: "Secret Sets", d: "Headliners revealed week-of. The lineup is the surprise." },
          { t: "Limited Merch", d: "A capsule drop you'll never see again. Embroidered, numbered, gone." },
        ].map((c) => (
          <div key={c.t} className="glass rounded-2xl p-6 kente-border">
            <div className="font-display text-2xl text-gold-gradient">{c.t}</div>
            <p className="mt-2 text-sm text-foreground/70">{c.d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
