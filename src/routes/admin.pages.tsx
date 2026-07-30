import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({
  head: { title: "Site Pages — Empire Admin", name: "robots", content: "noindex" },
  component: AdminPages,
});

type PageContent = {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
};

function AdminPages() {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("site_content").select("*").order("slug");
    if (data) setPages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (slug: string, content: string) => {
    setSaving(slug);
    const { error } = await supabase
      .from("site_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("slug", slug);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      load();
    }
    setSaving(null);
  };

  const updateContent = (slug: string, val: string) =>
    setPages((prev) => prev.map((p) => (p.slug === slug ? { ...p, content: val } : p)));

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">Content</div>
        <h1 className="font-display text-4xl mt-1">Site Pages</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Edit About page text, story section, and values. Changes appear live immediately.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-3xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-white/[0.06] rounded-lg w-1/3" />
              <div className="h-24 bg-white/[0.04] rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {pages.map((p) => (
            <div key={p.id} className="glass rounded-3xl p-5 sm:p-6 border border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-gold" />
                <span className="font-display text-base">{p.title}</span>
                <span className="text-[10px] font-mono text-foreground/40 ml-auto">
                  {p.slug}
                </span>
              </div>
              {p.slug === "about-values" ? (
                <div>
                  <textarea
                    value={p.content}
                    onChange={(e) => updateContent(p.slug, e.target.value)}
                    rows={10}
                    className="w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold resize-y"
                  />
                  <p className="text-[10px] text-foreground/40 mt-1">
                    JSON array of value objects with icon, title, body fields.
                  </p>
                </div>
              ) : (
                <input
                  value={p.content}
                  onChange={(e) => updateContent(p.slug, e.target.value)}
                  className="w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-foreground/40">
                  {p.updated_at ? `Updated ${new Date(p.updated_at).toLocaleString()}` : "Not yet updated"}
                </span>
                <button
                  onClick={() => save(p.slug, p.content)}
                  disabled={saving === p.slug}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-night-deep hover:opacity-90 transition disabled:opacity-50"
                >
                  <Save size={12} /> {saving === p.slug ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
