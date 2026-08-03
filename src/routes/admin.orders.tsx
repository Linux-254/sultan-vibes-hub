import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Package, Search, ChevronDown, ChevronUp, Printer, Ticket } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "Orders — Empire Admin" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/money" });
  },
});

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  order_type: string;
  status: string;
  total: number;
  ticket_number: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  delivery_time_preference: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
};

type StatusFilter = "all" | "pending" | "confirmed" | "delivered" | "cancelled";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-gold/15 text-gold",
  confirmed: "bg-savanna/15 text-savanna",
  delivered: "bg-savanna/30 text-savanna",
  cancelled: "bg-lava/15 text-lava",
};

const STATUS_LABELS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export function AdminOrders() {
  const { isStaff } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ticketOrder, setTicketOrder] = useState<OrderRow | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    if (search.trim()) q = q.ilike("ticket_number", `%${search.trim()}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [filter, search]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order marked ${status}`);
      load();
    }
  };

  const getNextStatus = (current: string): { label: string; value: string } | null => {
    switch (current) {
      case "pending":
        return { label: "Confirm", value: "confirmed" };
      case "confirmed":
        return { label: "Deliver", value: "delivered" };
      default:
        return null;
    }
  };

  const printTicket = () => {
    window.print();
  };

  if (!isStaff) {
    return (
      <div className="p-10 text-center text-foreground/50 text-sm">
        You don't have access to this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Commerce</div>
          <h1 className="font-display text-4xl mt-1">
            <span className="text-gold-gradient">Orders</span> Management
          </h1>
          <p className="text-sm text-foreground/60 mt-1">{orders.length} orders loaded</p>
        </div>
      </header>

      <div className="glass rounded-3xl p-5 kente-border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              type="text"
              placeholder="Search by ticket number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-night/60 border border-border/60 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STATUS_LABELS.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition ${
              filter === s.key
                ? "bg-gold text-night-deep border-gold"
                : "border-border/50 text-foreground/60 hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-sm text-foreground/50">Loading orders...</div>
      )}

      {!loading && (
        <div className="glass rounded-3xl p-5 kente-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const expanded = expandedId === o.id;
                  const next = getNextStatus(o.status);
                  return (
                    <OrderRowComponent
                      key={o.id}
                      order={o}
                      expanded={expanded}
                      onToggle={() => setExpandedId(expanded ? null : o.id)}
                      onNextStatus={next ? () => updateStatus(o.id, next.value) : undefined}
                      nextLabel={next?.label}
                      onCancel={() => updateStatus(o.id, "cancelled")}
                      onViewTicket={() => setTicketOrder(o)}
                    />
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-foreground/50 text-sm">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ticketOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-deep/80 backdrop-blur-sm p-4"
          onClick={() => setTicketOrder(null)}
        >
          <div
            className="bg-night border-2 border-dashed border-gold/60 rounded-3xl p-8 max-w-sm w-full print:border-0 print:bg-white print:text-black print:max-w-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="font-display text-3xl tracking-wider text-gold print:text-black">
                EMPIRE
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-foreground/50 mt-1 print:text-gray-500">
                Order Receipt
              </div>
            </div>

            <div className="border-t border-dashed border-border/50 print:border-gray-300 pt-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60 print:text-gray-600">Ticket</span>
                <span className="font-mono font-bold text-gold print:text-black">
                  {ticketOrder.ticket_number ?? ticketOrder.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-foreground/60 print:text-gray-600">Date</span>
                <span className="print:text-black">
                  {new Date(ticketOrder.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-border/50 print:border-gray-300 pt-4 mb-4">
              <div className="text-xs uppercase tracking-wider text-foreground/50 mb-3 print:text-gray-500">
                Items
              </div>
              {ticketOrder.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="print:text-black">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono print:text-black">
                    KES {(item.unit_price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-border/50 print:border-gray-300 pt-4 mb-6">
              <div className="flex justify-between text-lg font-display">
                <span className="print:text-black">Total</span>
                <span className="text-gold font-bold print:text-black">
                  KES {Number(ticketOrder.total).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-foreground/60 print:text-gray-600">Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${STATUS_TONE[ticketOrder.status] ?? "bg-foreground/10 text-foreground/60"}`}
                >
                  {ticketOrder.status}
                </span>
              </div>
            </div>

            <div className="text-center text-xs text-foreground/40 print:text-gray-400">
              Thank you for your order!
            </div>

            <button
              onClick={printTicket}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition print:hidden"
            >
              <Printer size={16} /> Print Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRowComponent({
  order,
  expanded,
  onToggle,
  onNextStatus,
  nextLabel,
  onCancel,
  onViewTicket,
}: {
  order: OrderRow;
  expanded: boolean;
  onToggle: () => void;
  onNextStatus?: () => void;
  nextLabel?: string;
  onCancel: () => void;
  onViewTicket: () => void;
}) {
  return (
    <>
      <tr className="border-t border-border/30 hover:bg-white/[0.02]">
        <td className="px-4 py-3">
          <button
            onClick={onViewTicket}
            className="font-mono text-xs text-gold hover:underline inline-flex items-center gap-1"
          >
            <Ticket size={12} /> {order.ticket_number ?? order.id.slice(0, 8)}
          </button>
        </td>
        <td className="px-4 py-3 text-xs text-foreground/70 whitespace-nowrap">
          {new Date(order.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <div className="text-sm">{order.delivery_name || "—"}</div>
          {order.delivery_phone && (
            <div className="text-xs text-foreground/50">{order.delivery_phone}</div>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-foreground/70">
          {order.order_items.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "—"}
        </td>
        <td className="px-4 py-3">
          <span
            className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${STATUS_TONE[order.status] ?? "bg-foreground/10 text-foreground/60"}`}
          >
            {order.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right font-mono text-gold">
          KES {Number(order.total).toLocaleString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1.5">
            {onNextStatus && (
              <button
                onClick={onNextStatus}
                title={nextLabel}
                className="h-8 px-3 inline-flex items-center gap-1 rounded-lg bg-gold/15 text-gold text-xs font-medium hover:bg-gold/25 transition"
              >
                {nextLabel}
              </button>
            )}
            {order.status !== "cancelled" && (
              <button
                onClick={onCancel}
                title="Cancel order"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-lava hover:text-lava transition"
              >
                ✕
              </button>
            )}
            <button
              onClick={onToggle}
              title={expanded ? "Collapse" : "Expand"}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 hover:border-gold hover:text-gold transition"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-white/[0.01]">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="glass rounded-2xl p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">
                  Delivery Details
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Name</span>
                  <span>{order.delivery_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Phone</span>
                  <span>{order.delivery_phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Address</span>
                  <span className="text-right max-w-[200px]">{order.delivery_address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Time Preference</span>
                  <span>{order.delivery_time_preference || "—"}</span>
                </div>
                {order.delivery_notes && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <span className="text-foreground/60">Notes:</span>
                    <p className="text-foreground/80 mt-1">{order.delivery_notes}</p>
                  </div>
                )}
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wider text-foreground/50 mb-2">
                  Order Items
                </div>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-foreground/50 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-mono text-gold">
                        KES {(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex justify-between font-display">
                  <span>Total</span>
                  <span className="text-gold font-bold">
                    KES {Number(order.total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
