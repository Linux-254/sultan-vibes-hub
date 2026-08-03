import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/admin/sales")({
  head: () => ({
    meta: [{ title: "Sales Dashboard — Empire" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/money" });
  },
});

type Period = "today" | "week" | "month" | "year" | "custom";

type OrderRow = {
  id: string;
  order_type: string;
  status: string;
  total: number;
  ticket_number: string | null;
  created_at: string;
  updated_at: string;
  order_items: {
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    product_id: string | null;
  }[];
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  tag: string;
  category_id: string | null;
  stock: number;
  active: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  subtitle: string | null;
};

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

function getDateRange(
  period: Period,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const endOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();
  switch (period) {
    case "today": {
      return { from: startOfDay(now), to: endOfDay(now) };
    }
    case "week": {
      const day = now.getDay();
      const monday = new Date(y, m, d - ((day + 6) % 7));
      return { from: startOfDay(monday), to: endOfDay(now) };
    }
    case "month": {
      return { from: startOfDay(new Date(y, m, 1)), to: endOfDay(now) };
    }
    case "year": {
      return { from: startOfDay(new Date(y, 0, 1)), to: endOfDay(now) };
    }
    case "custom": {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : startOfDay(now),
        to: customTo ? new Date(customTo + "T23:59:59").toISOString() : endOfDay(now),
      };
    }
  }
}

