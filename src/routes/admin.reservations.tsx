import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, UtensilsCrossed, Ban } from "lucide-react";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservations,
});

type Status = "pending" | "approved" | "seated" | "cancelled" | "no_show";
const STATUSES: Status[] = ["pending", "approved", "seated", "cancelled", "no_show"];
const TONE: Record<Status, string> = {
  pending: "bg-gold/15 text-gold",
  approved: "bg-savanna/15 text-savanna",
  seated: "bg-blue-500/15 text-blue-400",
  cancelled: "bg-lava/15 text-lava",
  no_show: "bg-foreground/10 text-foreground/60",
};

function AdminReservations() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<Status | "all">("pending");

  const load = async () => {
    let q = supabase.from("reservations").select("*").order("reservation_date", { ascending: true }).order("reservation_time", { ascending: true }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message); else setRows(data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-res").on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  const update = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "approved") { patch.approved_at = new Date().toISOString(); }
    const { error } = await supabase.from("reservations").update(patch).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Marked ${status}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Bookings</div>
          <h1 className="font-display text-4xl mt-1">Reservations</h1>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s as any)}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition ${
                filter === s ? "bg-gold text-night-deep border-gold" : "border-border/50 text-foreground/60 hover:text-foreground"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{r.reservation_date}</div>
                    <div className="text-xs text-foreground/60">{r.reservation_time?.slice(0,5)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-foreground/60">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3">{r.party_size}</td>
                  <td className="px-4 py-3 max-w-[260px] text-foreground/70 text-xs">
                    {r.table_preference && <div>📍 {r.table_preference}</div>}
                    {r.special_requests && <div className="truncate" title={r.special_requests}>📝 {r.special_requests}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${TONE[r.status as Status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === "pending" && (
                        <IconBtn label="Approve" onClick={() => update(r.id, "approved")}><Check size={14} /></IconBtn>
                      )}
                      {(r.status === "pending" || r.status === "approved") && (
                        <IconBtn label="Cancel" onClick={() => update(r.id, "cancelled")}><X size={14} /></IconBtn>
                      )}
                      {r.status === "approved" && (
                        <IconBtn label="Seat" onClick={() => update(r.id, "seated")}><UtensilsCrossed size={14} /></IconBtn>
                      )}
                      {r.status === "approved" && (
                        <IconBtn label="No-show" onClick={() => update(r.id, "no_show")}><Ban size={14} /></IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-foreground/50 text-sm">No reservations.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition">
      {children}
    </button>
  );
}
