import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface CalendarPickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  time?: boolean;
  timeValue?: string;
  onTimeChange?: (val: string) => void;
  className?: string;
}

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

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday=0
}
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
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

export function CalendarPicker({
  value,
  onChange,
  label = "Date",
  time = false,
  timeValue = "20:00",
  onTimeChange,
  className = "",
}: CalendarPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(value);

  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const select = (day: number) => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    setSelectedDate(dateStr);
    onChange(dateStr);
    setOpen(false);
  };

  const dateDisplay = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-KE", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <span className="eyebrow">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1.5 w-full flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm text-left focus:outline-none focus:border-gold transition hover:border-gold/40"
      >
        <Calendar size={15} className="text-gold shrink-0" />
        <span className={selectedDate ? "" : "text-foreground/40"}>
          {dateDisplay || "Pick a date..."}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 glass rounded-2xl p-4 kente-border shadow-[var(--shadow-elevated)] w-[280px]">
          {/* Header nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gold/10 transition text-foreground/60 hover:text-gold"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-display text-sm">
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
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gold/10 transition text-foreground/60 hover:text-gold"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] text-foreground/40 font-mono py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isSelected = dateStr === selectedDate;
              const isToday =
                dateStr ===
                `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  className={`h-8 w-full rounded-lg text-xs font-medium transition flex items-center justify-center ${
                    isSelected
                      ? "bg-gold text-night-deep"
                      : isToday
                        ? "bg-gold/20 text-gold"
                        : "text-foreground/70 hover:bg-gold/10 hover:text-gold"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          {time && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <span className="eyebrow">Time</span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {PRESET_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTimeChange?.(t)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                      t === timeValue
                        ? "bg-gold text-night-deep"
                        : "bg-night/60 text-foreground/60 hover:bg-gold/10 hover:text-gold"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="time"
                value={timeValue}
                onChange={(e) => onTimeChange?.(e.target.value)}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gold"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
