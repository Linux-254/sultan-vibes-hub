import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminHub, canAccessTab, type AdminHubTab } from "@/components/admin/AdminHub";
import { CalendarClock, Camera, Flag, FileText, Image } from "lucide-react";
import { AdminEvents } from "./admin.events";
import { AdminRecap } from "./admin.recap";
import { AdminMilestones } from "./admin.milestones";
import { AdminPages } from "./admin.pages";
import { AdminSlideshow } from "./admin.slideshow";

export const Route = createFileRoute("/admin/content")({
  component: ContentHub,
});

const ALL_TABS: AdminHubTab[] = [
  {
    id: "events",
    label: "Events",
    icon: CalendarClock,
    component: AdminEvents,
    roles: ["content_manager"],
  },
  {
    id: "recap",
    label: "Recap",
    icon: Camera,
    component: AdminRecap,
    roles: ["content_manager"],
  },
  {
    id: "milestones",
    label: "Milestones",
    icon: Flag,
    component: AdminMilestones,
    roles: ["content_manager"],
  },
  {
    id: "pages",
    label: "Site Pages",
    icon: FileText,
    component: AdminPages,
    roles: ["content_manager"],
  },
  {
    id: "slideshow",
    label: "Slideshow",
    icon: Image,
    component: AdminSlideshow,
    roles: ["content_manager"],
  },
];

function ContentHub() {
  const { roles, isAdmin } = useAuth();
  const tabs = ALL_TABS.filter((t) => canAccessTab(roles, isAdmin, t.adminOnly, t.roles));
  return (
    <AdminHub
      eyebrow="Content"
      title="Content"
      description="Events, recap galleries, milestones, site pages and the hero slideshow."
      tabs={tabs}
    />
  );
}
