import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Send, Search, X } from "lucide-react";

export const Route = createFileRoute("/admin/chat")({
  component: CrewChat,
});

interface Msg {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

interface Member {
  id: string;
  display_name: string | null;
  phone: string | null;
}

export function CrewChat() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [q, setQ] = useState("");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const enrich = async (ids: string[]) => {
    const need = ids.filter((id) => id && !members[id]);
    if (need.length === 0) return;
    const { data } = await supabase.from("profiles").select("id,display_name,phone").in("id", need);
    if (data) {
      setMembers((prev) => {
        const next = { ...prev };
        for (const p of data) next[p.id] = p as Member;
        return next;
      });
    }
  };

  const loadCrew = async () => {
    // Pull all staff so filter dropdown is populated even before they speak
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "crew"]);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (ids.length) await enrich(ids);
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMsgs(data ?? []);
    enrich((data ?? []).map((m) => m.user_id));
  };

  useEffect(() => {
    loadCrew();
    load();
    const ch = supabase
      .channel("crew-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          enrich([m.user_id]);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          setMsgs((prev) => prev.filter((m) => m.id !== (payload.old as Msg).id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return msgs.filter((m) => {
      if (authorFilter !== "all" && m.user_id !== authorFilter) return false;
      if (!term) return true;
      const p = members[m.user_id];
      return (
        m.body.toLowerCase().includes(term) ||
        (p?.display_name ?? "").toLowerCase().includes(term) ||
        (p?.phone ?? "").toLowerCase().includes(term)
      );
    });
  }, [msgs, q, authorFilter, members]);

  useEffect(() => {
    if (!q && authorFilter === "all") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length, q, authorFilter]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const body = text.trim().slice(0, 2000);
    setText("");
    const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, body });
    if (error) toast.error(error.message);
  };

  const memberList = useMemo(
    () =>
      Object.values(members).sort((a, b) =>
        (a.display_name ?? "").localeCompare(b.display_name ?? ""),
      ),
    [members],
  );

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <header>
        <div className="eyebrow">Internal</div>
        <h1 className="font-display text-4xl mt-1">Crew chat</h1>
        <p className="text-sm text-foreground/60 mt-1">Realtime room for admin & crew only.</p>
      </header>

      <div className="glass rounded-3xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, phone, or message…"
            className="w-full bg-night/60 border border-border/50 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          className="bg-night/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
        >
          <option value="all">All crew</option>
          {memberList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name ?? "Crew"}
              {m.phone ? ` · ${m.phone}` : ""}
            </option>
          ))}
        </select>
        <div className="text-xs text-foreground/50 px-2">
          {filtered.length}/{msgs.length}
        </div>
      </div>

      <div className="glass rounded-3xl flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center text-foreground/50 text-sm py-12">
              {msgs.length === 0
                ? "No messages yet. Say something."
                : "No messages match your search."}
            </div>
          )}
          {filtered.map((m) => {
            const mine = m.user_id === user?.id;
            const p = members[m.user_id];
            const name = p?.display_name ?? "Crew";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-gold text-night-deep" : "bg-white/[0.06] text-foreground"
                  }`}
                >
                  {!mine && (
                    <div className="text-[10px] uppercase tracking-wider text-gold mb-0.5">
                      {name}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div
                    className={`text-[10px] mt-1 ${mine ? "text-night-deep/60" : "text-foreground/50"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="border-t border-border/40 p-3 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message the crew…"
            maxLength={2000}
            className="flex-1 bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-2xl bg-gold px-4 py-3 text-night-deep disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
