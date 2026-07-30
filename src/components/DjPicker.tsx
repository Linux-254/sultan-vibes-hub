import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Plus, X, Mic } from "lucide-react";

export type DjEntry = {
  talent_id?: string;
  name: string;
};

interface DjPickerProps {
  value: DjEntry[];
  onChange: (entries: DjEntry[]) => void;
  label?: string;
  className?: string;
}

type TalentRow = {
  id: string;
  stage_name: string;
  talent_type: string;
  avatar_url: string | null;
  status: string;
};

const TYPE_ICON: Record<string, typeof Music> = {
  DJ: Music,
  "Live Artist": Mic,
  MC: Mic,
};

export function DjPicker({
  value = [],
  onChange,
  label = "DJs / Performers",
  className = "",
}: DjPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [talent, setTalent] = useState<TalentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("talent_roster")
        .select("id, stage_name, talent_type, avatar_url, status")
        .in("talent_type", ["DJ", "Live Artist", "MC"])
        .in("status", ["Available", "Featured"])
        .order("sort_order", { ascending: true });
      setTalent(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isSelected = (id: string) => value.some((e) => e.talent_id === id);
  const isCustomSelected = (name: string) => value.some((e) => !e.talent_id && e.name === name);

  const toggleTalent = (t: TalentRow) => {
    if (isSelected(t.id)) {
      onChange(value.filter((e) => e.talent_id !== t.id));
    } else {
      onChange([...value, { talent_id: t.id, name: t.stage_name }]);
    }
  };

  const addCustom = () => {
    const name = customInput.trim();
    if (!name || isCustomSelected(name)) return;
    onChange([...value, { name }]);
    setCustomInput("");
  };

  const removeEntry = (entry: DjEntry) => {
    if (entry.talent_id) {
      onChange(value.filter((e) => e.talent_id !== entry.talent_id));
    } else {
      onChange(value.filter((e) => !(!e.talent_id && e.name === entry.name)));
    }
  };

  const filtered = talent.filter((t) => t.stage_name.toLowerCase().includes(search.toLowerCase()));

  const customFiltered = value.filter((e) => !e.talent_id);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <span className="eyebrow">{label}</span>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((entry, i) => (
            <span
              key={`${entry.talent_id ?? "custom"}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 text-gold px-3 py-1 text-xs font-medium"
            >
              {!entry.talent_id && <Mic size={10} />}
              {entry.name}
              <button
                type="button"
                onClick={() => removeEntry(entry)}
                className="ml-0.5 rounded-full hover:bg-gold/30 p-0.5 transition"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-2 w-full flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm text-left focus:outline-none focus:border-gold transition hover:border-gold/40"
      >
        <Music size={15} className="text-gold shrink-0" />
        <span className="text-foreground/40">
          {loading ? "Loading talent..." : "Pick from roster or add special guest..."}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 glass rounded-2xl p-3 kente-border shadow-[var(--shadow-elevated)] w-full max-h-[360px] flex flex-col">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search talent..."
            className="w-full bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold mb-2"
          />

          {/* Roster list */}
          <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
            {loading && (
              <div className="text-center text-foreground/40 text-xs py-4">Loading...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center text-foreground/40 text-xs py-4">No talent found</div>
            )}
            {filtered.map((t) => {
              const Icon = TYPE_ICON[t.talent_type] ?? Music;
              const active = isSelected(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTalent(t)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition text-sm ${
                    active
                      ? "bg-gold/15 text-gold"
                      : "text-foreground/70 hover:bg-gold/5 hover:text-foreground"
                  }`}
                >
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-border/40"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gold/10 flex items-center justify-center">
                      <Icon size={13} className="text-gold" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.stage_name}</div>
                    <div className="text-[10px] text-foreground/40">{t.talent_type}</div>
                  </div>
                  {active && (
                    <span className="text-[10px] font-bold text-gold bg-gold/20 px-2 py-0.5 rounded-full">
                      ADDED
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom guest input */}
          <div className="mt-2 pt-2 border-t border-border/40">
            <span className="text-[10px] uppercase tracking-wider text-foreground/40 font-mono">
              Special Guest
            </span>
            <div className="flex gap-1.5 mt-1.5">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Guest DJ name..."
                className="flex-1 bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!customInput.trim()}
                className="h-8 w-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center hover:bg-gold/30 transition disabled:opacity-30"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
