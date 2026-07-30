import { createFileRoute } from "@tanstack/react-router";
import event2 from "@/assets/event-2.webp";
import { MapPin, Clock, ShieldCheck, Heart, Crown, Users, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Empire Kwa Sultan" },
      {
        name: "description",
        content:
          "Empire Kwa Sultan is a chill-out lounge and events venue on USIU Road, Nairobi. Shisha, cocktails, liquor, and the best nightlife experience in Kenya.",
      },
      {
        name: "keywords",
        content:
          "Empire Kwa Sultan, about, shisha lounge Nairobi, cocktail bar Kenya, nightlife USIU Road, hookah lounge, events venue Nairobi",
      },
      { property: "og:title", content: "About Empire Kwa Sultan" },
      {
        property: "og:description",
        content:
          "A chill-out lounge & events venue on USIU Road, Nairobi. Shisha, cocktails, and the best nights.",
      },
    ],
  }),
  component: AboutPage,
});

const ICON_MAP: Record<string, React.ElementType> = { Users, Crown, Heart, ShieldCheck };

const DEFAULT_VALUES = [
  { icon: "Users", title: "Community", body: "Empire is a regulars-bar at heart. Names are remembered, drinks are remembered, you are remembered." },
  { icon: "Crown", title: "Culture", body: "Afro-Kenyan to the bone. The music, the design, the rituals — we make space for what we grew up around." },
  { icon: "Heart", title: "Quality Vibes", body: "We say no to a lot of bookings. We protect the night for the people who love it." },
  { icon: "ShieldCheck", title: "Safety", body: "An 18+ venue with trained door staff and a silent SOS system for every guest." },
];

type Faq = { id: string; question: string; answer: string; sort_order: number };
type SiteContent = { slug: string; content: string };

function AboutPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [faqRes, contentRes] = await Promise.all([
        supabase.from("faqs").select("*").eq("active", true).order("sort_order", { ascending: true }),
        supabase.from("site_content").select("slug, content"),
      ]);
      if (faqRes.data) setFaqs(faqRes.data);
      if (contentRes.data) {
        const map: Record<string, string> = {};
        for (const c of contentRes.data) map[c.slug] = c.content;
        setContent(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const heroHeadline = content["about-hero"] ?? "We built a place for the night to slow down.";
  const heroDesc =
    content["about-description"] ??
    "Empire started in 2022 as a Saturday-night experiment between friends. Today it's where Nairobi comes when the week has been too much and the night needs to be enough.";
  let values = DEFAULT_VALUES;
  try {
    if (content["about-values"]) {
      const parsed = JSON.parse(content["about-values"]);
      if (Array.isArray(parsed) && parsed.length) values = parsed;
    }
  } catch {}

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={event2}
            alt=""
            className="h-full w-full object-cover opacity-40"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-night-deep/40 via-night-deep/70 to-night-deep" />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 lg:px-8 py-32 lg:py-40">
          <div className="eyebrow">About</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-3 leading-[0.95]">
            {heroHeadline}
          </h1>
          <p className="mt-8 max-w-xl text-foreground/75 text-lg">
            {heroDesc}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-24">
        <div className="eyebrow">What we stand for</div>
        <h2 className="font-display text-4xl md:text-5xl mt-3">Four things, always.</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {values.map((v) => {
            const Icon = ICON_MAP[v.icon] ?? Users;
            return (
            <div key={v.title} className="glass rounded-2xl p-6">
              <div className="h-10 w-10 rounded-full bg-gold/15 text-gold flex items-center justify-center">
                <Icon size={18} />
              </div>
              <h3 className="font-display text-xl mt-4">{v.title}</h3>
              <p className="text-sm text-foreground/70 mt-2">{v.body}</p>
            </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid lg:grid-cols-2 gap-10">
        <div className="glass rounded-3xl p-8 kente-border">
          <div className="eyebrow">Find us</div>
          <h3 className="font-display text-3xl mt-3">Park Hotel · USIU Road</h3>
          <p className="text-foreground/70 mt-2">Nairobi, Kenya</p>
          <div className="mt-6 space-y-3 text-sm text-foreground/80">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-gold" /> 5 mins from USIU main gate
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-gold" /> Mon – Sun · 5pm – Late
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-gold" /> 18+ · ID required
            </div>
            <a
              href="https://wa.me/254700000000?text=Hi%20Empire%2C%20I%27d%20like%20to%20book%20a%20table"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-gold hover:underline mt-2"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>
          <div className="mt-6 rounded-2xl overflow-hidden border border-border/30">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.7897598857187!2d36.8229!3d-1.2201!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f173c8f0b8b6f%3A0x8f8f8f8f8f8f8f8f!2sPark%20Hotel%20USIU%20Road!5e0!3m2!1sen!2ske!4v1"
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Empire Kwa Sultan location"
            />
          </div>
        </div>

        <div className="glass rounded-3xl p-8 kente-border">
          <div className="eyebrow">FAQ</div>
          {loading ? (
            <div className="mt-4 text-sm text-foreground/50">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="mt-4 text-sm text-foreground/50">No FAQs yet.</div>
          ) : (
            <div className="mt-4 divide-y divide-border/50">
              {faqs.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                    <span className="font-medium">{f.question}</span>
                    <span className="text-gold font-mono text-lg leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-foreground/70">{f.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
