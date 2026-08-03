import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminHub, canAccessTab, type AdminHubTab } from "@/components/admin/AdminHub";
import { Users, CalendarCheck, Car } from "lucide-react";
import { AdminLeads } from "./admin.leads";
import { AdminReservations } from "./admin.reservations";
import { AdminParking } from "./admin.parking";

export const Route = createFileRoute("/admin/guests")({
  component: GuestsHub,
});

const ALL_TABS: AdminHubTab[] = [
  { id: "leads", label: "Leads", icon: Users, component: AdminLeads },
  {
    id: "reservations",
    label: "Reservations",
    icon: CalendarCheck,
    component: AdminReservations,
    roles: ["waitress"],
  },
  { id: "parking", label: "Parking", icon: Car, component: AdminParking },
];

function GuestsHub() {
  const { roles, isAdmin } = useAuth();
  const tabs = ALL_TABS.filter((t) => canAccessTab(roles, isAdmin, t.adminOnly, t.roles));
  return (
    <AdminHub
      eyebrow="Guests"
      title="Guests"
      description="Leads, reservations and parking management."
      tabs={tabs}
    />
  );
}
