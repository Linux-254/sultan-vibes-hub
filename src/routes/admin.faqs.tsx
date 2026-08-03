import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, HelpCircle, GripVertical } from "lucide-react";

export const Route = createFileRoute("/admin/faqs")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/people" });
  },
});

type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export function AdminFaqs() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", sort_order: 0, active: true });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
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
    setForm({ question: "", answer: "", sort_order: rows.length, active: true });
    setShowForm(true);
  };

  const startEdit = (r: Faq) => {
    setEditing(r.id);
    setForm({ question: r.question, answer: r.answer, sort_order: r.sort_order, active: r.active });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim())
      return toast.error("Both question and answer are required");
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      sort_order: form.sort_order,
      active: form.active,
    };
    if (editing) {
      const { error } = await supabase.from("faqs").update(payload).eq("id", editing);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("FAQ updated");
    } else {
      const { error } = await supabase.from("faqs").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("FAQ created");
    }
    setShowForm(false);
    setEditing(null);
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const toggleActive = async (r: Faq) => {
    const next = !r.active;
    const { error } = await supabase.from("faqs").update({ active: next }).eq("id", r.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`FAQ ${next ? "activated" : "deactivated"}`);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">FAQs</div>
          <h1 className="font-display text-4xl mt-1">FAQ Management</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage the frequently asked questions shown on the About page.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Plus size={16} /> New FAQ
        </button>
      </header>

      {showForm && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl">{editing ? "Edit FAQ" : "New FAQ"}</div>
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
          <div className="space-y-3">
            <label className="block">
              <span className="eyebrow">Question *</span>
              <input
                value={form.question}
                onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))}
                placeholder="e.g. Do you take reservations?"
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Answer *</span>
              <textarea
                value={form.answer}
                onChange={(e) => setForm((s) => ({ ...s, answer: e.target.value }))}
                rows={4}
                placeholder="Your answer..."
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Sort order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                  className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                    className="accent-[var(--gold)]"
                  />
                  Active (visible on About page)
                </label>
              </div>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving || !form.question.trim() || !form.answer.trim()}
            className="rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Update FAQ" : "Create FAQ"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`glass rounded-2xl p-5 transition ${!r.active ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-gold shrink-0" />
                  <span className="font-medium text-sm">{r.question}</span>
                </div>
                <p className="mt-2 text-sm text-foreground/70 pl-6">{r.answer}</p>
                <div className="mt-2 pl-6 flex items-center gap-3 text-[11px] text-foreground/40">
                  <span>Order: {r.sort_order}</span>
                  <span>{r.active ? "Active" : "Hidden"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleActive(r)}
                  title={r.active ? "Deactivate" : "Activate"}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
                >
                  {r.active ? <X size={14} /> : <Check size={14} />}
                </button>
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
            </div>
          </div>
        ))}
        {rows.length === 0 && !loading && (
          <div className="glass rounded-2xl p-12 text-center text-foreground/50 text-sm">
            No FAQs yet. Create your first question above.
          </div>
        )}
      </div>
    </div>
  );
}
