import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarCheck, CreditCard, Clock, CircleCheck } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface Stats {
  pending: number;
  approvedToday: number;
  revenueToday: number;
  pendingPayments: number;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedToday: 0, revenueToday: 0, pendingPayments: 0 });

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [pendingRes, todayRes, payRes, payPending] = await Promise.all([
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "approved").eq("reservation_date", today),
      supabase.from("payments").select("amount").eq("status", "success").gte("created_at", today),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const revenue = (payRes.data ?? []).reduce((s, p: any) => s + Number(p.amount), 0);
    setStats({
      pending: pendingRes.count ?? 0,
      approvedToday: todayRes.count ?? 0,
      revenueToday: revenue,
      pendingPayments: payPending.count ?? 0,
    });
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">Live</div>
        <h1 className="font-display text-4xl mt-1">Tonight at <span className="text-gold-gradient">Sultan</span></h1>
        <p className="text-sm text-foreground/60 mt-1">Realtime — updates as bookings and payments come in.</p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Clock />} label="Pending reservations" value={stats.pending} accent="lava" />
        <Stat icon={<CalendarCheck />} label="Approved today" value={stats.approvedToday} accent="savanna" />
        <Stat icon={<CircleCheck />} label="Pending payments" value={stats.pendingPayments} accent="gold" />
        <Stat icon={<CreditCard />} label="Revenue today" value={`KES ${stats.revenueToday.toLocaleString()}`} accent="gold" />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className={`text-${accent}`}>{icon}</div>
      <div className="mt-3 text-3xl font-display">{value}</div>
      <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">{label}</div>
    </div>
  );
}
