import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Star,
  ArrowUpDown,
} from "lucide-react";
import { CalendarPicker } from "@/components/CalendarPicker";
import { DjPicker, type DjEntry } from "@/components/DjPicker";
import gsap from "gsap";

export const Route = createFileRoute("/admin/events")({
  component: AdminEvents,
});

type SpecialEventRow = {
  id: string;
  name: string;
  description: string | null;
  ticket_price: number;
  event_date: string;
  event_time: string | null;
  countdown_enabled: boolean;
  status: "draft" | "published" | "cancelled";
  djs: DjEntry[] | null;
  created_at: string;
};

type SiteEventRow = {
  id: string;
  slug: string;
  title: string;
  event_date: string;
  image_url: string | null;
  tags: string[];
  djs: DjEntry[] | null;
  going_count: number;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

const SPECIAL_EMPTY = {
  name: "",
  description: "",
  ticket_price: 0,
  event_date: "",
  event_time: "20:00",
  countdown_enabled: true,
  status: "draft" as const,
  djs: [] as DjEntry[],
};

const SITE_EMPTY = {
  slug: "",
  title: "",
  event_date: "",
  image_url: "",
  tags: "",
  djs: [] as DjEntry[],
  going_count: 0,
  featured: false,
  sort_order: 0,
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-foreground/10 text-foreground/60",
  published: "bg-savanna/15 text-savanna",
  cancelled: "bg-lava/15 text-lava",
};

function AdminEvents() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"special" | "site">("special");
  const [sRows, setSRows] = useState<SpecialEventRow[]>([]);
  const [siRows, setSiRows] = useState<SiteEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"special" | "site">("special");
  const [sForm, setSForm] = useState(SPECIAL_EMPTY);
  const [siForm, setSiForm] = useState(SITE_EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const [sRes, siRes] = await Promise.all([
      supabase.from("special_events").select("*").order("event_date", { ascending: false }),
      supabase.from("site_events").select("*").order("sort_order", { ascending: true }),
    ]);
    if (sRes.error) toast.error(sRes.error.message);
    else setSRows((sRes.data as unknown as SpecialEventRow[]) ?? []);
    if (siRes.error) toast.error(siRes.error.message);
    else setSiRows((siRes.data as unknown as SiteEventRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0.3, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    }
  }, [tab]);

  const startCreate = (type: "special" | "site") => {
    setEditing(null);
    setEditingType(type);
    if (type === "special") setSForm(SPECIAL_EMPTY);
    else setSiForm(SITE_EMPTY);
    setShowForm(true);
  };

  const startEdit = (type: "special" | "site", r: any) => {
    setEditing(r.id);
    setEditingType(type);
    if (type === "special") {
      setSForm({
        name: r.name,
        description: r.description ?? "",
        ticket_price: r.ticket_price,
        event_date: r.event_date,
        event_time: r.event_time ?? "20:00",
        countdown_enabled: r.countdown_enabled,
        status: r.status,
        djs: Array.isArray(r.djs) ? (r.djs as unknown as DjEntry[]) : [],
      });
    } else {
      setSiForm({
        slug: r.slug,
        title: r.title,
        event_date: r.event_date,
        image_url: r.image_url ?? "",
        tags: (r.tags ?? []).join(", "),
        djs: Array.isArray(r.djs) ? (r.djs as unknown as DjEntry[]) : [],
        going_count: r.going_count,
        featured: r.featured,
        sort_order: r.sort_order,
      });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (editingType === "special") {
      if (!sForm.name || !sForm.event_date) return toast.error("Name and date are required");
      setSaving(true);
      const payload = {
        name: sForm.name,
        description: sForm.description || null,
        ticket_price: sForm.ticket_price,
        event_date: sForm.event_date,
        event_time: sForm.event_time || null,
        countdown_enabled: sForm.countdown_enabled,
        status: sForm.status,
        djs: sForm.djs.length > 0 ? sForm.djs : null,
        created_by: user?.id ?? null,
      };
      const { error } = editing
        ? await supabase.from("special_events").update(payload).eq("id", editing)
        : await supabase.from("special_events").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(editing ? "Event updated" : "Event created");
    } else {
      if (!siForm.slug || !siForm.title || !siForm.event_date)
        return toast.error("Slug, title, and date are required");
      setSaving(true);
      const tagsArray = siForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        slug: siForm.slug,
        title: siForm.title,
        event_date: siForm.event_date,
        image_url: siForm.image_url || null,
        tags: tagsArray,
        djs: siForm.djs.length > 0 ? siForm.djs : null,
        going_count: siForm.going_count,
        featured: siForm.featured,
        sort_order: siForm.sort_order,
        created_by: user?.id ?? null,
      };
      const { error } = editing
        ? await supabase
            .from("site_events")
            .update(payload as any)
            .eq("id", editing)
        : await supabase.from("site_events").insert(payload as any);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(editing ? "Site event updated" : "Site event created");
    }
    setShowForm(false);
    setEditing(null);
    setSaving(false);
    load();
  };

  const remove = async (type: "special" | "site", id: string) => {
    if (!confirm("Delete this event?")) return;
    const table = type === "special" ? "special_events" : "site_events";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const toggleStatus = async (r: SpecialEventRow) => {
    const next = r.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("special_events").update({ status: next }).eq("id", r.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Event ${next}`);
      load();
    }
  };

  return (
    <div className="space-y-6" ref={contentRef}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Events</div>
          <h1 className="font-display text-4xl mt-1">Event Control</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage special events and site listings.
          </p>
        </div>
        <button
          onClick={() => startCreate(tab)}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New {tab === "special" ? "Event" : "Site Event"}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-night-deep/60 rounded-2xl p-1 w-fit">
        {(["special", "site"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setShowForm(false);
              setEditing(null);
            }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
              tab === t
                ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {t === "special" ? "Special Events" : "Site Events"}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">
              {editing ? "Edit" : "New"} {editingType === "special" ? "Event" : "Site Event"}
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          {editingType === "special" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Event name</span>
                <input
                  value={sForm.name}
                  onChange={(e) => setSForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Ticket price (KES)</span>
                <input
                  type="number"
                  value={sForm.ticket_price}
                  onChange={(e) =>
                    setSForm((s) => ({ ...s, ticket_price: Number(e.target.value) }))
                  }
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <CalendarPicker
                value={sForm.event_date}
                onChange={(val) => setSForm((s) => ({ ...s, event_date: val }))}
                time
                timeValue={sForm.event_time}
                onTimeChange={(val) => setSForm((s) => ({ ...s, event_time: val }))}
              />
              <label className="block sm:col-span-2">
                <span className="eyebrow">Description</span>
                <textarea
                  value={sForm.description}
                  onChange={(e) => setSForm((s) => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                />
              </label>
              <DjPicker
                value={sForm.djs}
                onChange={(entries) => setSForm((s) => ({ ...s, djs: entries }))}
                className="sm:col-span-2"
              />
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    checked={sForm.countdown_enabled}
                    onChange={(e) =>
                      setSForm((s) => ({ ...s, countdown_enabled: e.target.checked }))
                    }
                    className="accent-[var(--gold)]"
                  />
                  Show countdown on homepage
                </label>
                <select
                  value={sForm.status}
                  onChange={(e) => setSForm((s) => ({ ...s, status: e.target.value as any }))}
                  className="bg-night/60 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={save}
                disabled={saving || !sForm.name || !sForm.event_date}
                className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update Event" : "Create Event"}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Slug</span>
                <input
                  value={siForm.slug}
                  onChange={(e) => setSiForm((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="my-cool-event"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Title</span>
                <input
                  value={siForm.title}
                  onChange={(e) => setSiForm((s) => ({ ...s, title: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <CalendarPicker
                value={siForm.event_date}
                onChange={(val) => setSiForm((s) => ({ ...s, event_date: val }))}
                label="Event Date"
              />
              <label className="block">
                <span className="eyebrow">Image URL</span>
                <input
                  value={siForm.image_url}
                  onChange={(e) => setSiForm((s) => ({ ...s, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow">Tags (comma-separated)</span>
                <input
                  value={siForm.tags}
                  onChange={(e) => setSiForm((s) => ({ ...s, tags: e.target.value }))}
                  placeholder="house, techno, deep"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <DjPicker
                value={siForm.djs}
                onChange={(entries) => setSiForm((s) => ({ ...s, djs: entries }))}
                className="sm:col-span-2"
              />
              <label className="block">
                <span className="eyebrow">Going count</span>
                <input
                  type="number"
                  value={siForm.going_count}
                  onChange={(e) =>
                    setSiForm((s) => ({ ...s, going_count: Number(e.target.value) }))
                  }
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Sort order</span>
                <input
                  type="number"
                  value={siForm.sort_order}
                  onChange={(e) => setSiForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    checked={siForm.featured}
                    onChange={(e) => setSiForm((s) => ({ ...s, featured: e.target.checked }))}
                    className="accent-[var(--gold)]"
                  />
                  Featured event
                </label>
              </div>
              <button
                onClick={save}
                disabled={saving || !siForm.slug || !siForm.title || !siForm.event_date}
                className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update Site Event" : "Create Site Event"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Special Events Table */}
      {tab === "special" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Countdown</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sRows.map((r) => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-foreground/50 truncate max-w-[200px]">
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-foreground/70">
                        <Calendar size={12} className="text-gold" />
                        {r.event_date}
                      </div>
                      {r.event_time && (
                        <div className="text-xs text-foreground/50">{r.event_time}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gold">
                      KES {Number(r.ticket_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.countdown_enabled ? (
                        <Eye size={14} className="text-savanna" />
                      ) : (
                        <EyeOff size={14} className="text-foreground/30" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${STATUS_TONE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleStatus(r)}
                          title={r.status === "published" ? "Unpublish" : "Publish"}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          {r.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => startEdit("special", r)}
                          title="Edit"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove("special", r.id)}
                          title="Delete"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Events Table */}
      {tab === "site" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Going</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {siRows.map((r) => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-foreground/50">{r.slug}</div>
                      {Array.isArray(r.djs) && r.djs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(r.djs as unknown as DjEntry[]).map((dj, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/10 text-gold"
                            >
                              {dj.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-foreground/70">
                        <Calendar size={12} className="text-gold" />
                        {r.event_date}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-foreground/70">
                        <Users size={12} className="text-savanna" />
                        {r.going_count}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.featured ? (
                        <Star size={14} className="text-gold fill-gold" />
                      ) : (
                        <Star size={14} className="text-foreground/20" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit("site", r)}
                          title="Edit"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove("site", r.id)}
                          title="Delete"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {siRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No site events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
