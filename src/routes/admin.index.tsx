import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CalendarCheck,
  CreditCard,
  Clock,
  CircleCheck,
  Package,
  Users,
  Siren,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Bell,
  ChevronRight,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

type Notification = {
  id: string;
  type: "order" | "reservation" | "payment" | "sos" | "lead";
  title: string;
  detail: string;
  created_at: string;
  read: boolean;
};

interface Stats {
  pendingRes: number;
  approvedToday: number;
  pendingPayments: number;
  revenueToday: number;
  pendingOrders: number;
  totalOrdersToday: number;
  openLeads: number;
  activeSos: number;
  totalProducts: number;
  lowStock: number;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    pendingRes: 0,
    approvedToday: 0,
    pendingPayments: 0,
    revenueToday: 0,
    pendingOrders: 0,
    totalOrdersToday: 0,
    openLeads: 0,
    activeSos: 0,
    totalProducts: 0,
    lowStock: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [recentRes, setRecentRes] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [
      pendingRes,
      todayRes,
      payToday,
      payPending,
      pendOrders,
      ordersToday,
      openLeads,
      activeSos,
      products,
      recentR,
      recentO,
      notifRes,
    ] = await Promise.all([
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("reservation_date", today),
      supabase.from("payments").select("amount").eq("status", "success").gte("created_at", today),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "contacted"]),
      supabase
        .from("sos_incidents")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "acknowledged"]),
      supabase.from("products").select("id, stock").eq("active", true),
      supabase
        .from("reservations")
        .select("id, full_name, party_size, reservation_date, reservation_time, status")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("id, ticket_number, order_type, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("id, ticket_number, total, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const revenue = (payToday.data ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const lowStockCount = (products.data ?? []).filter((p: any) => p.stock <= 5).length;

    setStats({
      pendingRes: pendingRes.count ?? 0,
      approvedToday: todayRes.count ?? 0,
      pendingPayments: payPending.count ?? 0,
      revenueToday: revenue,
      pendingOrders: pendOrders.count ?? 0,
      totalOrdersToday: ordersToday.count ?? 0,
      openLeads: openLeads.count ?? 0,
      activeSos: activeSos.count ?? 0,
      totalProducts: (products.data ?? []).length,
      lowStock: lowStockCount,
    });

    setRecentRes(recentR.data ?? []);
    setRecentOrders(recentO.data ?? []);

    const notifs: Notification[] = [];
    for (const o of notifRes.data ?? []) {
      notifs.push({
        id: o.id,
        type: "order",
        title: `New order ${o.ticket_number ?? ""}`,
        detail: `KES ${Number(o.total).toLocaleString()}`,
        created_at: o.created_at,
        read: false,
      });
    }
    const { data: resNotifs } = await supabase
      .from("reservations")
      .select("id, full_name, party_size, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    for (const r of resNotifs ?? []) {
      notifs.push({
        id: r.id,
        type: "reservation",
        title: `Reservation — ${r.full_name}`,
        detail: `${r.party_size} guests`,
        created_at: r.created_at,
        read: false,
      });
    }
    const { data: sosNotifs } = await supabase
      .from("sos_incidents")
      .select("id, level, note, created_at")
      .in("status", ["open"])
      .order("created_at", { ascending: false })
      .limit(3);
    for (const s of sosNotifs ?? []) {
      notifs.push({
        id: s.id,
        type: "sos",
        title: `SOS — ${s.level}`,
        detail: s.note ?? "No details",
        created_at: s.created_at,
        read: false,
      });
    }
    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(notifs);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-dash-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_incidents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sections = document.querySelectorAll(".dash-section");
    sections.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
        },
      );
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const alertCards = [
    stats.activeSos > 0 && {
      icon: <Siren size={18} />,
      label: "Active SOS",
      value: stats.activeSos,
      accent: "lava",
      to: "/admin/sos",
    },
    stats.pendingRes > 0 && {
      icon: <CalendarCheck size={18} />,
      label: "Pending Reservations",
      value: stats.pendingRes,
      accent: "gold",
      to: "/admin/reservations",
    },
    stats.pendingOrders > 0 && {
      icon: <Package size={18} />,
      label: "Pending Orders",
      value: stats.pendingOrders,
      accent: "gold",
      to: "/admin/orders",
    },
    stats.pendingPayments > 0 && {
      icon: <CreditCard size={18} />,
      label: "Pending Payments",
      value: stats.pendingPayments,
      accent: "lava",
      to: "/admin/payments",
    },
    stats.openLeads > 0 && {
      icon: <Users size={18} />,
      label: "Open Leads",
      value: stats.openLeads,
      accent: "savanna",
      to: "/admin/leads",
    },
    stats.lowStock > 0 && {
      icon: <AlertTriangle size={18} />,
      label: "Low Stock",
      value: stats.lowStock,
      accent: "lava",
      to: "/admin/inventory",
    },
  ].filter(Boolean) as {
    icon: React.ReactNode;
    label: string;
    value: number;
    accent: string;
    to: string;
  }[];

  return (
    <div className="space-y-8">
      {/* Header + Notification bell */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Live</div>
          <h1 className="font-display text-3xl sm:text-4xl mt-1">
            Tonight at <span className="text-gold-gradient">Empire</span>
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Real-time overview — updates as bookings and orders come in.
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifs((s) => !s)}
            className="relative h-10 w-10 rounded-xl border border-border/50 flex items-center justify-center hover:border-gold transition"
          >
            <Bell size={18} className="text-foreground/60" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-lava text-[10px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 z-50 w-80 glass rounded-2xl border border-border/40 shadow-[var(--shadow-elevated)] overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                <span className="text-sm font-display">Notifications</span>
                <span className="text-[10px] text-foreground/40">{unread} new</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-foreground/40">
                    No notifications
                  </div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 border-b border-border/20 hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          n.type === "sos"
                            ? "bg-lava"
                            : n.type === "order"
                              ? "bg-gold"
                              : n.type === "reservation"
                                ? "bg-savanna"
                                : "bg-foreground/40"
                        }`}
                      />
                      <div className="text-sm font-medium truncate">{n.title}</div>
                    </div>
                    <div className="text-xs text-foreground/50 mt-0.5 ml-4">{n.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Action alerts */}
      {alertCards.length > 0 && (
        <div className="space-y-2 dash-section">
          <div className="eyebrow">Requires attention</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertCards.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className={`glass rounded-2xl p-4 flex items-center gap-4 border transition-all duration-200 group ${
                  c.accent === "lava"
                    ? "border-lava/20 hover:border-lava/60 hover:shadow-[0_0_24px_-6px_oklch(0.62_0.21_38)]"
                    : c.accent === "savanna"
                      ? "border-savanna/20 hover:border-savanna/60 hover:shadow-[0_0_24px_-6px_oklch(0.62_0.16_52)]"
                      : "border-gold/20 hover:border-gold/60 hover:shadow-[0_0_24px_-6px_oklch(0.62_0.16_52)]"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition group-hover:scale-110 ${
                    c.accent === "lava"
                      ? "bg-lava/20 text-lava"
                      : c.accent === "savanna"
                        ? "bg-savanna/20 text-savanna"
                        : "bg-gold/20 text-gold"
                  }`}
                >
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground/50">{c.label}</div>
                  <div className="font-display text-2xl mt-0.5">{c.value}</div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-foreground/30 group-hover:text-gold transition shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 dash-section">
        <Stat
          icon={<CalendarCheck />}
          label="Approved today"
          value={stats.approvedToday}
          accent="savanna"
        />
        <Stat
          icon={<CreditCard />}
          label="Revenue today"
          value={`KES ${stats.revenueToday.toLocaleString()}`}
          accent="gold"
        />
        <Stat
          icon={<ShoppingCart />}
          label="Orders today"
          value={stats.totalOrdersToday}
          accent="gold"
        />
        <Stat
          icon={<TrendingUp />}
          label="Total products"
          value={stats.totalProducts}
          accent="savanna"
        />
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6 dash-section">
        {/* Recent reservations */}
        <div className="glass rounded-3xl overflow-hidden border border-border/30">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-white/[0.02]">
            <span className="font-display text-sm flex items-center gap-2">
              <CalendarCheck size={14} className="text-gold" /> Recent Reservations
            </span>
            <Link to="/admin/reservations" className="text-[10px] text-gold hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border/20">
            {recentRes.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-foreground/40">
                No reservations yet
              </div>
            )}
            {recentRes.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition">
                <div className="h-8 w-8 rounded-full bg-gold/10 text-gold text-xs font-bold flex items-center justify-center shrink-0">
                  {(r.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.full_name}</div>
                  <div className="text-xs text-foreground/50">
                    {r.party_size} guests · {r.reservation_date} · {r.reservation_time}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium ${
                    r.status === "pending"
                      ? "bg-gold/15 text-gold"
                      : r.status === "approved"
                        ? "bg-savanna/15 text-savanna"
                        : "bg-foreground/10 text-foreground/50"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="glass rounded-3xl overflow-hidden border border-border/30">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-white/[0.02]">
            <span className="font-display text-sm flex items-center gap-2">
              <Package size={14} className="text-gold" /> Recent Orders
            </span>
            <Link to="/admin/orders" className="text-[10px] text-gold hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border/20">
            {recentOrders.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-foreground/40">No orders yet</div>
            )}
            {recentOrders.map((o: any) => (
              <div key={o.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition">
                <div className="h-8 w-8 rounded-full bg-gold/10 text-gold text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  #{(o.ticket_number ?? "0").slice(-3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate font-mono">{o.ticket_number ?? "—"}</div>
                  <div className="text-xs text-foreground/50">
                    {o.order_type} · KES {Number(o.total).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium ${
                    o.status === "pending"
                      ? "bg-gold/15 text-gold"
                      : o.status === "confirmed"
                        ? "bg-savanna/15 text-savanna"
                        : "bg-foreground/10 text-foreground/50"
                  }`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="glass rounded-3xl p-5 sm:p-6 dash-section">
        <div className="eyebrow mb-4">Quick access</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { to: "/admin/sales", label: "Sales Dashboard", icon: <TrendingUp size={18} />, accent: "gold" },
            { to: "/admin/orders", label: "Orders", icon: <Package size={18} />, accent: "gold" },
            { to: "/admin/reservations", label: "Reservations", icon: <CalendarCheck size={18} />, accent: "savanna" },
            { to: "/admin/payments", label: "Payments", icon: <CreditCard size={18} />, accent: "gold" },
            { to: "/admin/inventory", label: "Products", icon: <ShoppingCart size={18} />, accent: "savanna" },
            { to: "/admin/events", label: "Events", icon: <Clock size={18} />, accent: "gold" },
            { to: "/admin/sos", label: "SOS Alerts", icon: <Siren size={18} />, accent: "lava" },
            { to: "/admin/leads", label: "Leads", icon: <Users size={18} />, accent: "gold" },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="glass rounded-2xl p-4 flex flex-col items-start gap-2 border border-border/40 hover:border-gold/40 hover:bg-gold/[0.03] transition-all duration-200 group"
            >
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                q.accent === "lava" ? "bg-lava/15 text-lava" : q.accent === "savanna" ? "bg-savanna/15 text-savanna" : "bg-gold/15 text-gold"
              }`}>
                {q.icon}
              </div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-gold transition-colors">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: string;
}) {
  const accentStyles: Record<string, string> = {
    savanna: "from-savanna/20 to-transparent text-savanna border-l-savanna/40",
    gold: "from-gold/20 to-transparent text-gold border-l-gold/40",
  };
  return (
    <div
      className={`glass rounded-2xl p-4 sm:p-5 border-l-4 bg-gradient-to-br ${accentStyles[accent] ?? accentStyles.gold}`}
    >
      <div className={`${accent === "savanna" ? "text-savanna" : "text-gold"}`}>{icon}</div>
      <div className="mt-2 text-2xl sm:text-3xl font-display">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-foreground/50 mt-1">{label}</div>
    </div>
  );
}
