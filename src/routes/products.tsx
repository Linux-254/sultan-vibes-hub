import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Shop — Sultan Park & Puff" },
      { name: "description", content: "Sultan-branded merch, custom shisha flavour packs, gift vouchers, and capsules from our collab partners." },
      { property: "og:title", content: "Sultan Shop" },
      { property: "og:description", content: "Merch, flavour packs, gift vouchers and collab capsules." },
    ],
  }),
  component: ProductsPage,
});

const TABS = ["All", "Sultan", "Collabs", "Vouchers", "Tickets"] as const;

const PRODUCTS = [
  { id: "1", name: "Sultan Embroidered Hoodie", brand: "Sultan", price: 4500, tag: "Sultan" },
  { id: "2", name: "Park & Puff Cap", brand: "Sultan", price: 1500, tag: "Sultan" },
  { id: "3", name: "Double Apple Flavour Pack (3×)", brand: "Sultan", price: 1200, tag: "Sultan" },
  { id: "4", name: "KES 5,000 Gift Voucher", brand: "Sultan", price: 5000, tag: "Vouchers" },
  { id: "5", name: "Kanyali — Tides Mix Vinyl", brand: "Kanyali Records", price: 3500, tag: "Collabs" },
  { id: "6", name: "Lava Streetwear · Tee", brand: "Lava Lab", price: 2200, tag: "Collabs" },
  { id: "7", name: "Summer Tides · Opening Night Ticket", brand: "Sultan", price: 2500, tag: "Tickets" },
  { id: "8", name: "Premium Shisha Bowl Refill", brand: "Sultan", price: 550, tag: "Sultan" },
];

function ProductsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const visible = tab === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.tag === tab);

  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
      <div className="eyebrow">Shop</div>
      <h1 className="font-display text-5xl md:text-7xl mt-3 leading-[0.95]">
        Take a piece of the <span className="text-gold-gradient">night</span> home.
      </h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition ${tab === t ? "bg-gold text-night-deep border-gold" : "border-border/40 hover:border-gold text-foreground/70"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {visible.map((p) => (
          <article key={p.id} className="glass rounded-3xl overflow-hidden hover:border-gold/40 transition group">
            <div className="aspect-square bg-gradient-to-br from-gold/10 via-night to-lava/10 flex items-center justify-center relative">
              <ShoppingBag size={48} className="text-gold/30" />
              <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-night-deep/70 border border-border/40 text-foreground/70">
                {p.tag}
              </span>
            </div>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground/55">{p.brand}</div>
              <div className="font-display text-base mt-1 leading-snug">{p.name}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-gold font-mono text-sm">KES {p.price.toLocaleString()}</span>
                <button className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-gold/40 text-gold hover:bg-gold hover:text-night-deep transition">
                  Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 glass rounded-3xl p-7 lg:p-10 kente-border max-w-3xl">
        <Sparkles className="text-gold" />
        <h3 className="font-display text-2xl mt-3">Want your brand here?</h3>
        <p className="mt-2 text-sm text-foreground/70">
          Approved collaborators sell their products through Sultan's storefront — we handle checkout, M-Pesa and weekly payouts. Apply via the Collabs hub.
        </p>
      </div>
    </section>
  );
}
