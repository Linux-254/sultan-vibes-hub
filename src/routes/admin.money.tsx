import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminHub, canAccessTab, type AdminHubTab } from "@/components/admin/AdminHub";
import { BarChart3, CreditCard, Package, DollarSign } from "lucide-react";
import { AdminSales } from "./admin.sales";
import { AdminPayments } from "./admin.payments";
import { AdminOrders } from "./admin.orders";
import { AdminPricing } from "./admin.pricing";

export const Route = createFileRoute("/admin/money")({
  component: MoneyHub,
});

const ALL_TABS: AdminHubTab[] = [
  {
    id: "sales",
    label: "Sales",
    icon: BarChart3,
    component: AdminSales,
    roles: ["content_manager"],
  },
  { id: "payments", label: "Payments", icon: CreditCard, component: AdminPayments },
  {
    id: "orders",
    label: "Orders",
    icon: Package,
    component: AdminOrders,
    roles: ["bartender", "waitress", "shisha_distributor"],
  },
  { id: "pricing", label: "Pricing", icon: DollarSign, component: AdminPricing },
];

function MoneyHub() {
  const { roles, isAdmin } = useAuth();
  const tabs = ALL_TABS.filter((t) => canAccessTab(roles, isAdmin, t.adminOnly, t.roles));
  return (
    <AdminHub
      eyebrow="Operations"
      title="Money"
      description="Sales, payments, orders and menu pricing."
      tabs={tabs}
    />
  );
}
