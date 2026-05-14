import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Music2 } from "lucide-react";

export const Route = createFileRoute("/talent/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.username)} — Sultan Talent` },
      { name: "description", content: `${prettify(params.username)} on the Sultan Park & Puff talent roster.` },
    ],
  }),
  component: TalentProfile,
});

function prettify(u: string) {
  return u.split("-").map((s) => s[0]?.toUpperCase() + s.slice(1)).join(" ");
}

function TalentProfile() {
  const { username } = Route.useParams();
  const name = prettify(username);
  return (
    <section className="mx-auto max-w-5xl px-5 lg:px-8 py-20">
      <Link to="/talent" className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-gold mb-8">
        <ArrowLeft size={12} /> Back to roster
      </Link>

      <div className="grid lg:grid-cols-[200px_1fr] gap-8 items-start">
        <div className="aspect-square rounded-3xl bg-gradient-to-br from-gold to-lava/60 flex items-center justify-center text-night-deep">
          <Music2 size={64} />
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider text-savanna">Available</span>
          <h1 className="font-display text-5xl md:text-6xl mt-2">{name}</h1>
          <p className="mt-4 text-foreground/70 max-w-xl">
            Resident sound. Catch their next set on the Sultan calendar or book them direct via admin.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/chat" className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep inline-flex items-center gap-1.5">
              <MessageCircle size={14} /> Book {name}
            </Link>
            <Link to="/events" className="rounded-full border border-border/40 px-5 py-2.5 text-sm hover:border-gold">See upcoming sets</Link>
          </div>
        </div>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-4">
        <div className="aspect-video rounded-2xl glass kente-border flex items-center justify-center text-foreground/40 text-sm">
          Demo embed
        </div>
        <div className="aspect-video rounded-2xl glass kente-border flex items-center justify-center text-foreground/40 text-sm">
          Live set clip
        </div>
      </div>
    </section>
  );
}
