import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSosNotifications } from "@/hooks/use-sos-notifications";
import { RequireAuth } from "@/components/RequireAuth";
import {
  LayoutDashboard,
  Banknote,
  Users,
  ShoppingBag,
  Shield,
  CalendarClock,
  Siren,
  MessagesSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";

function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="font-display text-3xl text-gold-gradient">Not found</h2>
      <p className="mt-3 text-sm text-muted-foreground max-w-sm">
        This admin page doesn't exist or you don't have access.
      </p>
      <a
        href="/admin"
        className="mt-6 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-night-deep"
      >
        Back to Dashboard
      </a>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Empire" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth staffOnly>
      <AdminLayout />
    </RequireAuth>
  ),
  notFoundComponent: AdminNotFound,
});

type RoleFlag =
  | "admin"
  | "crew"
  | "bartender"
  | "waitress"
  | "shisha_distributor"
  | "content_manager"
  | "security";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  adminOnly?: boolean;
  roles?: RoleFlag[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      {
        to: "/admin/money",
        label: "Money",
        icon: Banknote,
        exact: false,
      },
      {
        to: "/admin/guests",
        label: "Guests",
        icon: Users,
        exact: false,
      },
      {
        to: "/admin/shop",
        label: "Shop",
        icon: ShoppingBag,
        exact: false,
        roles: ["shisha_distributor"],
      },
      {
        to: "/admin/people",
        label: "People & access",
        icon: Shield,
        exact: false,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        to: "/admin/content",
        label: "Content",
        icon: CalendarClock,
        exact: false,
        roles: ["content_manager"],
      },
    ],
  },
  {
    label: "Safety & comms",
    items: [
      { to: "/admin/sos", label: "SOS", icon: Siren, exact: false },
      { to: "/admin/chat", label: "Crew chat", icon: MessagesSquare, exact: false },
    ],
  },
];

function AdminLayout() {
  const { user, isStaff, isAdmin, roles, loading, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { count } = useSosNotifications(user?.id);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  if (loading || !user || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-foreground/60">
        Loading admin…
      </div>
    );
  }

  const isSosPage = path === "/admin/sos";

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((n) => {
      if (n.adminOnly && !isAdmin) return false;
      if (isAdmin || roles.includes("crew")) return true;
      if (!n.roles) return true;
      return n.roles.some((r) => roles.includes(r));
    }),
  })).filter((g) => g.items.length > 0);

  const navLinks = (
    <>
      {groups.map((g) => (
        <div key={g.label} className="space-y-1">
          <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-mono">
            {g.label}
          </div>
          {g.items.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            const badge = n.to === "/admin/sos" && count > 0 ? count : 0;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded-xl text-sm transition ${
                  active
                    ? "bg-gold/15 text-gold"
                    : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <n.icon size={16} /> {n.label}
                {badge > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-lava text-white text-[10px] font-semibold">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-16 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-night/80 backdrop-blur">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="h-10 w-10 grid place-items-center rounded-xl border border-border/50"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <div className="eyebrow">Empire</div>
          <div className="font-display text-lg text-gold-gradient truncate">Control Room</div>
        </div>
        <button
          onClick={() => signOut()}
          aria-label="Sign out"
          className="h-10 w-10 grid place-items-center rounded-xl border border-border/50 text-foreground/60 hover:text-lava"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-night border-r border-border/40 p-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <div>
                <div className="eyebrow">Empire</div>
                <div className="font-display text-xl text-gold-gradient">Control Room</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="h-9 w-9 grid place-items-center rounded-lg border border-border/50"
              >
                <X size={16} />
              </button>
            </div>
            {navLinks}
            <button
              onClick={() => signOut()}
              className="mt-auto flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-foreground/60 hover:text-lava"
            >
              <LogOut size={16} /> Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex border-r border-border/40 bg-night/40 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] p-4 flex-col overflow-y-auto">
        <div className="px-3 py-4">
          <div className="eyebrow">Empire</div>
          <div className="font-display text-2xl text-gold-gradient">Control Room</div>
        </div>
        {navLinks}
        <button
          onClick={() => signOut()}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/60 hover:text-lava"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <main className="p-4 sm:p-6 lg:p-10 max-w-6xl w-full pb-28 lg:pb-10">
        {count > 0 && !isSosPage && (
          <Link
            to="/admin/sos"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-lava/50 bg-lava/10 px-4 py-3 text-sm text-lava animate-pulse-slow"
          >
            <Siren size={16} />
            <span className="flex-1">
              <span className="font-semibold">
                {count} unread SOS alert{count > 1 ? "s" : ""}
              </span>
              <span className="ml-2 text-foreground/70">Review and respond</span>
            </span>
          </Link>
        )}
        <Outlet />
      </main>
    </div>
  );
}
