import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Download, Lock, Search, Video, X, Smartphone, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MpesaPayment } from "@/components/MpesaPayment";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import event1 from "@/assets/event-1.webp";
import event2 from "@/assets/event-2.webp";
import event3 from "@/assets/event-3.webp";

export const Route = createFileRoute("/recap")({
  head: () => ({
    meta: [
      { title: "Recap — Empire Kwa Sultan" },
      {
        name: "description",
        content:
          "Find your night at Empire. Photos and videos from past events — preview free, download via M-Pesa.",
      },
      {
        name: "keywords",
        content:
          "Nairobi nightlife photos, event recap Kenya, shisha lounge pictures, Empire Kwa Sultan recap, event videos Nairobi",
      },
      { property: "og:title", content: "Recap — find your night" },
      {
        property: "og:description",
        content: "Photos and videos from past events. Preview free, download via M-Pesa.",
      },
    ],
  }),
  component: RecapPage,
});

type RecapEvent = {
  id: string;
  name: string;
  event_date: string;
  cover_url: string | null;
  photo_count: number;
  video_count: number;
  bundle_price: number;
  sort_order: number;
};

type RecapMedia = {
  id: string;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  free_preview: boolean;
  unlock_price: number;
  sort_order: number;
};

const FALLBACK_EVENTS: RecapEvent[] = [
  {
    id: "1",
    name: "Afro House Takeover",
    event_date: "May 4, 2026",
    cover_url: event1,
    photo_count: 184,
    video_count: 22,
    bundle_price: 700,
    sort_order: 0,
  },
  {
    id: "2",
    name: "Amapiano Sundays vol. 12",
    event_date: "Apr 27, 2026",
    cover_url: event2,
    photo_count: 96,
    video_count: 14,
    bundle_price: 500,
    sort_order: 1,
  },
  {
    id: "3",
    name: "Big League · DJ Kanyali",
    event_date: "Apr 19, 2026",
    cover_url: event3,
    photo_count: 220,
    video_count: 31,
    bundle_price: 700,
    sort_order: 2,
  },
];

const UNLOCK_KEY = "empire_recap_unlocked_v1";

