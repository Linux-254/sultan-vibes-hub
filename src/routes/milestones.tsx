import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/milestones")({
  head: () => ({
    meta: [
      { title: "Milestones — Empire Kwa Sultan" },
      {
        name: "description",
        content:
          "The story of Empire, told in moments. From the first night to the biggest summer campaign in our history.",
      },
      {
        name: "keywords",
        content:
          "Empire Kwa Sultan history, Nairobi lounge milestones, Empire story, lounge timeline Kenya",
      },
      { property: "og:title", content: "Empire Milestones" },
      { property: "og:description", content: "The story of Empire, told in moments." },
    ],
  }),
  component: MilestonesPage,
});

function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      const { data } = await supabase
        .from("milestones")
        .select("*")
        .order("sort_order", { ascending: true });
      setMilestones(data ?? []);
      setLoading(false);
    };
    fetchMilestones();
  }, []);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-16 pb-12">
        <div className="eyebrow">The Story</div>
        <h1 className="font-display text-5xl md:text-7xl mt-3">
          How Empire <span className="text-gold-gradient">became Empire.</span>
        </h1>
      </section>

      <section className="mx-auto max-w-3xl px-5 lg:px-8 pb-32">
        {loading ? (
          <p className="text-foreground/60 text-center py-12">Loading milestones…</p>
        ) : (
          <div className="relative pl-8 sm:pl-12">
            <div className="absolute left-3 sm:left-5 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/40 to-transparent" />
            {milestones.map((m: any, i: number) => (
              <div key={m.id ?? i} className="relative pb-14 last:pb-0">
                <div className="absolute -left-[18px] sm:-left-[14px] top-1.5 h-4 w-4 rounded-full bg-gold gold-pulse" />
                <div className="eyebrow">{m.date_label}</div>
                <h3 className="font-display text-2xl md:text-3xl mt-2">
                  <span className={i === milestones.length - 1 ? "text-gold-gradient" : ""}>
                    {m.title}
                  </span>
                </h3>
                <p className="mt-3 text-foreground/70 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
