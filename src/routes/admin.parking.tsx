import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Car, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/parking")({
  head: () => ({
    meta: [{ title: "Parking — Empire Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminParking,
});

type ParkingSpot = {
  id: string;
  spot_number: string;
  spot_type: string;
  status: string;
  price: number;
  booked_by: string | null;
  booking_date: string | null;
  event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type SpotType = "standard" | "suv" | "premium" | "group_convoy";

const SPOT_TYPES: SpotType[] = ["standard", "suv", "premium", "group_convoy"];

const TYPE_LABELS: Record<SpotType, string> = {
  standard: "Standard",
  suv: "SUV",
  premium: "Premium",
  group_convoy: "Group Convoy",
};

const STATUS_TONE: Record<string, string> = {
  available: "bg-savanna/15 text-savanna",
  reserved: "bg-gold/15 text-gold",
  occupied: "bg-lava/15 text-lava",
};

const STATUS_OPTIONS = ["available", "reserved", "occupied"];

type FormState = {
  spot_number: string;
  spot_type: SpotType;
  price: number;
};

const EMPTY_FORM: FormState = {
  spot_number: "",
  spot_type: "standard",
  price: 0,
};

function AdminParking() {
  const { isStaff } = useAuth();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parking_spots")
      .select("*")
      .order("spot_number", { ascending: true });
    if (error) toast.error(error.message);
    else setSpots((data as ParkingSpot[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-parking")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("parking_spots")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Spot marked ${status}`);
  };

  const addSpot = async () => {
    if (!form.spot_number.trim()) return toast.error("Spot number is required");
    setSaving(true);
    const { error } = await supabase.from("parking_spots").insert({
      spot_number: form.spot_number.trim(),
      spot_type: form.spot_type,
      status: "available",
      price: form.price,
    });
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    toast.success("Parking spot added");
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    load();
  };

  const removeSpot = async (id: string) => {
    if (!confirm("Delete this parking spot?")) return;
    const { error } = await supabase.from("parking_spots").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Spot deleted");
      load();
    }
  };

  if (!isStaff) {
    return (
      <div className="p-10 text-center text-foreground/50 text-sm">
        You don't have access to this page.
      </div>
    );
  }

  const totalSpots = spots.length;
  const availableCount = spots.filter((s) => s.status === "available").length;
  const reservedCount = spots.filter((s) => s.status === "reserved").length;
  const occupiedCount = spots.filter((s) => s.status === "occupied").length;

  const grouped = SPOT_TYPES.reduce(
    (acc, type) => {
      acc[type] = spots.filter((s) => s.spot_type === type);
      return acc;
    },
    {} as Record<SpotType, ParkingSpot[]>,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Venue</div>
          <h1 className="font-display text-4xl mt-1">
            <span className="text-gold-gradient">Parking</span> Management
          </h1>
          <p className="text-sm text-foreground/60 mt-1">Manage parking spots and availability</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setForm(EMPTY_FORM);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New Spot
        </button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spots" value={totalSpots} />
        <StatCard label="Available" value={availableCount} accent="text-savanna" />
        <StatCard label="Reserved" value={reservedCount} accent="text-gold" />
        <StatCard label="Occupied" value={occupiedCount} accent="text-lava" />
      </div>

      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">Add Parking Spot</div>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="eyebrow">Spot Number</span>
              <input
                value={form.spot_number}
                onChange={(e) => setForm((s) => ({ ...s, spot_number: e.target.value }))}
                placeholder="e.g. A-01"
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Type</span>
              <select
                value={form.spot_type}
                onChange={(e) => setForm((s) => ({ ...s, spot_type: e.target.value as SpotType }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              >
                {SPOT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow">Price (KES)</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
          </div>
          <button
            onClick={addSpot}
            disabled={saving || !form.spot_number.trim()}
            className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Spot"}
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-sm text-foreground/50">Loading parking spots...</div>
      )}

      {!loading && (
        <div className="space-y-6">
          {SPOT_TYPES.map((type) => {
            const typeSpots = grouped[type];
            if (typeSpots.length === 0) return null;
            return (
              <div key={type} className="glass rounded-3xl p-5 kente-border">
                <div className="flex items-center gap-2 mb-4">
                  <Car size={18} className="text-gold" />
                  <div className="font-display text-lg">{TYPE_LABELS[type]}</div>
                  <span className="text-xs text-foreground/50 ml-1">({typeSpots.length})</span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {typeSpots.map((spot) => (
                    <div key={spot.id} className="glass rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg font-bold">{spot.spot_number}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${STATUS_TONE[spot.status] ?? "bg-foreground/10 text-foreground/60"}`}
                        >
                          {spot.status}
                        </span>
                      </div>
                      <div className="text-sm text-gold font-mono">
                        KES {Number(spot.price).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={spot.status}
                          onChange={(e) => updateStatus(spot.id, e.target.value)}
                          className="flex-1 bg-night/60 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-gold"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSpot(spot.id)}
                          title="Delete spot"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {spot.booked_by && (
                        <div className="text-xs text-foreground/50 truncate" title={spot.booked_by}>
                          Booked by: {spot.booked_by}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {spots.length === 0 && (
            <div className="glass rounded-3xl p-5 kente-border text-center text-sm text-foreground/50 py-12">
              No parking spots configured yet. Add your first spot above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="glass rounded-3xl p-5 kente-border">
      <div className={`text-3xl font-display ${accent ?? ""}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">{label}</div>
    </div>
  );
}
