import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Flame } from "lucide-react";

export type ShishaEntry = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
};

interface ProductShishaPickerProps {
  value: ShishaEntry[];
  onChange: (entries: ShishaEntry[]) => void;
}

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  price: number;
  subcategory: string | null;
  image_url: string | null;
};

export function ProductShishaPicker({ value = [], onChange }: ProductShishaPickerProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState("All");

  useEffect(() => {
    const load = async () => {
      const shishaCatId = "ae530eac-8a50-4bb9-bb73-7770aafca651";
      const { data } = await supabase
        .from("products")
        .select("id, name, brand, price, subcategory, image_url")
        .eq("active", true)
        .eq("category_id", shishaCatId)
        .order("sort_order");
      setProducts(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const subcategories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.subcategory).filter(Boolean) as string[])),
  ];
  const filtered =
    activeSub === "All" ? products : products.filter((p) => p.subcategory === activeSub);
  const getQty = (id: string) => value.find((v) => v.product_id === id)?.quantity ?? 0;

  const updateQty = (p: ProductRow, delta: number) => {
    const existing = value.find((v) => v.product_id === p.id);
    const newQty = (existing?.quantity ?? 0) + delta;
    if (newQty <= 0) {
      onChange(value.filter((v) => v.product_id !== p.id));
    } else if (existing) {
      onChange(
        value.map((v) => (v.product_id === p.id ? { ...v, quantity: Math.min(newQty, 10) } : v)),
      );
    } else {
      onChange([...value, { product_id: p.id, name: p.name, price: Number(p.price), quantity: 1 }]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="eyebrow flex items-center gap-2">
          <Flame size={12} /> Shisha · Pots · Bongs
        </div>
        <div className="text-xs text-foreground/40">Loading shisha menu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="eyebrow flex items-center gap-2">
          <Flame size={12} /> Shisha · Pots · Bongs
        </div>
        <p className="text-xs text-foreground/50 mt-1">Pick your flavours. Each item max 10.</p>
      </div>

      {/* Subcategory tabs */}
      {subcategories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {subcategories.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSub(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                activeSub === s
                  ? "bg-gold text-night-deep"
                  : "bg-white/5 text-foreground/50 hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      <div className="space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-xs text-foreground/40 py-4 text-center">
            No shisha products found. Add them under admin → products → Shisha category.
          </div>
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
                {p.subcategory && (
                  <div className="text-[10px] text-foreground/40 uppercase tracking-wider">
                    {p.subcategory}
                  </div>
                )}
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
