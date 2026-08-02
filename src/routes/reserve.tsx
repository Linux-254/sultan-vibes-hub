import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Car, Check, Crown } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ReserveCalendar } from "@/components/ReserveCalendar";
import { ProductDrinksPicker, type DrinkEntry } from "@/components/ProductDrinksPicker";
import { ProductShishaPicker, type ShishaEntry } from "@/components/ProductShishaPicker";
import { MpesaPayment } from "@/components/MpesaPayment";
import { supabase } from "@/integrations/supabase/client";

const packageSchema = z.enum(["solo", "duo", "squad", "vip", "sultan"]);

export const Route = createFileRoute("/reserve")({
  head: () => ({
    meta: [
      { title: "Reserve a Table — Empire Kwa Sultan" },
      {
        name: "description",
        content:
          "Lock in your section, parking and shisha for the night. Pay via M-Pesa, get a QR confirmation on WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: z.object({
    pkg: packageSchema.catch("solo").optional(),
  }).parse,
  component: ReservePage,
});

function ReservePage() {
  return (
    <RequireAuth>
      <ReservePageInner />
    </RequireAuth>
  );
}

type PkgMap = Record<string, { name: string; capacity: string; price: number }>;
type ParkingOpt = { id: string; name: string; price: number };
type DepositCfg = { type: string; value: number; min_amount: number };

const DEFAULT_PACKAGES: PkgMap = {
  solo: { name: "Solo Vibe", capacity: "1", price: 700 },
  duo: { name: "Duo Pack", capacity: "2", price: 1200 },
  squad: { name: "Squad", capacity: "4–6", price: 4500 },
  vip: { name: "VIP Table", capacity: "6–10", price: 9000 },
  sultan: { name: "The Empire", capacity: "10+", price: 18000 },
};

const DEFAULT_PARKING: ParkingOpt[] = [
  { id: "standard", name: "Standard sedan", price: 200 },
  { id: "suv", name: "SUV / crossover", price: 350 },
  { id: "premium", name: "Premium spot (near entrance)", price: 500 },
  { id: "convoy", name: "Convoy (3+ cars)", price: 800 },
];

const DEFAULT_DEPOSIT: DepositCfg = { type: "percentage", value: 30, min_amount: 500 };

function ReservePageInner() {
  const { pkg: initialPkg } = Route.useSearch();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PkgMap>(DEFAULT_PACKAGES);
  const [parkingOpts, setParkingOpts] = useState<ParkingOpt[]>(DEFAULT_PARKING);
  const [depositCfg, setDepositCfg] = useState<DepositCfg>(DEFAULT_DEPOSIT);
  const [cfgLoaded, setCfgLoaded] = useState(false);
  const [pkg, setPkg] = useState<keyof PkgMap>(initialPkg ?? "solo");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [shisha, setShisha] = useState<ShishaEntry[]>([]);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [parking, setParking] = useState<string | null>(null);
  const [carModel, setCarModel] = useState("");
  const [plate, setPlate] = useState("");
  const [arrival, setArrival] = useState("");
  const [special, setSpecial] = useState("");
  const [showMpesa, setShowMpesa] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("pricing_config")
      .select("key, value")
      .then(({ data }) => {
        if (!data) return;
        for (const row of data) {
          if (row.key === "packages")
            setPackages({ ...DEFAULT_PACKAGES, ...(row.value as PkgMap) });
          if (row.key === "parking_options") setParkingOpts(row.value as ParkingOpt[]);
          if (row.key === "deposit") setDepositCfg(row.value as DepositCfg);
        }
        setCfgLoaded(true);
      });
  }, []);

  const pkgKey = pkg as keyof PkgMap;
  const activePkg = packages[pkgKey] ?? packages.solo;

  const total = useMemo(() => {
    const base = activePkg.price;
    const shishaTotal = shisha.reduce((s, item) => s + item.price * item.quantity, 0);
    const drinksTotal = drinks.reduce((s, d) => s + d.price * d.quantity, 0);
    const parkingTotal = parking ? (parkingOpts.find((p) => p.id === parking)?.price ?? 0) : 0;
    return base + shishaTotal + drinksTotal + parkingTotal;
  }, [activePkg, shisha, drinks, parking, parkingOpts]);

  const MIN_DEPOSIT = depositCfg.min_amount;
  const depositPct = depositCfg.type === "percentage" ? depositCfg.value / 100 : 1;
  const depositFlat = depositCfg.type === "flat" ? depositCfg.value : 0;
  const deposit =
    depositCfg.type === "flat"
      ? Math.min(Math.max(depositFlat, MIN_DEPOSIT), total)
      : Math.min(Math.max(Math.round(total * depositPct), MIN_DEPOSIT), total);

  const submit = async () => {
    if (!date) return toast.error("Pick a date for your reservation.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in first");
      setBusy(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("id", user.id)
      .single();
    setBusy(false);
    setShowMpesa(true);
  };

  const onPaymentSuccess = async (paymentId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("id", user.id)
      .single();
    const capacityMap: Record<string, number> = { solo: 1, duo: 2, squad: 6, vip: 10, sultan: 15 };
    const { error } = await supabase.from("reservations").insert({
      user_id: user.id,
      full_name: profile?.display_name ?? user.email ?? "Guest",
      phone: profile?.phone ?? "",
      party_size: capacityMap[pkg] ?? 2,
      reservation_date: date,
      reservation_time: time,
      table_preference: activePkg.name,
      special_requests: special || null,
      deposit_amount: deposit,
      drinks: drinks.length > 0 ? drinks : null,
      status: "pending",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reservation confirmed! Check your phone for the STK receipt.");
    navigate({ to: "/profile" });
  };

  return (
    <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20 lg:py-28 min-w-0">
      <MpesaPayment
        amount={deposit}
        reference={`RES-${pkg.toUpperCase()}`}
        description="Empire reservation deposit"
        onSuccess={onPaymentSuccess}
        onClose={() => setShowMpesa(false)}
        open={showMpesa}
      />
      <div className="eyebrow">Advance reservation</div>
      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-3 leading-[0.95]">
        Lock your <span className="text-gold-gradient">section</span>.
      </h1>
      <p className="mt-3 text-foreground/70 max-w-xl">
        Pay a small deposit via M-Pesa, get a QR code on WhatsApp, walk in like the night belongs to
        you.
      </p>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start min-w-0">
        {/* FORM */}
        <div className="space-y-6">
          {/* Package */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="eyebrow">1 · Choose package</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {(Object.keys(packages) as Array<keyof PkgMap>).map((k) => {
                const p = packages[k];
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
                    <div className="text-xs text-foreground/55 mt-1">
                      For {p.capacity} · KES {p.price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date / time */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="eyebrow">2 · Date & time</div>
            <div className="mt-3">
              <ReserveCalendar
                date={date}
                onDateChange={setDate}
                time={time}
                onTimeChange={setTime}
              />
            </div>
          </div>

          {/* Shisha */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <ProductShishaPicker value={shisha} onChange={setShisha} />
          </div>

          {/* Drinks */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <ProductDrinksPicker value={drinks} onChange={setDrinks} />
          </div>

          {/* Parking */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="eyebrow flex items-center gap-2">
              <Car size={12} /> 5 · Parking (optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {parkingOpts.map((p) => {
                const active = parking === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setParking(active ? null : p.id)}
                    className={`text-left rounded-2xl p-3 border transition ${active ? "border-gold bg-gold/10" : "border-border/40 hover:border-foreground/30"}`}
                  >
                    <div className="text-sm">{p.name}</div>
                    <div className="text-xs text-gold mt-0.5">KES {p.price}</div>
                  </button>
                );
              })}
            </div>
            {parking && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <input
                  name="car-model"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="Car model"
                  className="bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
                <input
                  name="plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="KAA 123A"
                  className="bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm uppercase tracking-wider focus:outline-none focus:border-gold"
                />
                <input
                  name="arrival-time"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  type="time"
                  className="bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="eyebrow">6 · Special requests</div>
            <textarea
              name="special-requests"
              value={special}
              onChange={(e) => setSpecial(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="Birthday setup, accessible spot, decorations…"
              className="mt-3 w-full bg-night/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
            />
          </div>
        </div>

        {/* SUMMARY */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="glass rounded-3xl p-5 sm:p-6 kente-border">
            <div className="eyebrow">Your night</div>
            <div className="mt-3 font-display text-2xl">{activePkg.name}</div>
            <div className="text-xs text-foreground/55">For {activePkg.capacity}</div>

            <div className="border-t border-border/40 mt-5 pt-5 space-y-2 text-sm">
              <Row label="Package" value={`KES ${activePkg.price.toLocaleString()}`} />
              {shisha.map((s) => (
                <Row
                  key={s.product_id}
                  label={`${s.name} × ${s.quantity}`}
                  value={`KES ${(s.price * s.quantity).toLocaleString()}`}
                />
              ))}
              {drinks.map((d) => (
                <Row
                  key={d.product_id}
                  label={`${d.name} × ${d.quantity}`}
                  value={`KES ${(d.price * d.quantity).toLocaleString()}`}
                />
              ))}
              {parking && (
                <Row
                  label={`Parking · ${parkingOpts.find((p) => p.id === parking)?.name}`}
                  value={`KES ${parkingOpts.find((p) => p.id === parking)?.price}`}
                />
              )}
            </div>

            <div className="border-t border-border/40 mt-5 pt-5 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-foreground/60">Total</span>
              <span className="font-display text-3xl text-gold-gradient">
                KES {total.toLocaleString()}
              </span>
            </div>

            <button
              onClick={submit}
              disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-60"
            >
              {busy ? (
                "Preparing..."
              ) : (
                <>
                  Pay KES {deposit.toLocaleString()} via M-Pesa <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="mt-3 text-[11px] text-foreground/50 text-center leading-relaxed">
              {deposit >= total
                ? "Full amount"
                : `${deposit >= MIN_DEPOSIT ? `${depositCfg.value}% deposit` : `KES ${MIN_DEPOSIT} minimum deposit`}`}{" "}
              — balance settled at the door. We'll send an STK push to your M-Pesa.
            </p>
          </div>

          <Link to="/vibe" className="block text-xs text-foreground/55 hover:text-gold text-center">
            <Crown size={12} className="inline mr-1" /> Compare packages first
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
