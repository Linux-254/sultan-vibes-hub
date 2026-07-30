import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar, Hash } from "lucide-react";

export const Route = createFileRoute("/admin/milestones")({
  component: AdminMilestones,
});

type MilestoneRow = {
  id: string;
  date_label: string;
  title: string;
  body: string | null;
  sort_order: number;
  created_at: string;
};

type FormData = {
  date_label: string;
  title: string;
  body: string;
  sort_order: number;
};

const EMPTY_FORM: FormData = {
  date_label: "",
  title: "",
  body: "",
  sort_order: 0,
};

function AdminMilestones() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MilestoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("milestones")
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

  const startEdit = (r: MilestoneRow) => {
    setEditing(r.id);
    setForm({
      date_label: r.date_label,
      title: r.title,
      body: r.body ?? "",
      sort_order: r.sort_order,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.date_label || !form.title) return toast.error("Date label and title are required");
    setSaving(true);
    const payload = {
      date_label: form.date_label,
      title: form.title,
      body: form.body || null,
      sort_order: form.sort_order,
      created_by: user?.id ?? null,
    };
    if (editing) {
      const { error } = await supabase.from("milestones").update(payload).eq("id", editing);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Milestone updated");
    } else {
      const { error } = await supabase.from("milestones").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Milestone created");
    }
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Milestones</div>
          <h1 className="font-display text-4xl mt-1">Milestones</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage your company timeline and key milestones.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New Milestone
        </button>
      </header>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">
              {editing ? "Edit Milestone" : "New Milestone"}
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
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="eyebrow">Date label</span>
              <input
                value={form.date_label}
                onChange={(e) => setForm((s) => ({ ...s, date_label: e.target.value }))}
                placeholder="e.g. Mar 2022"
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Sort order</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="eyebrow">Body</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
                rows={3}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
              />
            </label>
          </div>
          <button
            onClick={save}
            disabled={saving || !form.date_label || !form.title}
            className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update Milestone" : "Create Milestone"}
          </button>
        </div>
      )}

      {/* List */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Body</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-foreground/70">
                      <Calendar size={12} className="text-gold" />
                      {r.date_label}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.body && (
                      <div className="text-xs text-foreground/50 truncate max-w-[200px]">
                        {r.body}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-foreground/70">
                      <Hash size={12} className="text-gold" />
                      {r.sort_order}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(r)}
                        title="Edit"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        title="Delete"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-foreground/50 text-sm">
                    No milestones yet. Create your first milestone above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
