import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/admin/chat")({
  component: CrewChat,
});

interface Msg {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name?: string | null;
}

function CrewChat() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const enrich = async (rows: Msg[]) => {
    const ids = Array.from(new Set(rows.map((m) => m.user_id).filter((id) => !profiles[id])));
    if (ids.length === 0) return;
    const { data } = await supabase.from("profiles").select("id,display_name").in("id", ids);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data) next[p.id] = p.display_name ?? "Crew";
        return next;
      });
    }
  };

  const load = async () => {
    const { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: true }).limit(200);
    if (error) { toast.error(error.message); return; }
    setMsgs(data ?? []);
    enrich(data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("crew-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Msg;
        setMsgs((prev) => [...prev, m]);
        enrich([m]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        setMsgs((prev) => prev.filter((m) => m.id !== (payload.old as Msg).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const body = text.trim().slice(0, 2000);
    setText("");
    const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, body });
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <header>
        <div className="eyebrow">Internal</div>
        <h1 className="font-display text-4xl mt-1">Crew chat</h1>
        <p className="text-sm text-foreground/60 mt-1">Realtime room for admin & crew only.</p>
      </header>

      <div className="glass rounded-3xl flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {msgs.length === 0 && <div className="text-center text-foreground/50 text-sm py-12">No messages yet. Say something.</div>}
          {msgs.map((m) => {
            const mine = m.user_id === user?.id;
            const name = profiles[m.user_id] ?? "Crew";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "bg-gold text-night-deep" : "bg-white/[0.06] text-foreground"
                }`}>
                  {!mine && <div className="text-[10px] uppercase tracking-wider text-gold mb-0.5">{name}</div>}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className={`text-[10px] mt-1 ${mine ? "text-night-deep/60" : "text-foreground/50"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
          <button type="submit" disabled={!text.trim()} className="rounded-2xl bg-gold px-4 py-3 text-night-deep disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
