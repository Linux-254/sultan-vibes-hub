import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Music2, Wine, Shirt, Scissors, Smartphone, Camera, Megaphone, Handshake } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/collabs")({
  head: () => ({
    meta: [
      { title: "Collaborations — Sultan Park & Puff" },
      { name: "description", content: "Brands, artists, agencies — partner with Sultan. Product listings, event sponsorships, media partnerships, talent deals." },
      { property: "og:title", content: "Sultan Collaborations" },
      { property: "og:description", content: "Partner with Nairobi's most talked-about lounge." },
    ],
  }),
  component: CollabsPage,
});

const TYPES = [
  { icon: Music2, label: "Music & DJs" },
  { icon: Wine, label: "Beverage" },
  { icon: Shirt, label: "Fashion" },
  { icon: Scissors, label: "Grooming" },
  { icon: Smartphone, label: "Tech" },
  { icon: Camera, label: "Creators" },
  { icon: Megaphone, label: "Agencies" },
];

const FEATURED = [
  { slug: "kenya-cane", name: "Kenya Cane", tagline: "Official Bar Partner — Summer Tides" },
  { slug: "lava-lab", name: "Lava Lab", tagline: "Streetwear capsule live in shop" },
  { slug: "kanyali-records", name: "Kanyali Records", tagline: "Resident sound, monthly drops" },
  { slug: "captain-morgan", name: "Captain Morgan", tagline: "Bottle service standard" },
];

function CollabsPage() {
  const [form, setForm] = useState({ brand: "", type: "Beverage", contact: "", deal: "Product Listing", commission: 20, pitch: "" });

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 wave-bg opacity-40" />
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-5 lg:px-8 py-28 lg:py-36">
          <div className="eyebrow">Collaborations & partnerships</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-4 leading-[0.92] max-w-4xl">
            Build the <span className="text-gold-gradient">vibe</span> with us.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/80">
            Sultan is where Nairobi's nights start. Plug in your brand, your artists, or your agency — we handle the room, you handle the magic.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
        <div className="eyebrow">Who we partner with</div>
        <div className="mt-6 grid sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {TYPES.map((t) => (
            <div key={t.label} className="glass rounded-2xl p-4 text-center hover:border-gold/40 transition">
              <t.icon className="text-gold mx-auto" size={20} />
              <div className="text-xs mt-2 text-foreground/80">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="eyebrow">Active collabs</div>
            <h2 className="font-display text-4xl mt-2">In rotation right now</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED.map((f) => (
            <Link key={f.slug} to="/collabs/$slug" params={{ slug: f.slug }} className="group glass rounded-3xl p-6 kente-border hover:bg-gold/5 transition">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gold to-lava/60 flex items-center justify-center font-display text-2xl text-night-deep">
                {f.name[0]}
              </div>
              <div className="font-display text-xl mt-4">{f.name}</div>
              <p className="text-xs text-foreground/55 mt-1">{f.tagline}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-gold text-xs">
                Visit page <ArrowRight size={12} className="transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 lg:px-8 pb-32">
        <div className="glass rounded-3xl p-7 lg:p-10 kente-border">
          <Handshake className="text-gold" />
          <h2 className="font-display text-3xl md:text-4xl mt-4">
            Pitch a <span className="text-gold-gradient">collab</span>.
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            Admin reviews each application. Approved partners get a public collab page, product listing access, and revenue split via automated M-Pesa payouts.
          </p>

          <form className="mt-8 grid sm:grid-cols-2 gap-3" onSubmit={(e) => e.preventDefault()}>
            <Input label="Business / brand name" value={form.brand} onChange={(v) => setForm((s) => ({ ...s, brand: v }))} />
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} className="w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold">
                {TYPES.map((t) => <option key={t.label}>{t.label}</option>)}
              </select>
            </Field>
            <Input label="Contact phone" value={form.contact} onChange={(v) => setForm((s) => ({ ...s, contact: v }))} placeholder="+254 …" />
            <Field label="Deal type">
              <select value={form.deal} onChange={(e) => setForm((s) => ({ ...s, deal: e.target.value }))} className="w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold">
                {["Product Listing", "Event Sponsorship", "Media Partnership", "Talent Deal"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label={`Starting commission · ${form.commission}%`}>
              <input type="range" min={5} max={50} step={1} value={form.commission} onChange={(e) => setForm((s) => ({ ...s, commission: Number(e.target.value) }))} className="w-full accent-[var(--gold)]" />
            </Field>
            <Input label="Brand kit / portfolio URL" value="" onChange={() => {}} placeholder="https://…" />
            <div className="sm:col-span-2">
              <Field label="Pitch (200 chars)">
                <textarea value={form.pitch} onChange={(e) => setForm((s) => ({ ...s, pitch: e.target.value }))} maxLength={200} rows={3} className="w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none" />
              </Field>
            </div>
            <button className="sm:col-span-2 mt-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition inline-flex items-center justify-center gap-2">
              Submit application <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-foreground/60">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Field label={label}>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
    </Field>
  );
}