export function AdminSales() {
  const { user, isAdmin, isStaff } = useAuth();
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { from, to } = getDateRange(period, customFrom, customTo);
    const [orderRes, prodRes, catRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*"),
      supabase.from("product_categories").select("*"),
    ]);
    if (orderRes.data) setOrders(orderRes.data as OrderRow[]);
    if (prodRes.data) setProducts(prodRes.data as ProductRow[]);
    if (catRes.data) setCategories(catRes.data as CategoryRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [period, customFrom, customTo]);

  if (!isStaff) {
    return (
      <div className="p-10 text-center text-foreground/50 text-sm">
        You don't have access to this page.
      </div>
    );
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const activeProducts = products.filter((p) => p.active && p.stock > 0).length;
  const lowStockItems = products.filter((p) => p.active && p.stock > 0 && p.stock <= 5).length;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const revenueByDay: Record<string, number> = {};
  orders.forEach((o) => {
    const day = o.created_at.slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] || 0) + Number(o.total);
  });
  const sortedDays = Object.keys(revenueByDay).sort();
  const maxDayRevenue = Math.max(...Object.values(revenueByDay), 1);

  const categoryStats: Record<string, { units: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.order_items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      const catName = prod?.category_id
        ? (categoryMap.get(prod.category_id) ?? prod.tag)
        : (prod?.tag ?? "Other");
      if (!categoryStats[catName]) categoryStats[catName] = { units: 0, revenue: 0 };
      categoryStats[catName].units += item.quantity;
      categoryStats[catName].revenue += item.unit_price * item.quantity;
    });
  });
  const categoryEntries = Object.entries(categoryStats).sort((a, b) => b[1].revenue - a[1].revenue);

  const estimatedCosts = totalRevenue * 0.4;
  const netProfit = totalRevenue - estimatedCosts;

  const exportCsv = () => {
    const header = "Date,Ticket #,Items,Status,Total\n";
    const rows = orders
      .map((o) => {
        const date = new Date(o.created_at).toLocaleDateString();
        const ticket = o.ticket_number ?? o.id.slice(0, 8);
        const items = o.order_items.map((i) => `${i.quantity}x ${i.name}`).join("; ");
        return `${date},${ticket},"${items.replace(/"/g, '""')}",${o.status},${Number(o.total)}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Analytics</div>
          <h1 className="font-display text-4xl mt-1">
            <span className="text-gold-gradient">Sales</span> Dashboard
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            {totalOrders} orders &middot; KES {totalRevenue.toLocaleString()} revenue
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
        >
          <Download size={16} /> Export CSV
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition ${
              period === p.key
                ? "bg-gold text-night-deep border-gold"
                : "border-border/50 text-foreground/60 hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="glass rounded-3xl p-5 kente-border flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="eyebrow">From</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </label>
          <label className="block">
            <span className="eyebrow">To</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </label>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-sm text-foreground/50">Loading sales data...</div>
      )}

      {!loading && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              icon={<DollarSign size={20} />}
              label="Total Revenue"
              value={`KES ${totalRevenue.toLocaleString()}`}
              accent="text-gold"
            />
            <MetricCard
              icon={<ShoppingCart size={20} />}
              label="Total Orders"
              value={totalOrders.toLocaleString()}
              accent="text-savanna"
            />
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Avg Order Value"
              value={`KES ${Math.round(avgOrderValue).toLocaleString()}`}
              accent="text-gold"
            />
            <MetricCard
              icon={<Package size={20} />}
              label="Active Products"
              value={activeProducts.toLocaleString()}
              accent="text-savanna"
            />
            <MetricCard
              icon={<AlertTriangle size={20} />}
              label="Low Stock"
              value={lowStockItems.toLocaleString()}
              accent="text-lava"
            />
          </div>

          <div className="glass rounded-3xl p-5 sm:p-7 kente-border">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-gold" />
              <div className="font-display text-xl">Revenue by Day</div>
            </div>
            {sortedDays.length === 0 ? (
              <div className="text-sm text-foreground/50 text-center py-8">
                No orders in this period.
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-48 overflow-x-auto pb-2">
                {sortedDays.map((day) => {
                  const h = Math.max((revenueByDay[day] / maxDayRevenue) * 100, 4);
                  return (
                    <div
                      key={day}
                      className="flex flex-col items-center gap-1.5 min-w-[32px] flex-1"
                    >
                      <span className="text-[10px] text-foreground/50 whitespace-nowrap">
                        KES {revenueByDay[day].toLocaleString()}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-gold/80 hover:bg-gold transition-colors"
                        style={{ height: `${h}%` }}
                        title={`${day}: KES ${revenueByDay[day].toLocaleString()}`}
                      />
                      <span className="text-[10px] text-foreground/40 whitespace-nowrap">
                        {day.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 sm:p-7 kente-border">
              <div className="flex items-center gap-2 mb-5">
                <Package size={18} className="text-gold" />
                <div className="font-display text-xl">Sales by Category</div>
              </div>
              {categoryEntries.length === 0 ? (
                <div className="text-sm text-foreground/50 text-center py-8">No category data.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-foreground/50">
                      <tr>
                        <th className="pb-3">Category</th>
                        <th className="pb-3 text-right">Units</th>
                        <th className="pb-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryEntries.map(([cat, stats]) => (
                        <tr key={cat} className="border-t border-border/30">
                          <td className="py-2.5 font-medium">{cat}</td>
                          <td className="py-2.5 text-right text-foreground/70">{stats.units}</td>
                          <td className="py-2.5 text-right font-mono text-gold">
                            KES {stats.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-5 sm:p-7 kente-border">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={18} className="text-gold" />
                <div className="font-display text-xl">Profit / Loss</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Gross Revenue</span>
                  <span className="font-mono text-lg text-gold">
                    KES {totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Estimated Costs (40%)</span>
                  <span className="font-mono text-lg text-lava">
                    - KES {Math.round(estimatedCosts).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border/40 pt-4 flex justify-between items-center">
                  <span className="font-display text-lg">Net Profit</span>
                  <span
                    className={`font-mono text-2xl font-bold ${netProfit >= 0 ? "text-savanna" : "text-lava"}`}
                  >
                    KES {Math.round(netProfit).toLocaleString()}
                  </span>
                </div>
                <div className="bg-night/40 rounded-2xl p-4 mt-2">
                  <div className="text-xs text-foreground/50 mb-2">Profit Margin</div>
                  <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${netProfit >= 0 ? "bg-savanna" : "bg-lava"}`}
                      style={{
                        width: `${totalRevenue > 0 ? Math.max(Math.min((netProfit / totalRevenue) * 100, 100), 0) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="text-right text-xs text-foreground/50 mt-1">
                    {totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-7 kente-border">
            <div className="flex items-center gap-2 mb-5">
              <Package size={18} className="text-gold" />
              <div className="font-display text-xl">Stock Overview</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) => p.active)
                    .map((p) => {
                      const catName = p.category_id
                        ? (categoryMap.get(p.category_id) ?? p.tag)
                        : p.tag;
                      const status =
                        p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Low Stock" : "In Stock";
                      const statusClass =
                        p.stock === 0
                          ? "bg-lava/15 text-lava"
                          : p.stock <= 5
                            ? "bg-gold/15 text-gold"
                            : "bg-savanna/15 text-savanna";
                      return (
                        <tr key={p.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-foreground/10 text-foreground/60">
                              {catName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{p.stock}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${statusClass}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {products.filter((p) => p.active).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-foreground/50 text-sm">
                        No active products.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-7 kente-border">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingCart size={18} className="text-gold" />
              <div className="font-display text-xl">Recent Orders</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Ticket #</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((o) => (
                    <tr key={o.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-foreground/70 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {o.ticket_number ?? o.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-foreground/70">
                        {o.order_items.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${statusTone(o.status)}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gold">
                        KES {Number(o.total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-foreground/50 text-sm">
                        No orders in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-3xl p-5 kente-border">
      <div className={`${accent}`}>{icon}</div>
      <div className="mt-3 text-2xl font-display">{value}</div>
      <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">{label}</div>
    </div>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case "success":
    case "completed":
      return "bg-savanna/15 text-savanna";
    case "processing":
      return "bg-gold/15 text-gold";
    case "pending":
      return "bg-gold/15 text-gold";
    case "cancelled":
      return "bg-lava/15 text-lava";
    case "refunded":
      return "bg-foreground/10 text-foreground/60";
    default:
      return "bg-foreground/10 text-foreground/60";
  }
}
