import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Camera,
  Video,
  Calendar,
  DollarSign,
  X,
  Image,
  Film,
  GripVertical,
  Eye,
  Lock,
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/admin/recap")({
  head: () => ({
    meta: [{ title: "Recap — Empire Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminRecap,
});

type RecapRow = {
  id: string;
  name: string;
  event_date: string;
  cover_url: string | null;
  photo_count: number | null;
  video_count: number | null;
  bundle_price: number | null;
  sort_order: number | null;
  created_at: string;
};

type RecapMedia = {
  id: string;
  recap_event_id: string;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  free_preview: boolean;
  unlock_price: number;
  sort_order: number;
  created_at: string;
};

type FormData = {
  name: string;
  event_date: string;
  cover_url: string;
  photo_count: number;
  video_count: number;
  bundle_price: number;
  sort_order: number;
};

const EMPTY_FORM: FormData = {
  name: "",
  event_date: "",
  cover_url: "",
  photo_count: 0,
  video_count: 0,
  bundle_price: 0,
  sort_order: 0,
};

const TABS = [
  { key: "events", label: "Events" },
  { key: "media", label: "Media" },
] as const;

function AdminRecap() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"events" | "media">("events");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Recap</div>
          <h1 className="font-display text-4xl mt-1">Recap Management</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage recap events and their media (photos, videos, bundle pricing).
          </p>
        </div>
      </header>

      <div className="glass rounded-2xl p-1 inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === t.key ? "bg-gold text-night-deep" : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "events" ? <RecapEvents user={user} /> : <RecapMedia />}
    </div>
  );
}

/* ─── Events Tab ─────────────────────────────────────────── */

