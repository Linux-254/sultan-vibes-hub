import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Siren, MapPin, Check, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { notifySosResponders } from "@/hooks/use-sos-notifications";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "SOS — Silent help at Empire" },
      {
        name: "description",
        content:
          "Feel unsafe at Empire? Trigger a silent alert. Admin and security respond in minutes.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SosPage,
});

const LEVELS = [
  {
    code: "YELLOW",
    label: "Uncomfortable situation",
    desc: "Someone making you uneasy. Low urgency.",
    dot: "bg-yellow-400",
  },
  {
    code: "ORANGE",
    label: "Harassment",
    desc: "Verbal or physical harassment in progress.",
    dot: "bg-orange-500",
  },
  {
    code: "RED",
    label: "Physical threat / fight",
    desc: "Immediate danger — silent alarm to security.",
    dot: "bg-lava",
  },
] as const;

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Awaiting response", color: "text-lava", icon: AlertTriangle },
  acknowledged: { label: "Staff en route", color: "text-yellow-400", icon: Clock },
  resolved: { label: "Resolved", color: "text-savanna", icon: Check },
  false_alarm: { label: "False alarm", color: "text-foreground/50", icon: AlertTriangle },
};

interface MyIncident {
  id: string;
  level: string;
  note: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

async function getCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 4000 },
    );
  });
}

function SosPage() {
  return (
    <RequireAuth>
      <SosPageInner />
    </RequireAuth>
  );
}

function SosPageInner() {
  const [code, setCode] = useState<"YELLOW" | "ORANGE" | "RED" | null>(null);
  const [note, setNote] = useState("");
  const [shareLoc, setShareLoc] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<MyIncident[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("sos_incidents")
          .select("id,level,note,status,created_at,resolved_at,resolution_note")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        setHistory((data ?? []) as MyIncident[]);
      }
    };
    init();
  }, []);

  const trigger = async () => {
    if (!code) return toast.error("Pick a level so we know how to respond.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const coords = shareLoc ? await getCoords() : null;
    const { data: incident, error } = await supabase
      .from("sos_incidents")
      .insert({
        user_id: user?.id ?? null,
        level: code,
        note: note.trim() ? note.trim().slice(0, 140) : null,
        share_location: shareLoc,
        location_lat: coords?.lat ?? null,
        location_lng: coords?.lng ?? null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (incident?.id) notifySosResponders(incident.id).catch(() => {});
    setSubmitted(true);
    if (userId) {
      const { data } = await supabase
        .from("sos_incidents")
        .select("id,level,note,status,created_at,resolved_at,resolution_note")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory((data ?? []) as MyIncident[]);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-xl px-5 py-32 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-savanna/20 flex items-center justify-center">
          <Check className="text-savanna" />
        </div>
        <h1 className="font-display text-4xl mt-6">Security has been notified</h1>
        <p className="mt-3 text-foreground/70">
          A staff member is on their way. Estimated time:{" "}
          <span className="text-gold">~ 2 minutes</span>.
        </p>
        <p className="mt-2 text-xs text-foreground/50">
          Stay where you are if it's safe to do so. Admin will follow up via chat once the situation
          is resolved.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setCode(null);
            setNote("");
          }}
          className="mt-8 text-xs text-foreground/60 hover:text-gold underline"
        >
          Send another
        </button>

        {history.length > 0 && (
          <div className="mt-16 text-left">
            <div className="eyebrow mb-4">Your recent alerts</div>
            <div className="space-y-2">
              {history.map((h) => {
                const meta = STATUS_META[h.status] ?? STATUS_META.open;
                const Icon = meta.icon;
                return (
                  <div key={h.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                    <span className={`mt-0.5 ${meta.color}`}>
                      <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                          {h.level}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-foreground/60 mt-1 truncate">{h.note}</p>
                      )}
                      {h.resolution_note && (
                        <p className="text-xs text-savanna/80 mt-1">Staff: {h.resolution_note}</p>
                      )}
                      <div className="text-[10px] text-foreground/40 mt-1">
                        {new Date(h.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
        Pick a level. Add a short note if you can. We'll notify admin and floor security instantly —
        no scene, no spotlight on you.
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
                <span
                  className={`h-3 w-3 rounded-full ${l.dot} ${active ? "ring-4 ring-gold/30" : ""}`}
                />
                <div className="flex-1">
                  <div className="font-display text-lg">{l.label}</div>
                  <div className="text-xs text-foreground/55 mt-0.5">{l.desc}</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-foreground/40">
                  {l.code}
                </div>
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
          <input
            type="checkbox"
            checked={shareLoc}
            onChange={(e) => setShareLoc(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          <MapPin size={12} className="text-gold" /> Share my location with security
        </label>
      </div>

      <button
        onClick={trigger}
        disabled={busy}
        className="mt-8 w-full rounded-2xl bg-lava px-5 py-4 text-sm font-semibold text-cream hover:shadow-[0_0_40px_-10px_oklch(0.62_0.21_38)] transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Siren size={16} /> {busy ? "Sending…" : "Trigger silent alert"}
      </button>
      <p className="mt-3 text-[11px] text-foreground/45 text-center">
        SOS works without a login. False alerts are logged.
      </p>

      {history.length > 0 && (
        <div className="mt-16">
          <div className="eyebrow mb-4">Your recent alerts</div>
          <div className="space-y-2">
            {history.map((h) => {
              const meta = STATUS_META[h.status] ?? STATUS_META.open;
              const Icon = meta.icon;
              return (
                <div key={h.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                  <span className={`mt-0.5 ${meta.color}`}>
                    <Icon size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                        {h.level}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    {h.note && <p className="text-xs text-foreground/60 mt-1 truncate">{h.note}</p>}
                    {h.resolution_note && (
                      <p className="text-xs text-savanna/80 mt-1">Staff: {h.resolution_note}</p>
                    )}
                    <div className="text-[10px] text-foreground/40 mt-1">
                      {new Date(h.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
