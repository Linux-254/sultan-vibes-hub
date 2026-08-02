import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Siren, Search, MapPin, Check, X, BellRing, BellOff, UserCheck } from "lucide-react";

export const Route = createFileRoute("/admin/sos")({
  component: AdminSos,
});

type Status = "open" | "acknowledged" | "resolved" | "false_alarm";
type Level = "YELLOW" | "ORANGE" | "RED";

interface Incident {
  id: string;
  user_id: string | null;
  level: Level;
  note: string | null;
  location_lat: number | null;
  location_lng: number | null;
  share_location: boolean;
  status: Status;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  responder_id: string | null;
  responder_note: string | null;
  created_at: string;
}

interface StaffMember {
  id: string;
  display_name: string;
}

const LEVEL_STYLES: Record<Level, string> = {
  YELLOW: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
  ORANGE: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  RED: "bg-lava/15 text-lava border-lava/50",
};

const STATUS_STYLES: Record<Status, string> = {
  open: "bg-lava/20 text-lava",
  acknowledged: "bg-yellow-400/20 text-yellow-300",
  resolved: "bg-savanna/20 text-savanna",
  false_alarm: "bg-foreground/10 text-foreground/60",
};

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "square";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.42);
  } catch {}
}

function AdminSos() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Incident[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; phone: string | null }>>(
    {},
  );
  const [statusFilter, setStatusFilter] = useState<Status | "all">("open");
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [q, setQ] = useState("");
  const [notify, setNotify] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const enrich = async (ids: string[]) => {
    const need = ids.filter((id) => id && !profiles[id]);
    if (need.length === 0) return;
    const { data } = await supabase.from("profiles").select("id,display_name,phone").in("id", need);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data) next[p.id] = { name: p.display_name ?? "Guest", phone: p.phone };
        return next;
      });
    }
  };

  const loadStaff = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", [
        "admin",
        "crew",
        "bartender",
        "waitress",
        "shisha_distributor",
        "content_manager",
        "security",
      ]);
    if (!data) return;
    const ids = [...new Set(data.map((r: any) => r.user_id))];
    if (ids.length === 0) return;
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    if (profiles) {
      setStaffList(
        profiles.map((p: any) => ({ id: p.id, display_name: p.display_name ?? "Staff" })),
      );
    }
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("sos_incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Incident[]);
    for (const r of data ?? []) seenIds.current.add(r.id);
    enrich((data ?? []).map((r) => r.user_id).filter(Boolean) as string[]);
  };

  useEffect(() => {
    load();
    loadStaff();
    if (notify && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const ch = supabase
      .channel("sos-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sos_incidents" },
        (payload) => {
          const row = payload.new as Incident;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          setRows((prev) => [row, ...prev]);
          if (row.user_id) enrich([row.user_id]);
          if (notify) {
            beep();
            toast.error(`🚨 ${row.level} SOS — respond now`, { duration: 10_000 });
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(`SOS ${row.level}`, {
                body: row.note ?? "Silent alert from a guest",
                tag: row.id,
              });
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_incidents" },
        (payload) => {
          const row = payload.new as Incident;
          setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "sos_incidents" },
        (payload) => {
          setRows((prev) => prev.filter((r) => r.id !== (payload.old as Incident).id));
        },
      )
      .subscribe();

    // Safety net auto-refresh every 30s in case the websocket drops
    const poll = window.setInterval(load, 30_000);
    return () => {
      supabase.removeChannel(ch);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (levelFilter !== "all" && r.level !== levelFilter) return false;
      if (!term) return true;
      const p = r.user_id ? profiles[r.user_id] : null;
      return (
        (p?.name ?? "").toLowerCase().includes(term) ||
        (p?.phone ?? "").toLowerCase().includes(term) ||
        (r.note ?? "").toLowerCase().includes(term) ||
        r.id.toLowerCase().startsWith(term)
      );
    });
  }, [rows, q, statusFilter, levelFilter, profiles]);

  const update = async (id: string, patch: Partial<Incident>) => {
    const { error } = await supabase.from("sos_incidents").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const assignResponder = (r: Incident, responderId: string) =>
    update(r.id, {
      responder_id: responderId,
      responder_note: null,
    });

  const ack = (r: Incident) =>
    update(r.id, {
      status: "acknowledged",
      acknowledged_by: user?.id ?? null,
      acknowledged_at: new Date().toISOString(),
    });
  const resolve = (r: Incident) => {
    if (resolvingId === r.id) {
      update(r.id, {
        status: "resolved",
        resolved_by: user?.id ?? null,
        resolved_at: new Date().toISOString(),
        resolution_note: resolutionNote.trim() || null,
      });
      setResolvingId(null);
      setResolutionNote("");
    } else {
      setResolvingId(r.id);
      setResolutionNote("");
    }
  };
  const dismiss = (r: Incident) => update(r.id, { status: "false_alarm" });

  const counts = useMemo(
    () => ({
      open: rows.filter((r) => r.status === "open").length,
      ack: rows.filter((r) => r.status === "acknowledged").length,
      today: rows.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString())
        .length,
    }),
    [rows],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Emergency</div>
          <h1 className="font-display text-4xl mt-1 flex items-center gap-3">
            <Siren className="text-lava" /> SOS incidents
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Realtime · {counts.open} open · {counts.ack} acknowledged · {counts.today} today
          </p>
        </div>
        <button
          onClick={() => setNotify((n) => !n)}
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-xs hover:border-gold"
        >
          {notify ? <BellRing size={14} className="text-gold" /> : <BellOff size={14} />}
          {notify ? "Alerts on" : "Alerts muted"}
        </button>
      </header>

      <div className="glass rounded-3xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, phone, note, or id…"
            className="w-full bg-night/60 border border-border/50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
          className="bg-night/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="false_alarm">False alarm</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as Level | "all")}
          className="bg-night/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
        >
          <option value="all">All levels</option>
          <option value="RED">Red</option>
          <option value="ORANGE">Orange</option>
          <option value="YELLOW">Yellow</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center text-sm text-foreground/55">
            No incidents match.
          </div>
        )}
        {filtered.map((r) => {
          const p = r.user_id ? profiles[r.user_id] : null;
          const responder = r.responder_id ? staffList.find((s) => s.id === r.responder_id) : null;
          const responseTime =
            r.acknowledged_at &&
            `+${Math.round((new Date(r.acknowledged_at).getTime() - new Date(r.created_at).getTime()) / 1000)}s`;
          return (
            <article
              key={r.id}
              className={`glass rounded-3xl p-5 border ${r.status === "open" ? "border-lava/40 animate-pulse-slow" : "border-border/40"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider font-mono ${LEVEL_STYLES[r.level]}`}
                  >
                    {r.level}
                  </span>
                  <div>
                    <div className="font-display text-lg">{p?.name ?? "Anonymous guest"}</div>
                    <div className="text-xs text-foreground/55 mt-0.5">
                      {p?.phone ? <>{p.phone} · </> : null}
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                    {r.note && <p className="mt-2 text-sm text-foreground/85">{r.note}</p>}
                    {r.responder_note && (
                      <p className="mt-1 text-xs text-gold/80">
                        Responder note: {r.responder_note}
                      </p>
                    )}
                    {r.resolution_note && (
                      <p className="mt-1 text-xs text-savanna/80">
                        Resolution: {r.resolution_note}
                      </p>
                    )}
                    {r.share_location && r.location_lat != null && r.location_lng != null && (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://maps.google.com/?q=${r.location_lat},${r.location_lng}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-gold hover:underline"
                      >
                        <MapPin size={12} /> Open location
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {responder && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-foreground/10 text-foreground/70">
                      <UserCheck size={10} /> {responder.display_name}
                    </span>
                  )}
                  {responseTime && (
                    <span className="text-[10px] font-mono text-foreground/50">
                      ⏱ {responseTime}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(r.status === "open" || r.status === "acknowledged") && staffList.length > 0 && (
                  <select
                    value={r.responder_id ?? ""}
                    onChange={(e) => assignResponder(r, e.target.value)}
                    className="bg-night/60 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gold max-w-[180px]"
                  >
                    <option value="">Assign responder</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.display_name}
                      </option>
                    ))}
                  </select>
                )}
                {r.status === "open" && (
                  <button
                    onClick={() => ack(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-xs text-night-deep hover:opacity-90"
                  >
                    <BellRing size={12} /> Acknowledge
                  </button>
                )}
                {r.status !== "resolved" && r.status !== "false_alarm" && (
                  <>
                    <button
                      onClick={() => resolve(r)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-savanna/20 text-savanna px-3 py-2 text-xs hover:bg-savanna/30"
                    >
                      <Check size={12} /> {resolvingId === r.id ? "Confirm resolve" : "Resolve"}
                    </button>
                    {resolvingId === r.id && (
                      <input
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Resolution note (optional)"
                        maxLength={200}
                        className="bg-night/60 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gold w-56"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") resolve(r);
                          if (e.key === "Escape") {
                            setResolvingId(null);
                            setResolutionNote("");
                          }
                        }}
                      />
                    )}
                  </>
                )}
                {r.status === "open" && (
                  <button
                    onClick={() => dismiss(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2 text-xs hover:border-foreground/40"
                  >
                    <X size={12} /> False alarm
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
