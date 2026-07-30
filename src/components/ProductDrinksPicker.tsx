import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Wine } from "lucide-react";

export type DrinkEntry = {
  product_id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
};

interface ProductDrinksPickerProps {
  value: DrinkEntry[];
  onChange: (entries: DrinkEntry[]) => void;
}

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  price: number;
  tag: string;
  category_id: string | null;
  subcategory: string | null;
  image_url: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
};

export function ProductDrinksPicker({ value = [], onChange }: ProductDrinksPickerProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const load = async () => {
      const [pRes, cRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, brand, price, tag, category_id, subcategory, image_url")
          .eq("active", true)
          .order("sort_order"),
        supabase
          .from("product_categories")
          .select("id, name, icon")
          .eq("active", true)
          .order("sort_order"),
      ]);
      setProducts(pRes.data ?? []);
      setCategories(cRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const tabs = ["All", ...categories.map((c) => c.name)];

  const filtered =
    activeTab === "All"
      ? products
      : products.filter((p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          return cat?.name === activeTab || p.tag === activeTab;
        });

  const getQty = (id: string) => value.find((v) => v.product_id === id)?.quantity ?? 0;

  const updateQty = (p: ProductRow, delta: number) => {
    const existing = value.find((v) => v.product_id === p.id);
    const newQty = (existing?.quantity ?? 0) + delta;

    if (newQty <= 0) {
      onChange(value.filter((v) => v.product_id !== p.id));
    } else if (existing) {
      onChange(
        value.map((v) => (v.product_id === p.id ? { ...v, quantity: Math.min(newQty, 20) } : v)),
      );
    } else {
      onChange([
        ...value,
        { product_id: p.id, name: p.name, brand: p.brand, price: Number(p.price), quantity: 1 },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="eyebrow flex items-center gap-2">
          <Wine size={12} /> Drinks (from bar)
        </div>
        <div className="text-xs text-foreground/40">Loading drinks menu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="eyebrow flex items-center gap-2">
        <Wine size={12} /> Drinks (from bar)
      </div>
      <p className="text-xs text-foreground/50">
        Pick from our full drinks menu. Prices added to your total.
      </p>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
              activeTab === t
                ? "bg-gold text-night-deep"
                : "bg-white/5 text-foreground/50 hover:bg-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="max-h-[320px] overflow-y-auto space-y-0.5 scrollbar-thin">
        {filtered.length === 0 && (
          <div className="text-xs text-foreground/40 py-4 text-center">No drinks found</div>
        )}
        {filtered.map((p) => {
          const qty = getQty(p.id);
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${qty > 0 ? "bg-gold/8" : "hover:bg-white/[0.03]"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-foreground/40 uppercase tracking-wider">
                  {p.brand}
                  {p.subcategory ? ` · ${p.subcategory}` : ""}
                </div>
              </div>
              <div className="text-xs text-gold font-mono shrink-0">
                KES {Number(p.price).toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQty(p, -1)}
                  className="h-7 w-7 rounded-lg border border-border/50 hover:border-gold flex items-center justify-center transition"
                  aria-label="Decrease"
                >
                  <Minus size={11} />
                </button>
                <span className="w-5 text-center text-xs tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(p, 1)}
                  className="h-7 w-7 rounded-lg border border-border/50 hover:border-gold flex items-center justify-center transition"
                  aria-label="Increase"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected summary */}
      {value.length > 0 && (
        <div className="pt-2 border-t border-border/30 space-y-1">
          {value.map((d) => (
            <div key={d.product_id} className="flex items-center justify-between text-xs">
              <span className="text-foreground/60 truncate">
                {d.name} × {d.quantity}
              </span>
              <span className="text-gold font-mono shrink-0">
                KES {(d.price * d.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
