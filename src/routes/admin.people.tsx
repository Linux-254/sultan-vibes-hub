import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Music,
  Camera,
  Video,
  Mic,
  User,
  Eye,
  EyeOff,
  Handshake,
  Image,
  Shield,
  HelpCircle,
  Users,
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import gsap from "gsap";
import { AdminHub, canAccessTab, type AdminHubTab } from "@/components/admin/AdminHub";
import { RolesPage } from "./admin.roles";
import { AdminFaqs } from "./admin.faqs";

export const Route = createFileRoute("/admin/people")({
  component: PeopleHub,
});

function PeopleHub() {
  const { roles, isAdmin } = useAuth();
  const tabs: AdminHubTab[] = [
    {
      id: "people",
      label: "People",
      icon: Users,
      component: AdminPeople,
      roles: ["content_manager"],
    },
    { id: "roles", label: "Roles & access", icon: Shield, component: RolesPage, adminOnly: true },
    { id: "faqs", label: "FAQs", icon: HelpCircle, component: AdminFaqs },
  ];
  const visible = tabs.filter((t) => canAccessTab(roles, isAdmin, t.adminOnly, t.roles));
  return (
    <AdminHub
      eyebrow="People"
      title="People & access"
      description="Talent, collabs, roles and FAQ content."
      tabs={visible}
    />
  );
}

type TalentRow = {
  id: string;
  username: string;
  stage_name: string;
  talent_type: "DJ" | "Live Artist" | "MC" | "Dancer" | "Photographer" | "Videographer";
  status: string;
  bio: string | null;
  avatar_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

type CollabRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  partner_type: string;
  logo_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

const TALENT_EMPTY = {
  username: "",
  stage_name: "",
  talent_type: "DJ" as TalentRow["talent_type"],
  status: "Available",
  bio: "",
  avatar_url: "",
  featured: false,
  sort_order: 0,
};

const COLLAB_EMPTY = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  partner_type: "Beverage",
  logo_url: "",
  featured: false,
  sort_order: 0,
};

const TALENT_ICONS: Record<string, typeof Music> = {
  DJ: Music,
  "Live Artist": Mic,
  MC: Mic,
  Dancer: User,
  Photographer: Camera,
  Videographer: Video,
};

const STATUS_TONE: Record<string, string> = {
  Available: "bg-savanna/15 text-savanna",
  Unavailable: "bg-lava/15 text-lava",
  Featured: "bg-gold/15 text-gold",
  Inactive: "bg-foreground/10 text-foreground/60",
};

const PARTNER_TYPES = [
  "Music & DJs",
  "Beverage",
  "Fashion",
  "Grooming",
  "Tech",
  "Creators",
  "Agencies",
];

const TYPE_TONE: Record<string, string> = {
  "Music & DJs": "bg-gold/15 text-gold",
  Beverage: "bg-savanna/15 text-savanna",
  Fashion: "bg-purple-500/15 text-purple-400",
  Grooming: "bg-sky-500/15 text-sky-400",
  Tech: "bg-blue-500/15 text-blue-400",
  Creators: "bg-pink-500/15 text-pink-400",
  Agencies: "bg-orange-500/15 text-orange-400",
};

