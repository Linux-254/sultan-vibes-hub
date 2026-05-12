import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s };
}

export function Countdown({ target }: { target: Date }) {
  const [t, setT] = useState(() => diff(target.getTime()));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target.getTime())), 1000);
    return () => clearInterval(id);
  }, [target]);
  const items = [
    { label: "Days", value: t.d },
    { label: "Hours", value: t.h },
    { label: "Mins", value: t.m },
    { label: "Secs", value: t.s },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-5">
      {items.map((i) => (
        <div key={i.label} className="glass rounded-xl py-4 px-2 text-center kente-border">
          <div className="font-display text-3xl sm:text-5xl text-gold-gradient tabular-nums">
            {String(i.value).padStart(2, "0")}
          </div>
          <div className="eyebrow mt-1 text-[10px]">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
