import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Send, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Sultan — direct line to admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UserChatPage,
});

interface Msg { id: string; from: "you" | "admin"; body: string; at: string }

function UserChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "1", from: "admin", body: "Karibu Sultan. This line goes straight to admin — bookings, collabs, anything.", at: new Date().toISOString() },
  ]);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  if (loading || !user) return null;

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: String(Date.now()), from: "you", body: text.trim(), at: new Date().toISOString() }]);
    setText("");
  };

  return (
    <section className="mx-auto max-w-3xl px-5 lg:px-8 py-20 h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Crew chat</div>
          <h1 className="font-display text-3xl mt-2">Direct line to <span className="text-gold-gradient">admin</span></h1>
          <p className="text-xs text-foreground/55 mt-1">All chat is admin-mediated. No DMs between users by default.</p>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 text-xs text-foreground/60">
          <ShieldAlert size={14} className="text-gold" /> Monitored
        </div>
      </div>

      <div className="mt-6 glass rounded-3xl flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {msgs.map((m) => {
            const mine = m.from === "you";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-gold text-night-deep" : "bg-white/[0.06]"}`}>
                  {!mine && <div className="text-[10px] uppercase tracking-wider text-gold mb-0.5">Sultan Admin</div>}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className={`text-[10px] mt-1 ${mine ? "text-night-deep/60" : "text-foreground/50"}`}>
                    {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="border-t border-border/40 p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1 bg-night/60 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
          <button disabled={!text.trim()} className="rounded-2xl bg-gold px-4 py-3 text-night-deep disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </div>
    </section>
  );
}
