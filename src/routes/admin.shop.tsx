import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminHub, canAccessTab, type AdminHubTab } from "@/components/admin/AdminHub";
import { ShoppingBag } from "lucide-react";
import { AdminInventory } from "./admin.inventory";

export const Route = createFileRoute("/admin/shop")({
  component: ShopHub,
});

const ALL_TABS: AdminHubTab[] = [
  {
    id: "products",
    label: "Products",
    icon: ShoppingBag,
    component: AdminInventory,
    roles: ["shisha_distributor"],
  },
];

function ShopHub() {
  const { roles, isAdmin } = useAuth();
  const tabs = ALL_TABS.filter((t) => canAccessTab(roles, isAdmin, t.adminOnly, t.roles));
  return (
    <AdminHub
      eyebrow="Shop"
      title="Shop & inventory"
      description="Manage menu products, stock levels and pricing."
      tabs={tabs}
    />
  );
}
