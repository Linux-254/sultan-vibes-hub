import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Package, Car, Coins, Ticket, Calendar } from "lucide-react";
import gsap from "gsap";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricing,
});

type PricingConfig = Record<string, any>;

type Discount = {
  id: string;
  name: string;
  code: string | null;
  type: "percentage" | "flat";
  value: number;
  applicable_to: "all" | "product" | "event" | "reservation";
  target_id: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
};

type SpecialEvent = {
  id: string;
  name: string;
  ticket_price: number;
  requires_payment: boolean;
  event_date: string;
  status: string;
};

const DISCOUNT_EMPTY = {
  name: "",
  code: "",
  type: "percentage" as const,
  value: 0,
  applicable_to: "all" as const,
  target_id: "",
  active: true,
  starts_at: "",
  ends_at: "",
  max_uses: 0,
};

function AdminPricing() {
  const [tab, setTab] = useState<string>("packages");
  const [config, setConfig] = useState<PricingConfig>({});
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discountForm, setDiscountForm] = useState(DISCOUNT_EMPTY);
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const TABS = [
    { key: "packages", label: "Packages", icon: Package },
    { key: "parking", label: "Parking", icon: Car },
    { key: "deposit", label: "Deposit", icon: Coins },
    { key: "discounts", label: "Discounts", icon: Ticket },
    { key: "events", label: "Events", icon: Calendar },
  ];

  const load = async () => {
    setLoading(true);
    const [cfgRes, discRes, evtRes] = await Promise.all([
      supabase.from("pricing_config").select("*"),
      supabase.from("discounts").select("*").order("created_at", { ascending: false }),
      supabase.from("special_events").select("id, name, ticket_price, requires_payment, event_date, status").order("event_date", { ascending: false }),
    ]);
    if (cfgRes.data) {
      const cfg: PricingConfig = {};
      for (const row of cfgRes.data) cfg[row.key] = row.value;
      setConfig(cfg);
    }
    if (discRes.error) toast.error(discRes.error.message);
    else setDiscounts((discRes.data as Discount[]) ?? []);
    if (evtRes.error) toast.error(evtRes.error.message);
    else setEvents((evtRes.data as SpecialEvent[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0.3, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    }
  }, [tab]);

  const saveConfig = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase.from("pricing_config").upsert({ key, value }, { onConflict: "key" });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Saved");
    setConfig((s) => ({ ...s, [key]: value }));
    setSaving(false);
  };

  const saveDiscount = async () => {
    if (!discountForm.name) return toast.error("Name is required");
    setSaving(true);
    const payload: any = {
      name: discountForm.name,
      code: discountForm.code || null,
      type: discountForm.type,
      value: discountForm.value,
      applicable_to: discountForm.applicable_to,
      target_id: discountForm.target_id || null,
      active: discountForm.active,
      starts_at: discountForm.starts_at || null,
      ends_at: discountForm.ends_at || null,
      max_uses: discountForm.max_uses > 0 ? discountForm.max_uses : null,
    };
    const { error } = editingDiscount
      ? await supabase.from("discounts").update(payload).eq("id", editingDiscount)
      : await supabase.from("discounts").insert(payload);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(editingDiscount ? "Discount updated" : "Discount created");
    setShowDiscountForm(false);
    setEditingDiscount(null);
    setSaving(false);
    load();
  };

  const removeDiscount = async (id: string) => {
    if (!confirm("Delete this discount?")) return;
    const { error } = await supabase.from("discounts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const toggleDiscountActive = async (id: string, current: boolean) => {
    const next = !current;
    const { error } = await supabase.from("discounts").update({ active: next }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(next ? "Activated" : "Deactivated"); load(); }
  };

  const toggleEventPayment = async (id: string, current: boolean) => {
    const next = !current;
    const { error } = await supabase.from("special_events").update({ requires_payment: next }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(next ? "Payment required" : "Free event"); load(); }
  };

  const startEditDiscount = (d: Discount) => {
    setEditingDiscount(d.id);
    setDiscountForm({
      name: d.name,
      code: d.code ?? "",
      type: d.type,
      value: d.value,
      applicable_to: d.applicable_to,
      target_id: d.target_id ?? "",
      active: d.active,
      starts_at: d.starts_at ?? "",
      ends_at: d.ends_at ?? "",
      max_uses: d.max_uses ?? 0,
    });
    setShowDiscountForm(true);
  };

  if (loading) {
    return <div className="text-center py-20 text-foreground/50">Loading pricing...</div>;
  }

  const packages: Record<string, { name: string; capacity: string; price: number }> = config.packages ?? {};
  const parkingOptions: Array<{ id: string; name: string; price: number }> = config.parking_options ?? [];
  const depositCfg: { type: string; value: number; min_amount: number } = config.deposit ?? { type: "percentage", value: 30, min_amount: 500 };

  return (
    <div className="space-y-6" ref={contentRef}>
      <header>
        <div className="eyebrow">Pricing</div>
        <h1 className="font-display text-4xl mt-1">Price Control</h1>
        <p className="text-sm text-foreground/60 mt-1">Manage all prices, packages, parking, deposits, discounts, and event payment requirements.</p>
      </header>

      <div className="flex gap-1.5 bg-night-deep/60 rounded-2xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setShowDiscountForm(false); setEditingDiscount(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t.key ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]" : "text-foreground/60 hover:text-foreground"}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* PACKAGES TAB */}
      {tab === "packages" && (
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-xl">Reservation Packages</div>
          </div>
          <p className="text-xs text-foreground/50 mb-5">Edit the names, capacities, and prices of reservation packages shown on the /reserve page.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(packages).map(([key, pkg]) => (
              <div key={key} className="glass rounded-2xl p-4 border border-border/30 overflow-hidden">
                <div className="text-xs uppercase tracking-wider text-gold/70 mb-1">{key}</div>
                <input
                  value={pkg.name}
                  onChange={(e) => {
                    const next = { ...packages, [key]: { ...pkg, name: e.target.value } };
                    setConfig((s) => ({ ...s, packages: next }));
                  }}
                  className="w-full bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold mb-2"
                  placeholder="Name"
                />
                <div className="flex gap-2 mb-2 min-w-0">
                  <input
                    value={pkg.capacity}
                    onChange={(e) => {
                      const next = { ...packages, [key]: { ...pkg, capacity: e.target.value } };
                      setConfig((s) => ({ ...s, packages: next }));
                    }}
                    className="min-w-0 flex-1 bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold"
                    placeholder="Capacity"
                  />
                  <input
                    inputMode="numeric"
                    value={pkg.price}
                    onChange={(e) => {
                      const next = { ...packages, [key]: { ...pkg, price: Number(e.target.value) } };
                      setConfig((s) => ({ ...s, packages: next }));
                    }}
                    className="min-w-0 flex-1 bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold font-mono"
                    placeholder="Price"
                  />
                </div>
                <div className="text-xs text-foreground/50 truncate">KES {pkg.price.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => saveConfig("packages", config.packages)}
            disabled={saving}
            className="mt-5 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Packages"}
          </button>
        </div>
      )}

      {/* PARKING TAB */}
      {tab === "parking" && (
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-xl">Parking Options</div>
          </div>
          <p className="text-xs text-foreground/50 mb-5">Edit parking option names and prices shown on the /reserve page.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {parkingOptions.map((opt, idx) => (
              <div key={opt.id} className="glass rounded-2xl p-4 border border-border/30 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-gold/70 truncate">{opt.id}</div>
                  <button
                    onClick={() => {
                      const next = parkingOptions.filter((_, i) => i !== idx);
                      saveConfig("parking_options", next);
                    }}
                    className="text-xs text-lava/70 hover:text-lava shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={opt.name}
                  onChange={(e) => {
                    const next = [...parkingOptions];
                    next[idx] = { ...opt, name: e.target.value };
                    setConfig((s) => ({ ...s, parking_options: next }));
                  }}
                  className="w-full bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold mb-2"
                  placeholder="Name"
                />
                <input
                  inputMode="numeric"
                  value={opt.price}
                  onChange={(e) => {
                    const next = [...parkingOptions];
                    next[idx] = { ...opt, price: Number(e.target.value) };
                    setConfig((s) => ({ ...s, parking_options: next }));
                  }}
                  className="w-full bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold font-mono"
                  placeholder="Price"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const next = [...parkingOptions, { id: `opt-${Date.now()}`, name: "New option", price: 0 }];
              setConfig((s) => ({ ...s, parking_options: next }));
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/50 px-4 py-2 text-sm text-foreground/60 hover:text-gold hover:border-gold transition"
          >
            <Plus size={14} /> Add Option
          </button>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => saveConfig("parking_options", config.parking_options)}
              disabled={saving}
              className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Parking"}
            </button>
          </div>
        </div>
      )}

      {/* DEPOSIT TAB */}
      {tab === "deposit" && (
        <div className="glass rounded-3xl p-5 sm:p-6 max-w-lg">
          <div className="font-display text-xl mb-4">Deposit Configuration</div>
          <p className="text-xs text-foreground/50 mb-5">Configure how deposits are calculated for reservations.</p>
          <div className="space-y-4">
            <label className="block">
              <span className="eyebrow">Deposit type</span>
              <select
                value={depositCfg.type}
                onChange={(e) => setConfig((s) => ({ ...s, deposit: { ...depositCfg, type: e.target.value } }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              >
                <option value="percentage">Percentage of total</option>
                <option value="flat">Flat amount</option>
              </select>
            </label>
            <label className="block">
              <span className="eyebrow">{depositCfg.type === "percentage" ? "Percentage (%)" : "Amount (KES)"}</span>
              <input
                inputMode="numeric"
                value={depositCfg.value}
                onChange={(e) => setConfig((s) => ({ ...s, deposit: { ...depositCfg, value: Number(e.target.value) } }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Minimum deposit (KES)</span>
              <input
                inputMode="numeric"
                value={depositCfg.min_amount}
                onChange={(e) => setConfig((s) => ({ ...s, deposit: { ...depositCfg, min_amount: Number(e.target.value) } }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <button
              onClick={() => saveConfig("deposit", config.deposit)}
              disabled={saving}
              className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Deposit Settings"}
            </button>
          </div>
        </div>
      )}

      {/* DISCOUNTS TAB */}
      {tab === "discounts" && (
        <div className="space-y-4">
          <button
            onClick={() => { setEditingDiscount(null); setDiscountForm(DISCOUNT_EMPTY); setShowDiscountForm(true); }}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
          >
            <Plus size={16} /> New Discount
          </button>

          {showDiscountForm && (
            <div className="glass rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-display text-xl">{editingDiscount ? "Edit" : "New"} Discount</div>
                <button onClick={() => { setShowDiscountForm(false); setEditingDiscount(null); }} className="text-xs text-foreground/50 hover:text-foreground">Cancel</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="eyebrow">Name *</span>
                  <input value={discountForm.name} onChange={(e) => setDiscountForm((s) => ({ ...s, name: e.target.value }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
                </label>
                <label className="block">
                  <span className="eyebrow">Promo code (optional)</span>
                  <input value={discountForm.code} onChange={(e) => setDiscountForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder="EMPIRE20" className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold uppercase tracking-wider" />
                </label>
                <label className="block">
                  <span className="eyebrow">Type</span>
                  <select value={discountForm.type} onChange={(e) => setDiscountForm((s) => ({ ...s, type: e.target.value as any }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (KES)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="eyebrow">{discountForm.type === "percentage" ? "Percentage off" : "Amount off (KES)"}</span>
                  <input inputMode="numeric" value={discountForm.value} onChange={(e) => setDiscountForm((s) => ({ ...s, value: Number(e.target.value) }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
                </label>
                <label className="block">
                  <span className="eyebrow">Applies to</span>
                  <select value={discountForm.applicable_to} onChange={(e) => setDiscountForm((s) => ({ ...s, applicable_to: e.target.value as any }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold">
                    <option value="all">All items</option>
                    <option value="product">Products only</option>
                    <option value="event">Events only</option>
                    <option value="reservation">Reservations only</option>
                  </select>
                </label>
                <label className="block">
                  <span className="eyebrow">Max uses (0 = unlimited)</span>
                  <input inputMode="numeric" value={discountForm.max_uses} onChange={(e) => setDiscountForm((s) => ({ ...s, max_uses: Number(e.target.value) }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
                </label>
                <label className="block">
                  <span className="eyebrow">Start date</span>
                  <input type="datetime-local" value={discountForm.starts_at} onChange={(e) => setDiscountForm((s) => ({ ...s, starts_at: e.target.value }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
                </label>
                <label className="block">
                  <span className="eyebrow">End date</span>
                  <input type="datetime-local" value={discountForm.ends_at} onChange={(e) => setDiscountForm((s) => ({ ...s, ends_at: e.target.value }))} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/70 sm:col-span-2">
                  <input type="checkbox" checked={discountForm.active} onChange={(e) => setDiscountForm((s) => ({ ...s, active: e.target.checked }))} className="accent-[var(--gold)]" />
                  Active
                </label>
                <button onClick={saveDiscount} disabled={saving || !discountForm.name} className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50">
                  {saving ? "Saving..." : editingDiscount ? "Update Discount" : "Create Discount"}
                </button>
              </div>
            </div>
          )}

          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Applies to</th>
                    <th className="px-4 py-3">Uses</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{d.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        {d.code ? <span className="font-mono text-xs bg-gold/10 text-gold px-2 py-0.5 rounded">{d.code}</span> : <span className="text-foreground/30">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {d.type === "percentage" ? `${d.value}%` : `KES ${Number(d.value).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3 text-xs capitalize">{d.applicable_to}</td>
                      <td className="px-4 py-3 text-xs text-foreground/60">{d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ""}</td>
                      <td className="px-4 py-3">
                        {d.active ? <Check size={14} className="text-savanna" /> : <X size={14} className="text-foreground/30" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => toggleDiscountActive(d.id, d.active)} title={d.active ? "Deactivate" : "Activate"} className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition">
                            {d.active ? <X size={14} /> : <Check size={14} />}
                          </button>
                          <button onClick={() => startEditDiscount(d)} title="Edit" className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => removeDiscount(d.id)} title="Delete" className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {discounts.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-foreground/50 text-sm">No discounts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EVENTS TAB */}
      {tab === "events" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border/20">
            <div className="font-display text-xl">Event Payment Requirements</div>
            <p className="text-xs text-foreground/50 mt-1">Toggle whether each event requires payment. Free events won't show a "Buy Ticket" button.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requires Payment</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-xs text-foreground/60">{e.event_date}</td>
                    <td className="px-4 py-3 font-mono text-gold">KES {Number(e.ticket_price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${e.status === "published" ? "bg-savanna/15 text-savanna" : "bg-foreground/10 text-foreground/60"}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleEventPayment(e.id, e.requires_payment)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition border ${e.requires_payment ? "bg-gold/10 border-gold/40 text-gold" : "bg-night/40 border-border/40 text-foreground/50"}`}
                      >
                        {e.requires_payment ? <Check size={12} /> : <X size={12} />}
                        {e.requires_payment ? "Paid" : "Free"}
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-foreground/50 text-sm">No events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
