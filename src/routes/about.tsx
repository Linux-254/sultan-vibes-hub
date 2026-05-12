import { createFileRoute } from "@tanstack/react-router";
import event2 from "@/assets/event-2.jpg";
import { MapPin, Clock, ShieldCheck, Heart, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sultan Park & Puff" },
      { name: "description", content: "Sultan Park & Puff is a chill-out lounge and events venue on USIU Road, Nairobi. Our story, our values, our team." },
      { property: "og:title", content: "About Sultan Park & Puff" },
      { property: "og:description", content: "A chill-out lounge & events venue on USIU Road, Nairobi." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Users, title: "Community", body: "Sultan is a regulars-bar at heart. Names are remembered, drinks are remembered, you are remembered." },
  { icon: Sparkles, title: "Culture", body: "Afro-Kenyan to the bone. The music, the design, the rituals — we make space for what we grew up around." },
  { icon: Heart, title: "Quality Vibes", body: "We say no to a lot of bookings. We protect the night for the people who love it." },
  { icon: ShieldCheck, title: "Safety", body: "An 18+ venue with trained door staff and a silent SOS system in development for every guest." },
];

const FAQ = [
  { q: "Do you take reservations?", a: "Yes — and we recommend it. Saturdays sell out by Wednesday. Reserve via WhatsApp or our /events page." },
  { q: "Is there parking?", a: "Yes, secure parking on-site. Standard, SUV, premium and group convoy spots — all bookable in advance." },
  { q: "What's the age policy?", a: "Strictly 18+. ID at the door, every time, no exceptions." },
  { q: "Do you serve food?", a: "Sultan is a lounge & shisha venue, not a restaurant. We have light bites, mixers, and the bar you'd expect." },
  { q: "Can I host a private event?", a: "Yes. The Sultan Package books out our premium section for 10+ guests with a dedicated attendant. WhatsApp us." },
];

function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={event2} alt="" className="h-full w-full object-cover opacity-40" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-night-deep/40 via-night-deep/70 to-night-deep" />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 lg:px-8 py-32 lg:py-40">
          <div className="eyebrow">About</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-3 leading-[0.95]">
            We built a place <br/>
            <span className="font-italic italic font-normal">for the night to <span className="text-gold-gradient">slow down</span>.</span>
          </h1>
          <p className="mt-8 max-w-xl text-foreground/75 text-lg">
            Sultan started in 2022 as a Saturday-night experiment between friends. Today it's where Nairobi comes when the week has been too much and the night needs to be enough.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-24">
        <div className="eyebrow">What we stand for</div>
        <h2 className="font-display text-4xl md:text-5xl mt-3">Four things, always.</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {VALUES.map((v) => (
            <div key={v.title} className="glass rounded-2xl p-6 kente-border">
              <div className="h-10 w-10 rounded-full bg-gold/15 text-gold flex items-center justify-center">
                <v.icon size={18} />
              </div>
              <h3 className="font-display text-xl mt-4">{v.title}</h3>
              <p className="text-sm text-foreground/70 mt-2">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid lg:grid-cols-2 gap-10">
        <div className="glass rounded-3xl p-8 kente-border">
          <div className="eyebrow">Find us</div>
          <h3 className="font-display text-3xl mt-3">Park Hotel · USIU Road</h3>
          <p className="text-foreground/70 mt-2">Nairobi, Kenya</p>
          <div className="mt-6 space-y-3 text-sm text-foreground/80">
            <div className="flex items-center gap-3"><MapPin size={16} className="text-gold" /> 5 mins from USIU main gate</div>
            <div className="flex items-center gap-3"><Clock size={16} className="text-gold" /> Wed – Sun · 5pm – Late</div>
            <div className="flex items-center gap-3"><ShieldCheck size={16} className="text-gold" /> 18+ · ID required</div>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 kente-border">
          <div className="eyebrow">FAQ</div>
          <div className="mt-4 divide-y divide-border/50">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="font-medium">{f.q}</span>
                  <span className="text-gold font-mono text-lg leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-foreground/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
