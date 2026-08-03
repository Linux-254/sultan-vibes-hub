import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShoppingBag, Check, X, Tag, GripVertical } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import gsap from "gsap";

export const Route = createFileRoute("/admin/inventory")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/shop" });
  },
});

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  price: number;
  tag: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  category_id: string | null;
  subcategory: string | null;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

const ICON_OPTIONS = [
  "wine",
  "beer",
  "cigarette",
  "crown",
  "ticket",
  "star",
  "flame",
  "music",
  "camera",
  "heart",
];

const PROD_EMPTY = {
  name: "",
  brand: "Empire",
  price: 0,
  tag: "Empire",
  category_id: "",
  subcategory: "",
  description: "",
  image_url: "",
  active: true,
  sort_order: 0,
};

const CAT_EMPTY = { name: "", subtitle: "", icon: "wine", sort_order: 0, active: true };

const TAG_TONE: Record<string, string> = {
  Cocktails: "bg-[#f472b6]/15 text-[#f472b6]",
  Liquor: "bg-[#a78bfa]/15 text-[#a78bfa]",
  Beer: "bg-[#fbbf24]/15 text-[#fbbf24]",
  Whisky: "bg-[#f97316]/15 text-[#f97316]",
  Shisha: "bg-savanna/15 text-savanna",
  CGS: "bg-[#60a5fa]/15 text-[#60a5fa]",
  Empire: "bg-gold/15 text-gold",
  Vouchers: "bg-[#a78bfa]/15 text-[#a78bfa]",
  Tickets: "bg-[#f472b6]/15 text-[#f472b6]",
};

