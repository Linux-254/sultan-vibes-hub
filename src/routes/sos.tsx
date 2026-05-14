import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Siren, MapPin, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "SOS — Silent help at Sultan" },
      { name: "description", content: "Feel unsafe at Sultan? Trigger a silent alert. Admin and security respond in minutes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SosPage,
});

const LEVELS = [
  { code: "YELLOW", label: "Uncomfortable situation", desc: "Someone making you uneasy. Low urgency.", color: "bg-yellow-400 text-night-deep" },
  { code: "ORANGE", label: "Harassment", desc: "Verbal or physical harassment in progress.", color: "bg-orange-500 text-night-deep" },
  { code: "RED", label: "Physical threat / fight", desc: "Immediate danger — silent alarm to security.", color: "bg-lava text-cream" },
] as const;

function SosPage() {
  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [shareLoc, setShareLoc] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const trigger = () => {
    if (!code) return toast.error("Pick a level so we know how to respond.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-xl px-5 py-32 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-savanna/20 flex items-center justify-center">
          <Check className="text-savanna" />
        </div>
        <h1 className="font-display text-4xl mt-6">Security has been notified</h1>
        <p className="mt-3 text-foreground/70">A staff member is on their way. Estimated time: <span className="text-gold">~ 2 minutes</span>.</p>
        <p className="mt-2 text-xs text-foreground/50">Stay where you are if it's safe to do so. Admin will follow up via chat once the situation is resolved.</p>
        <button onClick={() => { setSubmitted(false); setCode(null); setNote(""); }} className="mt-8 text-xs text-foreground/60 hover:text-gold underline">Send another</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-5 lg:px-8 py-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lava/15 border border-lava/40 text-lava">
        <Siren size={14} />
        <span className="text-xs uppercase tracking-[0.32em] font-mono">SOS · Silent</span>
      </div>
      <h1 className="font-display text-5xl md:text-6xl mt-4 leading-[0.95]">
        Tell us what's <span className="text-gold-gradient">happening</span>.
      </h1>
      <p className="mt-3 text-foreground/65 max-w-lg">
        Pick a level. Add a short note if you can. We'll notify admin and floor security instantly — no scene, no spotlight on you.
      </p>

      <div className="mt-10 space-y-3">
        {LEVELS.map((l) => {
          const active = code === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setCode(l.code)}
              className={`w-full text-left rounded-3xl p-5 border transition ${active ? "border-gold bg-gold/5" : "border-border/40 hover:border-foreground/30"}`}
            >
              <div className="flex items-center gap-4">
                <span className={`h-3 w-3 rounded-full ${l.color.split(" ")[0]} ${active ? "ring-4 ring-gold/30" : ""}`} />
                <div className="flex-1">
                  <div className="font-display text-lg">{l.label}</div>
                  <div className="text-xs text-foreground/55 mt-0.5">{l.desc}</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-foreground/40">{l.code}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={140}
          rows={2}
          placeholder="Optional — describe in 140 characters or less"
          className="w-full bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
        />
        <label className="flex items-center gap-3 text-xs text-foreground/65">
          <input type="checkbox" checked={shareLoc} onChange={(e) => setShareLoc(e.target.checked)} className="accent-[var(--gold)]" />
          <MapPin size={12} className="text-gold" /> Share my location with security
        </label>
      </div>

      <button
        onClick={trigger}
        className="mt-8 w-full rounded-2xl bg-lava px-5 py-4 text-sm font-semibold text-cream hover:shadow-[0_0_40px_-10px_oklch(0.62_0.21_38)] transition inline-flex items-center justify-center gap-2"
      >
        <Siren size={16} /> Trigger silent alert
      </button>
      <p className="mt-3 text-[11px] text-foreground/45 text-center">
        SOS works without a login. False alerts are logged.
      </p>
    </section>
  );
}
