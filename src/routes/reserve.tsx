import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Car, Check, Flame, Minus, Plus, Wine, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const packageSchema = z
  .enum(["solo", "duo", "squad", "vip", "sultan"])
  .catch("solo");

export const Route = createFileRoute("/reserve")({
  head: () => ({
    meta: [
      { title: "Reserve a Table — Sultan Park & Puff" },
      { name: "description", content: "Lock in your section, parking and shisha for the night. Pay via M-Pesa, get a QR confirmation on WhatsApp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    pkg: packageSchema.parse(s.pkg ?? "solo"),
  }),
  component: ReservePage,
});

const PACKAGES = {
  solo: { name: "Solo Vibe", capacity: "1", price: 700 },
  duo: { name: "Duo Pack", capacity: "2", price: 1200 },
  squad: { name: "Squad", capacity: "4–6", price: 4500 },
  vip: { name: "VIP Table", capacity: "6–10", price: 9000 },
  sultan: { name: "The Sultan", capacity: "10+", price: 18000 },
} as const;

// SHISHA / POT / BONG line items — all capped at KES 550 each
const SHISHA_MENU = [
  { id: "classic", name: "Classic Shisha", price: 450 },
  { id: "premium", name: "Premium Shisha (double-apple, mint, grape)", price: 550 },
  { id: "fruit", name: "Fruit Bowl Shisha (pineapple/melon)", price: 550 },
  { id: "pot", name: "Clay Pot", price: 500 },
  { id: "bong", name: "Glass Bong", price: 550 },
] as const;

const DRINKS = ["Kenya Cane", "Captain Morgan", "Tusker", "Whitecap", "Smirnoff", "Heineken", "Mocktail"];

const PARKING = [
  { id: "standard", name: "Standard sedan", price: 200 },
  { id: "suv", name: "SUV / crossover", price: 350 },
  { id: "premium", name: "Premium spot (near entrance)", price: 500 },
  { id: "convoy", name: "Convoy (3+ cars)", price: 800 },
];

function ReservePage() {
  const { pkg: initialPkg } = Route.useSearch();
  const [pkg, setPkg] = useState<keyof typeof PACKAGES>(initialPkg);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [shisha, setShisha] = useState<Record<string, number>>({});
  const [drinks, setDrinks] = useState<string[]>([]);
  const [parking, setParking] = useState<string | null>(null);
  const [carModel, setCarModel] = useState("");
  const [plate, setPlate] = useState("");
  const [arrival, setArrival] = useState("");
  const [special, setSpecial] = useState("");

  const total = useMemo(() => {
    const base = PACKAGES[pkg].price;
    const shishaTotal = Object.entries(shisha).reduce((s, [id, qty]) => {
      const item = SHISHA_MENU.find((m) => m.id === id);
      return s + (item ? item.price * qty : 0);
    }, 0);
    const parkingTotal = parking ? (PARKING.find((p) => p.id === parking)?.price ?? 0) : 0;
    return base + shishaTotal + parkingTotal;
  }, [pkg, shisha, parking]);

  const updateShisha = (id: string, delta: number) => {
    setShisha((s) => {
      const next = { ...s };
      const v = (next[id] ?? 0) + delta;
      if (v <= 0) delete next[id];
      else next[id] = Math.min(v, 10);
      return next;
    });
  };

  const submit = () => {
    if (!date) return toast.error("Pick a date for your reservation.");
    toast.success("Reservation locked. We'll WhatsApp your QR confirmation.");
  };

  return (
    <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20 lg:py-28">
      <div className="eyebrow">Advance reservation</div>
      <h1 className="font-display text-5xl md:text-6xl mt-3 leading-[0.95]">
        Lock your <span className="text-gold-gradient">section</span>.
      </h1>
      <p className="mt-3 text-foreground/70 max-w-xl">
        Pay a small deposit via M-Pesa, get a QR code on WhatsApp, walk in like the night belongs to you.
      </p>

      <div className="mt-12 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* FORM */}
        <div className="space-y-6">
          {/* Package */}
          <div className="glass rounded-3xl p-6">
            <div className="eyebrow">1 · Choose package</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {(Object.keys(PACKAGES) as Array<keyof typeof PACKAGES>).map((k) => {
                const p = PACKAGES[k];
                const active = pkg === k;
                return (
                  <button
                    key={k}
                    onClick={() => setPkg(k)}
                    className={`text-left rounded-2xl p-4 border transition ${active ? "border-gold bg-gold/10" : "border-border/40 hover:border-foreground/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-display text-lg">{p.name}</div>
                      {active && <Check size={16} className="text-gold" />}
                    </div>
                    <div className="text-xs text-foreground/55 mt-1">For {p.capacity} · KES {p.price.toLocaleString()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date / time */}
          <div className="glass rounded-3xl p-6">
            <div className="eyebrow">2 · Date & time</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="block">
                <span className="text-xs text-foreground/60">Date</span>
                <div className="mt-1 flex items-center gap-2 bg-night/50 border border-border/50 rounded-2xl px-3">
                  <Calendar size={14} className="text-gold" />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-transparent py-3 text-sm focus:outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs text-foreground/60">Arrival time</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none" />
              </label>
            </div>
          </div>

          {/* Shisha */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow flex items-center gap-2"><Flame size={12} /> 3 · Shisha · pots · bongs</div>
                <p className="text-xs text-foreground/55 mt-1">Every item capped at <span className="text-gold">KES 550</span>.</p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-border/30">
              {SHISHA_MENU.map((s) => {
                const qty = shisha[s.id] ?? 0;
                return (
                  <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm">{s.name}</div>
                      <div className="text-xs text-gold">KES {s.price}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateShisha(s.id, -1)} className="h-8 w-8 rounded-full border border-border/50 hover:border-gold flex items-center justify-center" aria-label="Decrease">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                      <button onClick={() => updateShisha(s.id, 1)} className="h-8 w-8 rounded-full border border-border/50 hover:border-gold flex items-center justify-center" aria-label="Increase">
                        <Plus size={12} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Drinks */}
          <div className="glass rounded-3xl p-6">
            <div className="eyebrow flex items-center gap-2"><Wine size={12} /> 4 · Drinks (included with package)</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {DRINKS.map((d) => {
                const active = drinks.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => setDrinks((s) => (active ? s.filter((x) => x !== d) : [...s, d]))}
                    className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border transition ${active ? "bg-gold text-night-deep border-gold" : "border-border/40 hover:border-gold text-foreground/70"}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parking */}
          <div className="glass rounded-3xl p-6">
            <div className="eyebrow flex items-center gap-2"><Car size={12} /> 5 · Parking (optional)</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {PARKING.map((p) => {
                const active = parking === p.id;
                return (
                  <button key={p.id} onClick={() => setParking(active ? null : p.id)} className={`text-left rounded-2xl p-3 border transition ${active ? "border-gold bg-gold/10" : "border-border/40 hover:border-foreground/30"}`}>
                    <div className="text-sm">{p.name}</div>
                    <div className="text-xs text-gold mt-0.5">KES {p.price}</div>
                  </button>
                );
              })}
            </div>
            {parking && (
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                <input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Car model" className="bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
                <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="KAA 123A" className="bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm uppercase tracking-wider focus:outline-none focus:border-gold" />
                <input value={arrival} onChange={(e) => setArrival(e.target.value)} type="time" className="bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="glass rounded-3xl p-6">
            <div className="eyebrow">6 · Special requests</div>
            <textarea value={special} onChange={(e) => setSpecial(e.target.value)} maxLength={400} rows={3} placeholder="Birthday setup, accessible spot, decorations…" className="mt-3 w-full bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none" />
          </div>
        </div>

        {/* SUMMARY */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="glass rounded-3xl p-6 kente-border">
            <div className="eyebrow">Your night</div>
            <div className="mt-3 font-display text-2xl">{PACKAGES[pkg].name}</div>
            <div className="text-xs text-foreground/55">For {PACKAGES[pkg].capacity}</div>

            <div className="border-t border-border/40 mt-5 pt-5 space-y-2 text-sm">
              <Row label="Package" value={`KES ${PACKAGES[pkg].price.toLocaleString()}`} />
              {Object.entries(shisha).map(([id, qty]) => {
                const m = SHISHA_MENU.find((s) => s.id === id)!;
                return <Row key={id} label={`${m.name} × ${qty}`} value={`KES ${(m.price * qty).toLocaleString()}`} />;
              })}
              {parking && <Row label={`Parking · ${PARKING.find((p) => p.id === parking)?.name}`} value={`KES ${PARKING.find((p) => p.id === parking)?.price}`} />}
            </div>

            <div className="border-t border-border/40 mt-5 pt-5 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-foreground/60">Total</span>
              <span className="font-display text-3xl text-gold-gradient">KES {total.toLocaleString()}</span>
            </div>

            <button onClick={submit} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition">
              Pay deposit via M-Pesa <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-[11px] text-foreground/50 text-center leading-relaxed">
              We'll send an STK push to your registered M-Pesa number. Balance settled at the door.
            </p>
          </div>

          <Link to="/vibe" className="block text-xs text-foreground/55 hover:text-gold text-center">
            <Sparkles size={12} className="inline mr-1" /> Compare packages first
          </Link>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-foreground/65 truncate">{label}</span>
      <span className="text-foreground tabular-nums shrink-0">{value}</span>
    </div>
  );
}