export function AdminInventory() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [pRows, setPRows] = useState<ProductRow[]>([]);
  const [cRows, setCRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"products" | "categories">("products");
  const [pForm, setPForm] = useState(PROD_EMPTY);
  const [cForm, setCForm] = useState(CAT_EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("product_categories").select("*").order("sort_order", { ascending: true }),
    ]);
    if (pRes.error) toast.error(pRes.error.message);
    else setPRows(pRes.data ?? []);
    if (cRes.error) toast.error(cRes.error.message);
    else setCRows(cRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0.3, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    }
  }, [tab]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return null;
    return cRows.find((c) => c.id === catId)?.name ?? null;
  };

  const startCreate = (type: "products" | "categories") => {
    setEditing(null);
    setEditingType(type);
    if (type === "products") setPForm(PROD_EMPTY);
    else setCForm(CAT_EMPTY);
    setShowForm(true);
  };

  const startEdit = (type: "products" | "categories", r: any) => {
    setEditing(r.id);
    setEditingType(type);
    if (type === "products") {
      setPForm({
        name: r.name,
        brand: r.brand ?? "Empire",
        price: r.price,
        tag: r.tag ?? "Empire",
        category_id: r.category_id ?? "",
        subcategory: r.subcategory ?? "",
        description: r.description ?? "",
        image_url: r.image_url ?? "",
        active: r.active,
        sort_order: r.sort_order ?? 0,
      });
    } else {
      setCForm({
        name: r.name,
        subtitle: r.subtitle ?? "",
        icon: r.icon ?? "wine",
        sort_order: r.sort_order,
        active: r.active,
      });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (editingType === "products") {
      if (!pForm.name) return toast.error("Product name is required");
      setSaving(true);
      const catName = getCategoryName(pForm.category_id || null);
      const payload = {
        name: pForm.name,
        brand: pForm.brand || "Empire",
        price: pForm.price,
        tag: catName || pForm.tag || "Empire",
        category_id: pForm.category_id || null,
        subcategory: pForm.subcategory || null,
        description: pForm.description || null,
        image_url: pForm.image_url || null,
        active: pForm.active,
        sort_order: pForm.sort_order,
      };
      const { error } = editing
        ? await supabase.from("products").update(payload).eq("id", editing)
        : await supabase.from("products").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(editing ? "Product updated" : "Product created");
    } else {
      if (!cForm.name) return toast.error("Category name is required");
      setSaving(true);
      const payload = {
        name: cForm.name,
        subtitle: cForm.subtitle.trim() || null,
        icon: cForm.icon,
        sort_order: cForm.sort_order,
        active: cForm.active,
      };
      const { error } = editing
        ? await supabase.from("product_categories").update(payload).eq("id", editing)
        : await supabase.from("product_categories").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(editing ? "Category updated" : "Category created");
    }
    setShowForm(false);
    setEditing(null);
    setSaving(false);
    load();
  };

  const remove = async (type: "products" | "categories", id: string) => {
    if (!confirm("Delete this entry?")) return;
    const table = type === "products" ? "products" : "product_categories";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const toggleActive = async (type: "products" | "categories", id: string, current: boolean) => {
    const next = !current;
    const table = type === "products" ? "products" : "product_categories";
    const { error } = await supabase.from(table).update({ active: next }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "Activated" : "Deactivated");
      load();
    }
  };

  return (
    <div className="space-y-6" ref={contentRef}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Inventory</div>
          <h1 className="font-display text-4xl mt-1">Products & Categories</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage your product catalog and categories.
          </p>
        </div>
        <button
          onClick={() => startCreate(tab)}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New {tab === "products" ? "Product" : "Category"}
        </button>
      </header>

      <div className="flex gap-1.5 bg-night-deep/60 rounded-2xl p-1 w-fit">
        {(["products", "categories"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setShowForm(false);
              setEditing(null);
            }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]" : "text-foreground/60 hover:text-foreground"}`}
          >
            {t === "products" ? "Products" : "Categories"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">
              {editing ? "Edit" : "New"} {editingType === "products" ? "Product" : "Category"}
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          {editingType === "products" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Product name</span>
                <input
                  value={pForm.name}
                  onChange={(e) => setPForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Brand</span>
                <input
                  value={pForm.brand}
                  onChange={(e) => setPForm((s) => ({ ...s, brand: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Price (KES)</span>
                <input
                  type="number"
                  value={pForm.price}
                  onChange={(e) => setPForm((s) => ({ ...s, price: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Category</span>
                <select
                  value={pForm.category_id}
                  onChange={(e) => setPForm((s) => ({ ...s, category_id: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">— Select category —</option>
                  {cRows
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.subtitle ? ` — ${c.subtitle}` : ""}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Subcategory</span>
                <input
                  value={pForm.subcategory}
                  onChange={(e) => setPForm((s) => ({ ...s, subcategory: e.target.value }))}
                  placeholder="e.g. Turtle Tales"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Sort order</span>
                <input
                  type="number"
                  value={pForm.sort_order}
                  onChange={(e) => setPForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <div className="block sm:col-span-2">
                <ImageUpload
                  folder="products"
                  value={pForm.image_url}
                  onChange={(url) => setPForm((s) => ({ ...s, image_url: url }))}
                  label="Product image"
                  className="h-32"
                />
              </div>
              <label className="block sm:col-span-2">
                <span className="eyebrow">Description</span>
                <textarea
                  value={pForm.description}
                  onChange={(e) => setPForm((s) => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/70 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={pForm.active}
                  onChange={(e) => setPForm((s) => ({ ...s, active: e.target.checked }))}
                  className="accent-[var(--gold)]"
                />
                Active on store
              </label>
              <button
                onClick={save}
                disabled={saving || !pForm.name}
                className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Category name *</span>
                <input
                  value={cForm.name}
                  onChange={(e) => setCForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Cocktails"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Subtitle</span>
                <input
                  value={cForm.subtitle}
                  onChange={(e) => setCForm((s) => ({ ...s, subtitle: e.target.value }))}
                  placeholder="e.g. Signature mixes & classics"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Icon</span>
                <select
                  value={cForm.icon}
                  onChange={(e) => setCForm((s) => ({ ...s, icon: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                >
                  {ICON_OPTIONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Sort order</span>
                <input
                  type="number"
                  value={cForm.sort_order}
                  onChange={(e) => setCForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/70 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={cForm.active}
                  onChange={(e) => setCForm((s) => ({ ...s, active: e.target.checked }))}
                  className="accent-[var(--gold)]"
                />
                Active (visible in shop)
              </label>
              <button
                onClick={save}
                disabled={saving || !cForm.name}
                className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update Category" : "Create Category"}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sub</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pRows.map((r) => {
                  const catName = getCategoryName(r.category_id);
                  return (
                    <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.image_url ? (
                            <img
                              src={r.image_url}
                              alt={r.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border/40"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-night/60 border border-border/40 flex items-center justify-center">
                              <ShoppingBag size={16} className="text-foreground/30" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{r.name}</div>
                            {r.brand && <div className="text-xs text-foreground/50">{r.brand}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gold">
                        KES {Number(r.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${TAG_TONE[catName ?? r.tag] ?? "bg-foreground/10 text-foreground/60"}`}
                        >
                          {catName ?? r.tag}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/50">
                        {r.subcategory || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.active ? (
                          <Check size={14} className="text-savanna" />
                        ) : (
                          <X size={14} className="text-foreground/30" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleActive("products", r.id, r.active)}
                            title={r.active ? "Deactivate" : "Activate"}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                          >
                            {r.active ? <X size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => startEdit("products", r)}
                            title="Edit"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => remove("products", r.id)}
                            title="Delete"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No products yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subtitle</th>
                  <th className="px-4 py-3">Icon</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cRows.map((r) => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-foreground/30">
                      <GripVertical size={14} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-gold" />
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/60 text-xs">{r.subtitle || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-foreground/50">
                      {r.icon || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/50">
                      {r.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      {r.active ? (
                        <Check size={14} className="text-savanna" />
                      ) : (
                        <X size={14} className="text-foreground/30" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleActive("categories", r.id, r.active)}
                          title={r.active ? "Deactivate" : "Activate"}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          {r.active ? <X size={14} /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => startEdit("categories", r)}
                          title="Edit"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove("categories", r.id)}
                          title="Delete"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No categories yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
