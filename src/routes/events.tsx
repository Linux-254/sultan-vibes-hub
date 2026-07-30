import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Users, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type DjEntry } from "@/components/DjPicker";
import { MpesaPayment } from "@/components/MpesaPayment";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type SiteEvent = {
  slug: string;
  title: string;
  event_date: string;
  image_url: string | null;
  tags: string[];
  djs: DjEntry[] | string | null;
  going_count: number;
  featured: boolean;
};

type SpecialEvent = {
  id: string;
  name: string;
  description: string | null;
  ticket_price: number;
  requires_payment: boolean;
  event_date: string;
  event_time: string | null;
};

function formatDjs(djs: SiteEvent["djs"]): string {
  if (!djs) return "";
  if (typeof djs === "string") return djs;
  return djs.map((dj) => dj.name).filter(Boolean).join(", ");
}

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Upcoming Events — Empire Kwa Sultan" },
      {
        name: "description",
        content:
          "Afro House, Amapiano, live sax sessions and more. Browse upcoming nights at Empire Kwa Sultan in Nairobi.",
      },
      {
        name: "keywords",
        content:
          "Nairobi events, nightlife events Kenya, Afro House Nairobi, Amapiano event, live music Nairobi, DJ night Kenya, Empire Kwa Sultan events",
      },
      { property: "og:title", content: "Upcoming Events at Empire" },
      { property: "og:description", content: "Browse upcoming nights and reserve your table." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<{ event: SpecialEvent; qty: number } | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const [siteRes, specialRes] = await Promise.all([
        supabase.from("site_events").select("*").order("sort_order", { ascending: true }),
        supabase.from("special_events").select("id, name, description, ticket_price, requires_payment, event_date, event_time").gte("event_date", new Date().toISOString().slice(0, 10)).order("event_date"),
      ]);
      if (siteRes.data) setEvents(siteRes.data as SiteEvent[]);
      if (specialRes.data) setSpecialEvents(specialRes.data as SpecialEvent[]);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const handleTicketPurchase = async (paymentId: string) => {
    if (!buying || !user) return;
    const { error } = await supabase.from("ticket_purchases").insert({
      user_id: user.id,
      event_id: buying.event.id,
      quantity: buying.qty,
      amount: buying.event.ticket_price * buying.qty,
      status: "completed",
      payment_id: paymentId,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${buying.qty} ticket${buying.qty > 1 ? "s" : ""} purchased!`);
    setBuying(null);
  };

  const featured = events.find((e) => e.featured) || events[0];
  const rest = events.filter((e) => e !== featured);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 lg:px-8 pt-16 pb-12">
        <div className="eyebrow">What's On</div>
        <h1 className="font-display text-5xl md:text-7xl mt-3">
          Upcoming <span className="text-gold-gradient">Nights.</span>
        </h1>
        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-muted/20 h-96 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const daysOut = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-16 pb-12">
        <div className="eyebrow">What's On</div>
        <h1 className="font-display text-5xl md:text-7xl mt-3">
          Upcoming <span className="text-gold-gradient">Nights.</span>
        </h1>
        <p className="mt-4 text-foreground/70 max-w-xl">
          Reserve early — Saturdays at Empire sell out by Wednesday.
        </p>
      </section>

      {featured && (
        <section className="mx-auto max-w-7xl px-5 lg:px-8">
          <article className="relative rounded-3xl overflow-hidden glass kente-border">
            <div className="grid lg:grid-cols-[1.4fr_1fr]">
              <div className="relative aspect-[5/3] lg:aspect-auto overflow-hidden">
                {featured.image_url ? (
                  <img
                    src={featured.image_url}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gold/20 via-lava/30 to-night-deep" />
                )}
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-lava px-3 py-1 text-xs font-mono uppercase text-cream gold-pulse">
                  In {daysOut(featured.event_date)} days
                </div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col gap-6 justify-between">
                <div>
                  <div className="eyebrow flex items-center gap-2">
                    <Calendar size={12} /> {featured.event_date}
                  </div>
                  <h2 className="font-display text-4xl lg:text-5xl mt-3">
                    <span className="text-gold-gradient">{featured.title}</span>
                  </h2>
                  <p className="mt-4 text-foreground/70">{formatDjs(featured.djs)}</p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    {(featured.tags || []).map((t: string) => (
                      <span
                        key={t}
                        className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-gold/30 text-gold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)]">
                    Reserve a table
                  </button>
                  <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
                    <Users size={14} /> {featured.going_count} going
                  </span>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid sm:grid-cols-2 gap-6">
        {rest.map((e) => (
          <article
            key={e.slug}
            className="group relative rounded-2xl overflow-hidden glass border border-border/40"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {e.image_url ? (
                <img
                  src={e.image_url}
                  alt={e.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gold/20 via-lava/30 to-night-deep" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-night-deep/30 to-transparent" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-mono uppercase tracking-wider">
                In {daysOut(e.event_date)} days
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="eyebrow">{e.event_date}</div>
                <h3 className="font-display text-3xl mt-2 text-foreground">{e.title}</h3>
                <p className="text-sm text-foreground/70 mt-1">{formatDjs(e.djs)}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(e.tags || []).map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold/30 text-gold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Users size={12} /> {e.going_count} going
                  </span>
                  <button className="text-xs font-medium text-gold hover:underline">
                    Reserve →
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Special events with tickets */}
      {specialEvents.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-16">
          <div className="border-t border-border/30 pt-12">
            <div className="eyebrow">Tickets</div>
            <h2 className="font-display text-4xl mt-3">
              Upcoming <span className="text-gold-gradient">Paid Events</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              {specialEvents.map((e) => (
                <div key={e.id} className="glass rounded-3xl p-5 border border-border/30">
                  <h3 className="font-display text-xl">{e.name}</h3>
                  <div className="text-xs text-foreground/50 mt-1">
                    {e.event_date}{e.event_time ? ` · ${e.event_time}` : ""}
                  </div>
                  {e.description && <p className="text-sm text-foreground/70 mt-2">{e.description}</p>}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                    <span className="font-mono text-gold font-semibold">KES {Number(e.ticket_price).toLocaleString()}</span>
                    {e.requires_payment ? (
                      <button
                        onClick={() => { if (!user) { toast.error("Sign in to buy tickets"); return; } setBuying({ event: e, qty: 1 }); }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-night-deep hover:opacity-90 transition"
                      >
                        <Ticket size={12} /> Buy Ticket
                      </button>
                    ) : (
                      <span className="text-xs text-savanna font-medium">Free</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {buying && (
        <MpesaPayment
          amount={buying.event.ticket_price * buying.qty}
          reference={`EVT-${buying.event.id.slice(0, 8)}`}
          description={buying.event.name}
          onSuccess={handleTicketPurchase}
          onClose={() => setBuying(null)}
          open={true}
        />
      )}
    </>
  );
}
