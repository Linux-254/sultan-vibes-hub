import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Countdown } from "@/components/Countdown";

/**
 * Summer Tides popup — replaces the standalone /summer-tides page.
 *
 * Behaviour:
 *  - Appears as a centred modal on first visit (per-session)
 *  - Auto-hides if `now > EVENT_END + GRACE_DAYS` so it disappears
 *    naturally one month after the campaign ends.
 *  - Users can dismiss with X; we remember dismissal for 24h.
 */

// Campaign config — change these dates to control the popup lifecycle.
const EVENT_START = new Date("2025-12-15T18:00:00+03:00"); // Summer Tides launch
const EVENT_END = new Date("2026-01-26T03:00:00+03:00");   // Last night of the campaign
const GRACE_DAYS = 30;                                      // keep the photo/video window open

const DISMISS_KEY = "sultan_st_popup_dismissed_at";
const DISMISS_HOURS = 24;

function isCampaignWindowOpen(now = Date.now()) {
  const end = EVENT_END.getTime() + GRACE_DAYS * 86_400_000;
  return now < end;
}

function shouldShow(): boolean {
  if (!isCampaignWindowOpen()) return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts > DISMISS_HOURS * 3_600_000;
  } catch {
    return true;
  }
}

export function SummerTidesPopup() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!shouldShow()) return;
    // small delay so it doesn't fight the hero animation
    const t = setTimeout(() => setOpen(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  const now = Date.now();
  const isLive = now >= EVENT_START.getTime() && now <= EVENT_END.getTime();
  const isPost = now > EVENT_END.getTime() && isCampaignWindowOpen(now);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summer-tides-popup-title"
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-night-deep/85 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl wave-bg kente-border shadow-[var(--shadow-elevated)] animate-in zoom-in-95 duration-300">
        <div className="absolute inset-0 grain pointer-events-none" />

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-night-deep/60 hover:bg-night-deep flex items-center justify-center text-foreground/80 hover:text-gold transition"
        >
          <X size={16} />
        </button>

        <div className="relative p-7 sm:p-9">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 border border-gold/30 gold-pulse">
            <Sparkles size={12} className="text-gold" />
            <span className="text-[10px] uppercase tracking-[0.32em] text-gold font-mono">
              {isPost ? "Tides · Memory Lane" : isLive ? "Tides · Live Now" : "Tides · Coming"}
            </span>
          </div>

          <h2
            id="summer-tides-popup-title"
            className="font-display text-5xl sm:text-6xl mt-4 leading-[0.92]"
          >
            <span className="text-gold-gradient">Summer</span>
            <br />
            <span className="font-italic italic font-normal">tides</span>
          </h2>

          <p className="mt-4 text-sm text-foreground/80 max-w-sm">
            {isPost
              ? "The wave has rolled out — but the photos and videos are still rolling in. Find your night, claim your moment."
              : isLive
                ? "Six weeks. One island. The biggest sound system Sultan has ever assembled — happening right now."
                : "Six weeks. One island. The biggest sound system Sultan has ever assembled. Doors open in:"}
          </p>

          {!isPost && !isLive && (
            <div className="mt-5">
              <Countdown target={EVENT_START} />
            </div>
          )}

          {isPost ? (
            <Link
              to="/recap"
              onClick={dismiss}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
            >
              Find your photos & videos <ArrowRight size={16} />
            </Link>
          ) : submitted ? (
            <div className="mt-6 rounded-2xl border border-savanna/40 bg-savanna/10 px-4 py-3 text-sm text-savanna">
              You're on the list. We'll WhatsApp you when doors open.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\+?\d{9,}$/.test(phone.replace(/\s/g, ""))) return;
                setSubmitted(true);
              }}
              className="mt-6 flex gap-2"
            >
              <input
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="flex-1 bg-night-deep/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="rounded-2xl bg-gold px-5 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
              >
                Notify me
              </button>
            </form>
          )}

          <button
            onClick={dismiss}
            className="mt-4 text-xs text-foreground/50 hover:text-foreground/80 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