export function AdminPeople() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"talent" | "collab">("talent");
  const [tRows, setTRows] = useState<TalentRow[]>([]);
  const [cRows, setCRows] = useState<CollabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"talent" | "collab">("talent");
  const [tForm, setTForm] = useState(TALENT_EMPTY);
  const [cForm, setCForm] = useState(COLLAB_EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from("talent_roster").select("*").order("sort_order", { ascending: true }),
      supabase.from("collabs").select("*").order("sort_order", { ascending: true }),
    ]);
    if (tRes.error) toast.error(tRes.error.message);
    else setTRows(tRes.data ?? []);
    if (cRes.error) toast.error(cRes.error.message);
    else setCRows(cRes.data ?? []);
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

  const startCreate = (type: "talent" | "collab") => {
    setEditing(null);
    setEditingType(type);
    if (type === "talent") setTForm(TALENT_EMPTY);
    else setCForm(COLLAB_EMPTY);
    setShowForm(true);
  };

  const startEdit = (type: "talent" | "collab", r: any) => {
    setEditing(r.id);
    setEditingType(type);
    if (type === "talent") {
      setTForm({
        username: r.username,
        stage_name: r.stage_name,
        talent_type: r.talent_type,
        status: r.status,
        bio: r.bio ?? "",
        avatar_url: r.avatar_url ?? "",
        featured: r.featured,
        sort_order: r.sort_order,
      });
    } else {
      setCForm({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline ?? "",
        description: r.description ?? "",
        partner_type: r.partner_type,
        logo_url: r.logo_url ?? "",
        featured: r.featured,
        sort_order: r.sort_order,
      });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (editingType === "talent") {
      if (!tForm.username || !tForm.stage_name)
        return toast.error("Username and stage name are required");
      setSaving(true);
      const payload = {
        username: tForm.username,
        stage_name: tForm.stage_name,
        talent_type: tForm.talent_type,
        status: tForm.status,
        bio: tForm.bio || null,
        avatar_url: tForm.avatar_url || null,
        featured: tForm.featured,
        sort_order: tForm.sort_order,
        created_by: user?.id ?? null,
      };
      const { error } = editing
        ? await supabase.from("talent_roster").update(payload).eq("id", editing)
        : await supabase.from("talent_roster").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(editing ? "Talent updated" : "Talent created");
    } else {
      if (!cForm.name || !cForm.slug) return toast.error("Name and slug are required");
      setSaving(true);
      const payload = {
        slug: cForm.slug,
        name: cForm.name,
        tagline: cForm.tagline || null,
        description: cForm.description || null,
        partner_type: cForm.partner_type,
        logo_url: cForm.logo_url || null,
        featured: cForm.featured,
        sort_order: cForm.sort_order,
        created_by: user?.id ?? null,
      };
      const { error } = editing
        ? await supabase.from("collabs").update(payload).eq("id", editing)
        : await supabase.from("collabs").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success(editing ? "Collaboration updated" : "Collaboration created");
    }
    setShowForm(false);
    setEditing(null);
    setSaving(false);
    load();
  };

  const remove = async (type: "talent" | "collab", id: string) => {
    if (!confirm("Delete this entry?")) return;
    const table = type === "talent" ? "talent_roster" : "collabs";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const toggleFeatured = async (type: "talent" | "collab", id: string, current: boolean) => {
    const next = !current;
    const table = type === "talent" ? "talent_roster" : "collabs";
    const { error } = await supabase.from(table).update({ featured: next }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "Featured" : "Unfeatured");
      load();
    }
  };

  return (
    <div className="space-y-6" ref={contentRef}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">People</div>
          <h1 className="font-display text-4xl mt-1">People & Partners</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage talent roster and brand collaborations.
          </p>
        </div>
        <button
          onClick={() => startCreate(tab)}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New {tab === "talent" ? "Talent" : "Collaboration"}
        </button>
      </header>

      <div className="flex gap-1.5 bg-night-deep/60 rounded-2xl p-1 w-fit">
        {(["talent", "collab"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setShowForm(false);
              setEditing(null);
            }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-gold text-night-deep shadow-[var(--shadow-glow)]" : "text-foreground/60 hover:text-foreground"}`}
          >
            {t === "talent" ? "Talent Roster" : "Collaborations"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">
              {editing ? "Edit" : "New"} {editingType === "talent" ? "Talent" : "Collaboration"}
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
          {editingType === "talent" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Username *</span>
                <input
                  value={tForm.username}
                  onChange={(e) => setTForm((s) => ({ ...s, username: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Stage Name *</span>
                <input
                  value={tForm.stage_name}
                  onChange={(e) => setTForm((s) => ({ ...s, stage_name: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Talent Type</span>
                <select
                  value={tForm.talent_type}
                  onChange={(e) =>
                    setTForm((s) => ({
                      ...s,
                      talent_type: e.target.value as TalentRow["talent_type"],
                    }))
                  }
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                >
                  <option value="DJ">DJ</option>
                  <option value="Live Artist">Live Artist</option>
                  <option value="MC">MC</option>
                  <option value="Dancer">Dancer</option>
                  <option value="Photographer">Photographer</option>
                  <option value="Videographer">Videographer</option>
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Status</span>
                <input
                  value={tForm.status}
                  onChange={(e) => setTForm((s) => ({ ...s, status: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <div className="block">
                <ImageUpload
                  folder="talent"
                  value={tForm.avatar_url}
                  onChange={(url) => setTForm((s) => ({ ...s, avatar_url: url }))}
                  label="Avatar image"
                  className="h-32"
                />
              </div>
              <label className="block">
                <span className="eyebrow">Sort Order</span>
                <input
                  type="number"
                  value={tForm.sort_order}
                  onChange={(e) => setTForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow">Bio</span>
                <textarea
                  value={tForm.bio}
                  onChange={(e) => setTForm((s) => ({ ...s, bio: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/70 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={tForm.featured}
                  onChange={(e) => setTForm((s) => ({ ...s, featured: e.target.checked }))}
                  className="accent-[var(--gold)]"
                />
                Featured on homepage
              </label>
              <button
                onClick={save}
                disabled={saving || !tForm.username || !tForm.stage_name}
                className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update Talent" : "Create Talent"}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Partner name</span>
                <input
                  value={cForm.name}
                  onChange={(e) => setCForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Slug</span>
                <input
                  value={cForm.slug}
                  onChange={(e) => setCForm((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="unique-url-key"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Tagline</span>
                <input
                  value={cForm.tagline}
                  onChange={(e) => setCForm((s) => ({ ...s, tagline: e.target.value }))}
                  placeholder="Short tagline"
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Partner type</span>
                <select
                  value={cForm.partner_type}
                  onChange={(e) => setCForm((s) => ({ ...s, partner_type: e.target.value }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                >
                  {PARTNER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow">Description</span>
                <textarea
                  value={cForm.description}
                  onChange={(e) => setCForm((s) => ({ ...s, description: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                />
              </label>
              <div className="block sm:col-span-2">
                <ImageUpload
                  folder="collabs"
                  value={cForm.logo_url}
                  onChange={(url) => setCForm((s) => ({ ...s, logo_url: url }))}
                  label="Partner logo"
                  className="h-32"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    checked={cForm.featured}
                    onChange={(e) => setCForm((s) => ({ ...s, featured: e.target.checked }))}
                    className="accent-[var(--gold)]"
                  />
                  Featured on homepage
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/70">
                  <span className="eyebrow">Sort order</span>
                  <input
                    type="number"
                    value={cForm.sort_order}
                    onChange={(e) =>
                      setCForm((s) => ({ ...s, sort_order: Number(e.target.value) }))
                    }
                    className="w-20 bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  />
                </label>
              </div>
              <button
                onClick={save}
                disabled={saving || !cForm.name || !cForm.slug}
                className="sm:col-span-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update Collaboration" : "Create Collaboration"}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "talent" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Talent</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tRows.map((r) => {
                  const Icon = TALENT_ICONS[r.talent_type] ?? User;
                  return (
                    <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.avatar_url ? (
                            <img
                              src={r.avatar_url}
                              alt={r.stage_name}
                              className="h-9 w-9 rounded-full object-cover border border-border/40"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gold/10 border border-border/40 inline-flex items-center justify-center">
                              <Icon size={14} className="text-gold" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{r.stage_name}</div>
                            <div className="text-xs text-foreground/50">@{r.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-foreground/70">
                          <Icon size={12} className="text-gold" />
                          {r.talent_type}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${STATUS_TONE[r.status] ?? "bg-foreground/10 text-foreground/60"}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {r.featured ? (
                          <Star size={14} className="text-gold fill-gold" />
                        ) : (
                          <StarOff size={14} className="text-foreground/30" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleFeatured("talent", r.id, r.featured)}
                            title={r.featured ? "Unfeature" : "Feature"}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                          >
                            {r.featured ? <StarOff size={14} /> : <Star size={14} />}
                          </button>
                          <button
                            onClick={() => startEdit("talent", r)}
                            title="Edit"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => remove("talent", r.id)}
                            title="Delete"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No talent yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "collab" && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3 hidden md:table-cell">Slug</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cRows.map((r) => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.logo_url && (
                          <img
                            src={r.logo_url}
                            alt=""
                            className="h-8 w-8 rounded-lg object-cover border border-border/40"
                          />
                        )}
                        <div>
                          <div className="font-medium">{r.name}</div>
                          {r.tagline && (
                            <div className="text-xs text-foreground/50 truncate max-w-[200px]">
                              {r.tagline}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${TYPE_TONE[r.partner_type] ?? "bg-foreground/10 text-foreground/60"}`}
                      >
                        {r.partner_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/60 hidden md:table-cell">
                      {r.slug}
                    </td>
                    <td className="px-4 py-3">
                      {r.featured ? (
                        <Eye size={14} className="text-gold" />
                      ) : (
                        <EyeOff size={14} className="text-foreground/30" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleFeatured("collab", r.id, r.featured)}
                          title={r.featured ? "Unfeature" : "Feature"}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          {r.featured ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => startEdit("collab", r)}
                          title="Edit"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove("collab", r.id)}
                          title="Delete"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No collaborations yet.
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