function getUnlocked(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function RecapPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [events, setEvents] = useState<RecapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RecapEvent | null>(null);
  const [media, setMedia] = useState<RecapMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>(getUnlocked);
  const [buyingBundle, setBuyingBundle] = useState(false);
  const [buyingItem, setBuyingItem] = useState<RecapMedia | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("recap_events")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data && data.length > 0) {
        setEvents(data as RecapEvent[]);
      } else {
        setEvents(FALLBACK_EVENTS);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadMedia = async (eventId: string) => {
    setMediaLoading(true);
    setSelected(events.find((e) => e.id === eventId) ?? null);
    const { data, error } = await supabase
      .from("recap_media")
      .select("*")
      .eq("recap_event_id", eventId)
      .order("sort_order", { ascending: true });
    if (!error && data && data.length > 0) {
      setMedia(data as RecapMedia[]);
    } else {
      setMedia([]);
    }
    setMediaLoading(false);
  };

  const filtered = events.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  const isUnlocked = (eventId: string) => !!unlocked[eventId];

  const markUnlocked = (eventId: string) => {
    const next = { ...unlocked, [eventId]: true };
    setUnlocked(next);
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(next));
  };

  const onBundleSuccess = async () => {
    if (!selected) return;
    markUnlocked(selected.id);
    setBuyingBundle(false);
    toast.success(`Recap bundle unlocked for ${selected.name}`);
  };

  const onItemSuccess = async () => {
    if (!buyingItem || !selected) return;
    setBuyingItem(null);
    toast.success("Media item unlocked!");
  };

  const totalLocked = useMemo(() => media.filter((m) => !m.free_preview).length, [media]);

  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
      <div className="eyebrow">Recap</div>
      <div className="mt-3 flex items-end justify-between flex-wrap gap-6">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-2xl">
          Find your <span className="text-gold-gradient">night</span>.
        </h1>
        <div className="text-sm text-foreground/65 max-w-sm">
          Watermarked previews are free. Pay-once via M-Pesa to unlock the full-res downloads.
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3 max-w-md glass rounded-2xl px-4">
        <Search size={16} className="text-gold" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by event name…"
          className="flex-1 bg-transparent py-3 text-sm focus:outline-none"
        />
      </div>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((e) => {
          const unlockedEv = isUnlocked(e.id);
          return (
            <button
              key={e.id}
              onClick={() => loadMedia(e.id)}
              className="text-left group glass rounded-3xl overflow-hidden kente-border transition hover:border-gold/50"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {e.cover_url ? (
                  <img
                    src={e.cover_url}
                    alt={e.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gold/15 via-night to-lava/10 flex items-center justify-center">
                    <Camera size={40} className="text-gold/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-night-deep/20 to-transparent" />
                {unlockedEv && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-savanna/90 px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono text-night-deep">
                    <Check size={11} /> Unlocked
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-[10px] uppercase tracking-wider font-mono text-foreground/80">
                  <span className="inline-flex items-center gap-1">
                    <Camera size={12} /> {e.photo_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Video size={12} /> {e.video_count}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs text-foreground/55">{e.event_date}</div>
                <div className="font-display text-xl mt-1">{e.name}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-foreground/55">
                    Bundle from <span className="text-gold">KES {e.bundle_price}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-gold">
                    Browse <Download size={12} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-foreground/50 text-sm">
            No recaps match "{q}".
          </div>
        )}
      </div>

      {/* Gallery modal */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="eyebrow">{selected.event_date}</div>
                <h2 className="font-display text-2xl sm:text-3xl mt-1">{selected.name}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close gallery"
                className="h-10 w-10 grid place-items-center rounded-xl border border-border/50 hover:border-gold transition shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {isUnlocked(selected.id) ? (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-savanna/15 text-savanna text-xs px-3 py-1.5 font-mono uppercase tracking-wider">
                <Check size={12} /> Bundle unlocked — full-res media ready to download
              </div>
            ) : (
              <button
                onClick={() => setBuyingBundle(true)}
                className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
              >
                <Lock size={14} /> Unlock full bundle · KES {selected.bundle_price}
              </button>
            )}

            {mediaLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[4/3] rounded-2xl bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : media.length === 0 ? (
              <div className="glass rounded-3xl p-14 text-center text-foreground/50 text-sm">
                No media has been uploaded for this event yet. Check back soon.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((m) => {
                  const isFree = m.free_preview || isUnlocked(selected.id);
                  const src = m.thumbnail_url || m.url;
                  return (
                    <div key={m.id} className="relative group">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-night/60">
                        <img
                          src={src}
                          alt=""
                          className={`h-full w-full object-cover ${isFree ? "" : "blur-[6px] scale-105 brightness-75"}`}
                          loading="lazy"
                        />
                      </div>
                      {!isFree && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <Lock size={22} className="text-gold" />
                          <span className="text-xs text-foreground/80">
                            KES {m.unlock_price} to download
                          </span>
                          <button
                            onClick={() => setBuyingItem(m)}
                            className="rounded-full bg-gold px-4 py-1.5 text-[11px] font-semibold text-night-deep hover:opacity-90 transition"
                          >
                            <Smartphone size={11} className="inline mr-1 -mt-0.5" />
                            Unlock
                          </button>
                        </div>
                      )}
                      {isFree && (
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono text-white/85">
                            {m.media_type === "video" ? <Video size={10} /> : <Camera size={10} />}
                            {m.free_preview ? "Preview" : "Full"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalLocked > 0 && !isUnlocked(selected.id) && (
              <p className="mt-6 text-xs text-foreground/50 max-w-xl">
                {totalLocked} premium {totalLocked === 1 ? "item" : "items"} are locked. Unlock the
                whole bundle once for {selected.name} and get everything — no per-item charges after
                that.
              </p>
            )}
          </div>
        </div>
      )}

      {selected && buyingBundle && (
        <MpesaPayment
          amount={selected.bundle_price}
          reference={`RECAP-${selected.id.slice(0, 8).toUpperCase()}`}
          description={`Recap bundle · ${selected.name}`}
          onSuccess={onBundleSuccess}
          onClose={() => setBuyingBundle(false)}
          open={true}
        />
      )}

      {buyingItem && (
        <MpesaPayment
          amount={buyingItem.unlock_price}
          reference={`MEDIA-${buyingItem.id.slice(0, 8).toUpperCase()}`}
          description={`Recap media · ${selected?.name ?? ""}`}
          onSuccess={onItemSuccess}
          onClose={() => setBuyingItem(null)}
          open={true}
        />
      )}

      <div className="mt-16 glass rounded-3xl p-7 lg:p-10 kente-border max-w-3xl">
        <Lock className="text-gold" />
        <h3 className="font-display text-2xl mt-3">
          Find My Photos ·{" "}
          <span className="text-foreground/60 font-italic italic font-normal">coming soon</span>
        </h3>
        <p className="mt-2 text-sm text-foreground/65 max-w-xl">
          Upload a selfie, we'll surface every shot you're in across every Empire event. Strictly
          opt-in. Compliant with Kenya Data Protection Act 2019.
        </p>
      </div>
    </section>
  );
}
