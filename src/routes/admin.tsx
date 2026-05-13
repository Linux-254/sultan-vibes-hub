import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, CalendarCheck, CreditCard, MessagesSquare, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Sultan" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/reservations", label: "Reservations", icon: CalendarCheck, exact: false },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, exact: false },
  { to: "/admin/chat", label: "Crew Chat", icon: MessagesSquare, exact: false },
] as const;

function AdminLayout() {
  const { user, isStaff, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isStaff) navigate({ to: "/profile" });
  }, [loading, user, isStaff, navigate]);

  if (loading || !user || !isStaff) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-foreground/60">Loading admin…</div>;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-border/40 bg-night/40 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto">
        <div className="hidden lg:block px-3 py-4">
          <div className="eyebrow">Sultan</div>
          <div className="font-display text-2xl text-gold-gradient">Control Room</div>
        </div>
        {NAV.map((n) => {
          const active = n.exact ? path === n.to : path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition shrink-0 ${
                active ? "bg-gold/15 text-gold" : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <n.icon size={16} /> {n.label}
            </Link>
          );
        })}
        <button onClick={() => signOut()} className="lg:mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/60 hover:text-lava">
          <LogOut size={16} /> Sign out
        </button>
      </aside>
      <main className="p-5 lg:p-10 max-w-6xl w-full">
        <Outlet />
      </main>
    </div>
  );
}
