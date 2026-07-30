import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 17).padStart(2, "0")}:00`).concat([
  "05:00",
  "05:30",
]);

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const PRESET_TIMES = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
  "00:00",
];

interface ReserveCalendarProps {
  date: string;
  onDateChange: (d: string) => void;
  time: string;
  onTimeChange: (t: string) => void;
}

export function ReserveCalendar({ date, onDateChange, time, onTimeChange }: ReserveCalendarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const select = (day: number) => {
    const ds = `${year}-${pad(month + 1)}-${pad(day)}`;
    onDateChange(ds);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left rounded-2xl p-4 border transition group hover:border-gold/60"
        style={{
          borderColor: date ? "var(--gold)" : undefined,
          background: date ? "rgba(212,175,55,0.06)" : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Calendar size={20} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono">
              Pick a date
            </div>
            {date ? (
              <div className="mt-0.5 font-display text-lg leading-tight">{fmtDate(date)}</div>
            ) : (
              <div className="mt-0.5 text-foreground/30 text-sm">Tap to open calendar</div>
            )}
          </div>
          {date && (
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono">
                Time
              </div>
              <div className="mt-0.5 font-display text-lg text-gold">{time}</div>
            </div>
          )}
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-3 glass rounded-3xl p-5 kente-border shadow-[var(--shadow-elevated)] w-full max-w-[320px]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gold/10 transition text-foreground/50 hover:text-gold"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-display text-base">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => {
                if (month === 11) {
                  setMonth(0);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
              }}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gold/10 transition text-foreground/50 hover:text-gold"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] text-foreground/35 font-mono py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isSelected = ds === date;
              const isToday = ds === today;
              const isPast = new Date(ds + "T23:59:59") < new Date(today + "T00:00:00");
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !isPast && select(day)}
                  disabled={isPast}
                  className={`h-9 w-full rounded-xl text-xs font-medium transition flex items-center justify-center ${
                    isSelected
                      ? "bg-gold text-night-deep shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                      : isToday
                        ? "bg-gold/20 text-gold ring-1 ring-gold/30"
                        : isPast
                          ? "text-foreground/15 cursor-not-allowed"
                          : "text-foreground/60 hover:bg-gold/10 hover:text-gold"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time presets */}
          <div className="mt-4 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} className="text-gold" />
              <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono">
                Arrival time
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTimeChange(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                    t === time
                      ? "bg-gold text-night-deep"
                      : "bg-night/60 text-foreground/50 hover:bg-gold/10 hover:text-gold"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              name="arrival-time"
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="mt-2.5 w-full bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      )}
    </div>
  );
}
