import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

type Status = "pending" | "success" | "failed" | "refunded";
const STATUSES: Status[] = ["pending", "success", "failed", "refunded"];
const TONE: Record<Status, string> = {
  pending: "bg-gold/15 text-gold",
  success: "bg-savanna/15 text-savanna",
  failed: "bg-lava/15 text-lava",
  refunded: "bg-foreground/10 text-foreground/60",
};

function AdminPayments() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");

  const load = async () => {
    let q = supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message); else setRows(data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-pay").on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  const update = async (id: string, status: Status) => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Payment ${status}`);
  };

  const totals = rows.filter(r => r.status === "success").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Money</div>
          <h1 className="font-display text-4xl mt-1">Payments</h1>
          <p className="text-sm text-foreground/60 mt-1">Visible total (filtered): <span className="text-gold font-medium">KES {totals.toLocaleString()}</span></p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s as any)}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition ${
                filter === s ? "bg-gold text-night-deep border-gold" : "border-border/50 text-foreground/60 hover:text-foreground"
              }`}>{s}</button>
          ))}
        </div>
      </header>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">M-Pesa receipt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs text-foreground/70 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{r.currency} {Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.mpesa_receipt ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${TONE[r.status as Status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === "pending" && <IconBtn label="Mark success" onClick={() => update(r.id, "success")}><Check size={14} /></IconBtn>}
                      {r.status === "pending" && <IconBtn label="Mark failed" onClick={() => update(r.id, "failed")}><X size={14} /></IconBtn>}
                      {r.status === "success" && <IconBtn label="Refund" onClick={() => update(r.id, "refunded")}><RotateCcw size={14} /></IconBtn>}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-foreground/50 text-sm">No payments yet. Once Daraja STK Push is wired in M3, transactions will land here automatically.</td></tr>}
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
