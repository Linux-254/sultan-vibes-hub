import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Users, Mail, Phone, MessageSquare, ChevronDown, ChevronUp, Save } from "lucide-react";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [{ title: "Leads — Empire" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLeads,
});

type LeadRow = {
  id: string;
  lead_type: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = ["new", "contacted", "converted", "lost"] as const;
const TABS = ["All", "New", "Contacted", "Converted", "Lost"] as const;

const TYPE_BADGE: Record<string, string> = {
  collab: "bg-gold/15 text-gold",
  talent: "bg-savanna/15 text-savanna",
  booking: "bg-lava/15 text-lava",
  general: "bg-foreground/10 text-foreground/60",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-gold/15 text-gold",
  contacted: "bg-savanna/15 text-savanna",
  converted: "bg-savanna/25 text-savanna",
  lost: "bg-lava/15 text-lava",
};

const STATUS_DOT: Record<string, string> = {
  new: "bg-gold",
  contacted: "bg-savanna",
  converted: "bg-savanna",
  lost: "bg-lava",
};

function AdminLeads() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isStaff) load();
  }, [isStaff]);

  if (!isStaff) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <p className="text-foreground/60">You do not have access to this page.</p>
      </div>
    );
  }

  const filtered = tab === "All" ? rows : rows.filter((r) => r.status === tab.toLowerCase());

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Status changed to ${status}`);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const saveNotes = async (id: string) => {
    setSavingId(id);
    const notes = notesDraft[id] ?? "";
    const { error } = await supabase
      .from("leads")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Notes saved");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));
    }
    setSavingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Leads</div>
          <h1 className="font-display text-4xl mt-1">Lead Management</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Track and manage incoming leads and inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground/50">
          <Users size={16} />
          <span>{rows.length} total leads</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const key = t.toLowerCase();
          const count = t === "All" ? rows.length : rows.filter((r) => r.status === key).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition border ${
                tab === t
                  ? "bg-gold/15 border-gold/40 text-gold"
                  : "border-border/40 text-foreground/50 hover:border-foreground/30 hover:text-foreground/70"
              }`}
            >
              {t} <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass rounded-3xl p-12 text-center text-foreground/50 text-sm">
          Loading leads…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-foreground/50 text-sm">
          No leads found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const isOpen = expanded === lead.id;
            return (
              <div key={lead.id} className="glass rounded-3xl p-5 kente-border">
                <button
                  onClick={() => {
                    toggle(lead.id);
                    if (!notesDraft[lead.id] && lead.notes !== undefined) {
                      setNotesDraft((prev) => ({ ...prev, [lead.id]: lead.notes ?? "" }));
                    }
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg">{lead.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium ${TYPE_BADGE[lead.lead_type] ?? TYPE_BADGE.general}`}
                        >
                          {lead.lead_type}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium ${STATUS_BADGE[lead.status] ?? STATUS_BADGE.new}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[lead.status] ?? STATUS_DOT.new}`}
                          />
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/50">
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} />
                            {lead.phone}
                          </span>
                        )}
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/70 line-clamp-1">{lead.message}</p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isOpen ? (
                        <ChevronUp size={18} className="text-foreground/40" />
                      ) : (
                        <ChevronDown size={18} className="text-foreground/40" />
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="eyebrow">Contact</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-foreground/70">
                            <Mail size={14} className="text-foreground/40" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-foreground/70">
                              <Phone size={14} className="text-foreground/40" />
                              {lead.phone}
                            </div>
                          )}
                          <div className="text-foreground/40 text-xs mt-2">
                            Submitted {formatDate(lead.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="eyebrow">Status</div>
                        <div className="flex items-center gap-2">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(lead.id, s)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                                lead.status === s
                                  ? `${STATUS_BADGE[s]} border-current`
                                  : "border-border/40 text-foreground/40 hover:text-foreground/60"
                              }`}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="eyebrow">Message</div>
                      <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                        {lead.message}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="eyebrow">Admin Notes</div>
                      <textarea
                        value={notesDraft[lead.id] ?? lead.notes ?? ""}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))
                        }
                        rows={3}
                        placeholder="Add internal notes about this lead…"
                        className="w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                      />
                      <button
                        onClick={() => saveNotes(lead.id)}
                        disabled={savingId === lead.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
                      >
                        <Save size={14} />
                        {savingId === lead.id ? "Saving…" : "Save Notes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