function RecapEvents({ user }: { user: any }) {
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recap_events")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (r: RecapRow) => {
    setEditing(r.id);
    setForm({
      name: r.name,
      event_date: r.event_date,
      cover_url: r.cover_url ?? "",
      photo_count: r.photo_count ?? 0,
      video_count: r.video_count ?? 0,
      bundle_price: r.bundle_price ?? 0,
      sort_order: r.sort_order ?? 0,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.event_date) return toast.error("Name and date are required");
    setSaving(true);
    const payload = {
      name: form.name,
      event_date: form.event_date,
      cover_url: form.cover_url || null,
      photo_count: form.photo_count,
      video_count: form.video_count,
      bundle_price: form.bundle_price,
      sort_order: form.sort_order,
      created_by: user?.id ?? null,
    };
    if (editing) {
      const { error } = await supabase.from("recap_events").update(payload).eq("id", editing);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Recap updated");
    } else {
      const { error } = await supabase.from("recap_events").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Recap created");
    }
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this recap?")) return;
    const { error } = await supabase.from("recap_events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New Recap
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 border border-border/40 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="font-display text-xl">{editing ? "Edit Recap" : "New Recap"}</div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-white/10 transition"
              >
                <X size={16} className="text-foreground/50" />
              </button>
            </div>
            <ImageUpload
              folder="recap"
              value={form.cover_url}
              onChange={(url) => setForm((s) => ({ ...s, cover_url: url }))}
              label="Upload cover"
              className="h-40"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Event name", key: "name", type: "text" },
                {
                  label: "Event date",
                  key: "event_date",
                  type: "text",
                  placeholder: "e.g. May 4, 2026",
                },
                { label: "Photo count", key: "photo_count", type: "number" },
                { label: "Video count", key: "video_count", type: "number" },
                { label: "Bundle price (KES)", key: "bundle_price", type: "number" },
                { label: "Sort order", key: "sort_order", type: "number" },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="eyebrow">{f.label}</span>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    placeholder={"placeholder" in f ? (f as any).placeholder : undefined}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={save}
                disabled={saving || !form.name || !form.event_date}
                className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update Recap" : "Create Recap"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-2xl border border-border/50 px-6 py-3 text-sm font-medium text-foreground/70 hover:bg-white/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((r) => (
          <div key={r.id} className="glass rounded-3xl p-5 group relative overflow-hidden">
            {r.cover_url ? (
              <div className="relative -mx-5 -mt-5 mb-4 h-44 overflow-hidden rounded-t-3xl">
                <img src={r.cover_url} alt={r.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative -mx-5 -mt-5 mb-4 h-32 flex items-center justify-center bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
                <Camera size={32} className="text-foreground/15" />
              </div>
            )}
            <h3 className="font-display text-lg leading-snug">{r.name}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-foreground/50">
              <Calendar size={12} /> {r.event_date}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-foreground/60">
                <Camera size={13} className="text-gold" /> {r.photo_count ?? 0}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-foreground/60">
                <Video size={13} className="text-gold" /> {r.video_count ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-sm font-mono text-gold">
              <DollarSign size={14} /> KES {Number(r.bundle_price ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
              <button
                onClick={() => startEdit(r)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/50 py-2 text-xs font-medium hover:border-gold hover:text-gold transition"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => remove(r.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/50 py-2 text-xs font-medium hover:border-lava hover:text-lava transition"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 glass rounded-3xl p-16 text-center text-foreground/40 text-sm">
            No recaps yet. Create your first one.
          </div>
        )}
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-3xl p-5 animate-pulse">
              <div className="h-44 -mx-5 -mt-5 mb-4 bg-white/[0.04] rounded-t-3xl" />
              <div className="h-5 bg-white/[0.06] rounded-lg w-2/3" />
              <div className="h-3 bg-white/[0.04] rounded-lg w-1/2 mt-3" />
              <div className="h-3 bg-white/[0.04] rounded-lg w-1/3 mt-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Media Tab ───────────────────────────────────────────── */

function RecapMedia() {
  const [events, setEvents] = useState<RecapRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [media, setMedia] = useState<RecapMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    recap_event_id: "",
    media_type: "image",
    url: "",
    thumbnail_url: "",
    free_preview: false,
    unlock_price: 0,
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("recap_events")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setEvents(data ?? []);
  };

  const loadMedia = async (eventId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recap_media")
      .select("*")
      .eq("recap_event_id", eventId)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setMedia(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);
  useEffect(() => {
    if (selectedEventId) loadMedia(selectedEventId);
  }, [selectedEventId]);

  const startCreate = () => {
    setEditing(null);
    setForm({
      recap_event_id: selectedEventId,
      media_type: "image",
      url: "",
      thumbnail_url: "",
      free_preview: false,
      unlock_price: 0,
      sort_order: media.length,
    });
    setShowForm(true);
  };

  const startEdit = (m: RecapMedia) => {
    setEditing(m.id);
    setForm({
      recap_event_id: m.recap_event_id,
      media_type: m.media_type,
      url: m.url,
      thumbnail_url: m.thumbnail_url ?? "",
      free_preview: m.free_preview,
      unlock_price: m.unlock_price,
      sort_order: m.sort_order,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.url.trim()) return toast.error("URL is required");
    setSaving(true);
    const payload = {
      recap_event_id: form.recap_event_id,
      media_type: form.media_type,
      url: form.url.trim(),
      thumbnail_url: form.thumbnail_url.trim() || null,
      free_preview: form.free_preview,
      unlock_price: form.unlock_price,
      sort_order: form.sort_order,
    };
    if (editing) {
      const { error } = await supabase.from("recap_media").update(payload).eq("id", editing);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Media updated");
    } else {
      const { error } = await supabase.from("recap_media").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Media created");
    }
    setShowForm(false);
    setEditing(null);
    setSaving(false);
    if (selectedEventId) loadMedia(selectedEventId);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this media item?")) return;
    const { error } = await supabase.from("recap_media").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      loadMedia(selectedEventId);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4 flex flex-wrap items-end gap-4">
        <label className="flex-1 min-w-[220px] block">
          <span className="eyebrow">Select Event</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">Choose a recap event...</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.event_date})
              </option>
            ))}
          </select>
        </label>
        {selectedEventId && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition shrink-0"
          >
            <Plus size={16} /> New Media
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-5 border border-border/40">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">{editing ? "Edit Media" : "New Media"}</div>
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
          <div className="space-y-4">
            <label className="block">
              <span className="eyebrow">Media Type *</span>
              <select
                value={form.media_type}
                onChange={(e) => setForm((s) => ({ ...s, media_type: e.target.value }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
            <div>
              <span className="eyebrow">
                {form.media_type === "video" ? "Video URL *" : "Image URL *"}
              </span>
              {form.media_type === "image" ? (
                <div className="mt-2">
                  <ImageUpload
                    folder="recap"
                    value={form.url}
                    onChange={(url) => setForm((s) => ({ ...s, url: url }))}
                    label="Upload image"
                    className="h-48"
                  />
                </div>
              ) : (
                <input
                  value={form.url}
                  onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
                  placeholder="https://..."
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              )}
            </div>
            <div>
              <span className="eyebrow">Thumbnail</span>
              <div className="mt-2">
                <ImageUpload
                  folder="recap"
                  value={form.thumbnail_url}
                  onChange={(url) => setForm((s) => ({ ...s, thumbnail_url: url }))}
                  label="Upload thumbnail (optional)"
                  className="h-40"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Unlock Price</span>
                <input
                  type="number"
                  value={form.unlock_price}
                  onChange={(e) => setForm((s) => ({ ...s, unlock_price: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Sort Order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.free_preview}
                onChange={(e) => setForm((s) => ({ ...s, free_preview: e.target.checked }))}
                className="accent-[var(--gold)]"
              />
              <span className="text-sm text-foreground/70">Free Preview</span>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving || !form.url.trim()}
            className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Update Media" : "Create Media"}
          </button>
        </div>
      )}

      {!selectedEventId && (
        <div className="glass rounded-3xl p-16 text-center text-foreground/50 text-sm">
          Select a recap event above to manage its media.
        </div>
      )}

      {selectedEventId && !showForm && (
        <div>
          {selectedEvent && (
            <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-4 border border-border/30">
              {selectedEvent.cover_url ? (
                <img
                  src={selectedEvent.cover_url}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Image size={20} className="text-foreground/20" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display text-base">{selectedEvent.name}</div>
                <div className="text-xs text-foreground/50 mt-0.5">{selectedEvent.event_date}</div>
              </div>
              <div className="text-xs text-foreground/40 shrink-0">{media.length} items</div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((m) => (
              <div key={m.id} className="glass rounded-2xl overflow-hidden group">
                <div className="relative aspect-[4/3] bg-night/60 overflow-hidden">
                  {m.media_type === "video" ? (
                    <img
                      src={m.thumbnail_url || m.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={m.thumbnail_url || m.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm font-semibold text-white/80">
                      {m.media_type === "video" ? (
                        <>
                          <Film size={10} /> Video
                        </>
                      ) : (
                        <>
                          <Image size={10} /> Image
                        </>
                      )}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    {m.free_preview ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-500/80 backdrop-blur-sm font-semibold text-white">
                        <Eye size={10} /> Free
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm font-semibold text-white/80">
                        <Lock size={10} /> KES {m.unlock_price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-foreground/40">
                      <GripVertical size={11} /> #{m.sort_order}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(m)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => remove(m.id)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {media.length === 0 && !loading && (
              <div className="sm:col-span-2 lg:col-span-3 glass rounded-2xl p-12 text-center text-foreground/50 text-sm">
                No media items yet. Add your first one above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
