import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/collabs/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} × Sultan — Collab` },
      { name: "description", content: `${prettify(params.slug)} is a Sultan Park & Puff collaboration partner.` },
    ],
  }),
  component: CollabPage,
});

function prettify(slug: string) {
  return slug.split("-").map((s) => s[0]?.toUpperCase() + s.slice(1)).join(" ");
}

function CollabPage() {
  const { slug } = Route.useParams();
  const name = prettify(slug);

  return (
    <section className="mx-auto max-w-5xl px-5 lg:px-8 py-20">
      <Link to="/collabs" className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-gold mb-8">
        <ArrowLeft size={12} /> All collabs
      </Link>

      <div className="grid lg:grid-cols-[180px_1fr] gap-8 items-start">
        <div className="h-44 w-44 rounded-3xl bg-gradient-to-br from-gold to-lava/60 flex items-center justify-center font-display text-7xl text-night-deep">
          {name[0]}
        </div>
        <div>
          <div className="eyebrow">Collab partner</div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">{name}</h1>
          <p className="mt-4 text-foreground/70 max-w-xl">
            Working with Sultan since 2024. Catch their drops in the shop and look out for activations on event nights.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep">Shop their products</Link>
            <Link to="/chat" className="rounded-full border border-border/40 px-5 py-2.5 text-sm hover:border-gold inline-flex items-center gap-1.5">
              <MessageCircle size={14} /> Work with us
            </Link>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-foreground/55">
            <span className="h-1.5 w-1.5 rounded-full bg-savanna" />
            A share of every sale supports Sultan's room.
          </div>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl glass kente-border" />
        ))}
      </div>
    </section>
  );
}
