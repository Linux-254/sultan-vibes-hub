import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Crown, X, Minus, Plus, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MpesaPayment } from "@/components/MpesaPayment";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Shop — Empire Kwa Sultan" },
      {
        name: "description",
        content:
          "Cocktails, liquor, beer, whisky, shisha, and CGS at Empire Kwa Sultan. Browse our full drink menu and shop online.",
      },
      { property: "og:title", content: "Empire Kwa Sultan Shop" },
      {
        property: "og:description",
        content: "Cocktails, liquor, beer, whisky, shisha & CGS. Browse and order.",
      },
    ],
  }),
  component: ProductsPage,
});

type Category = {
  id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  sort_order: number;
};
type Product = {
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
};

interface CartItem {
  product: Product;
  quantity: number;
}

function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showMpesa, setShowMpesa] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*").eq("active", true).order("sort_order"),
        supabase.from("product_categories").select("*").eq("active", true).order("sort_order"),
      ]);
      if (!prodRes.error && prodRes.data) setProducts(prodRes.data);
      if (!catRes.error && catRes.data) setCategories(catRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const tabNames = ["All", ...categories.map((c) => c.name)];
  const visible =
    tab === "All"
      ? products
      : products.filter((p) => {
          const cat = categories.find((c) => c.name === tab);
          return cat && p.category_id === cat.id;
        });

  const getCatSubtitle = (name: string) => categories.find((c) => c.name === name)?.subtitle;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing)
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c,
      ),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
    if (cart.length <= 1) setCartOpen(false);
  };

  const cartTotal = useMemo(
    () => cart.reduce((s, c) => s + c.product.price * c.quantity, 0),
    [cart],
  );
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);

  const checkout = async () => {
    if (!user) {
      toast.error("Sign in to place an order");
      return;
    }
    setCheckingOut(true);
    setShowMpesa(true);
  };

  const onPaymentSuccess = async (paymentId: string) => {
    if (!user) return;
    const ticketNum = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "delivery",
        status: "pending",
        total: cartTotal,
        ticket_number: ticketNum,
        payment_id: paymentId,
      })
      .select("id")
      .single();
    if (orderErr) {
      toast.error(orderErr.message);
      return;
    }
    const items = cart.map((c) => ({
      order_id: order.id,
      product_id: c.product.id,
      name: c.product.name,
      quantity: c.quantity,
      unit_price: c.product.price,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) {
      toast.error(itemsErr.message);
      return;
    }
    setCart([]);
    setCartOpen(false);
    setShowMpesa(false);
    setCheckingOut(false);
    toast.success(`Order placed! Reference: ${ticketNum}`);
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-16 sm:py-20">
        <div className="text-center py-20 text-foreground/50">Loading shop...</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-16 sm:py-20">
      <MpesaPayment
        amount={cartTotal}
        reference={`ORD-${Date.now().toString(36).toUpperCase().slice(0, 8)}`}
        description="Empire shop order"
        onSuccess={onPaymentSuccess}
        onClose={() => {
          setShowMpesa(false);
          setCheckingOut(false);
        }}
        open={showMpesa}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Shop</div>
          <h1 className="font-display text-5xl md:text-7xl mt-3 leading-[0.95]">
            Take a piece of the <span className="text-gold-gradient">night</span> home.
          </h1>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => setCartOpen((o) => !o)}
            className="relative h-12 w-12 rounded-2xl glass flex items-center justify-center shrink-0 hover:border-gold/60 transition border border-border/40"
          >
            <ShoppingBag size={18} className="text-gold" />
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-lava text-[10px] font-bold text-white flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {tabNames.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition shrink-0 ${tab === t ? "bg-gold text-night-deep border-gold" : "border-border/40 hover:border-gold text-foreground/70"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== "All" && getCatSubtitle(tab) && (
        <p className="mt-3 text-sm text-foreground/60">{getCatSubtitle(tab)}</p>
      )}

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {visible.map((p) => {
          const catName = categories.find((c) => c.id === p.category_id)?.name ?? p.tag;
          const inCart = cart.find((c) => c.product.id === p.id);
          return (
            <article
              key={p.id}
              className="glass rounded-3xl overflow-hidden hover:border-gold/40 transition group"
            >
              <div className="aspect-square bg-gradient-to-br from-gold/10 via-night to-lava/10 flex items-center justify-center relative">
                <ShoppingBag size={48} className="text-gold/30" />
                <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-night-deep/70 border border-border/40 text-foreground/70">
                  {catName}
                </span>
              </div>
              <div className="p-4">
                {p.subcategory && (
                  <div className="text-[10px] uppercase tracking-wider text-gold/70 mb-0.5">
                    {p.subcategory}
                  </div>
                )}
                <div className="text-[11px] uppercase tracking-wider text-foreground/55">
                  {p.brand}
                </div>
                <div className="font-display text-base mt-1 leading-snug">{p.name}</div>
                {p.description && (
                  <p className="text-xs text-foreground/50 mt-1 line-clamp-2">{p.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-gold font-mono text-sm">
                    KES {p.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => addToCart(p)}
                    className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border transition ${inCart ? "bg-gold text-night-deep border-gold" : "border-gold/40 text-gold hover:bg-gold hover:text-night-deep"}`}
                  >
                    {inCart ? `Add (${inCart.quantity})` : "Add"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-16 text-foreground/50 text-sm">
            No products in this category yet.
          </div>
        )}
      </div>

      {/* Cart drawer */}
      {cartOpen && cart.length > 0 && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <aside className="absolute right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-md bg-night border-l border-border/40 p-5 flex flex-col overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-xl">Your Cart ({cartCount})</span>
              <button
                onClick={() => setCartOpen(false)}
                className="h-9 w-9 rounded-xl border border-border/50 flex items-center justify-center hover:border-gold"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 space-y-3">
              {cart.map((c) => (
                <div key={c.product.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.product.name}</div>
                    <div className="text-[10px] text-foreground/50">{c.product.brand}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(c.product.id, -1)}
                      className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center hover:border-gold text-xs"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-sm font-mono w-6 text-center">{c.quantity}</span>
                    <button
                      onClick={() => updateQty(c.product.id, 1)}
                      className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center hover:border-gold text-xs"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <span className="text-xs font-mono text-gold w-16 text-right">
                    KES {(c.product.price * c.quantity).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeItem(c.product.id)}
                    className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center hover:border-lava hover:text-lava text-xs"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-foreground/60">Total</span>
                <span className="font-display text-2xl text-gold-gradient">
                  KES {cartTotal.toLocaleString()}
                </span>
              </div>
              <button
                onClick={checkout}
                disabled={checkingOut}
                className="w-full rounded-2xl bg-gold py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Smartphone size={16} /> {checkingOut ? "Processing..." : "Pay with M-Pesa"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="mt-12 sm:mt-16 glass rounded-3xl p-5 sm:p-7 lg:p-10 max-w-3xl">
        <Crown className="text-gold" />
        <h3 className="font-display text-2xl mt-3">Want your brand here?</h3>
        <p className="mt-2 text-sm text-foreground/70">
          Approved collaborators sell their products through Empire's storefront — we handle
          checkout, M-Pesa and weekly payouts. Apply via the Collabs hub.
        </p>
      </div>
    </section>
  );
}
