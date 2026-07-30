import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Ticket, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "empire_event_notif_dismissed";
const DISMISS_HOURS = 12;

interface SpecialEvent {
  id: string;
  name: string;
  ticket_price: number;
  event_date: string;
  event_time: string | null;
}

function shouldShow(dismissedId: string | null, event: SpecialEvent | null): boolean {
  if (!event) return false;
  if (dismissedId === event.id) return false;
  return true;
}

export function EventNotificationBar() {
  const [event, setEvent] = useState<SpecialEvent | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("special_events")
        .select("id, name, ticket_price, event_date, event_time")
        .eq("countdown_enabled", true)
        .eq("status", "published")
        .gte("event_date", now.slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      setEvent(data);

      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.ts > DISMISS_HOURS * 3_600_000) {
            setDismissedId(null);
          } else {
            setDismissedId(parsed.id);
          }
        }
      } catch {
        /* ignore */
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (shouldShow(dismissedId, event)) {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, [dismissedId, event]);

  if (!visible || !event) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ id: event.id, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const daysOut = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86_400_000);

  return (
    <div className="fixed top-16 inset-x-0 z-[60] animate-in slide-in-from-top duration-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="glass rounded-2xl border border-gold/30 shadow-[var(--shadow-glow)] px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gold/15 flex items-center justify-center gold-pulse">
            <Ticket size={16} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-gold">{event.name}</div>
            <div className="text-sm text-foreground/80 truncate">
              {daysOut > 0 ? `In ${daysOut} day${daysOut !== 1 ? "s" : ""}` : "Tonight"} · KES{" "}
              {event.ticket_price.toLocaleString()}
              {event.event_time ? ` · ${event.event_time}` : ""}
            </div>
          </div>
          <Link
            to="/events"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-night-deep bg-gold px-4 py-2 rounded-full hover:shadow-[var(--shadow-glow)] transition shrink-0"
          >
            Book <ArrowRight size={12} />
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="h-7 w-7 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
