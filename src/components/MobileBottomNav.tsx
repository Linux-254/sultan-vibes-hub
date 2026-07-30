import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, ShoppingBag, PhoneCall, Siren, User } from "lucide-react";

const BOTTOM_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/products", label: "Shop", icon: ShoppingBag },
  { to: "/reserve", label: "Reserve", icon: PhoneCall },
  { to: "/sos", label: "SOS", icon: Siren },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (path.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 block lg:hidden safe-area-bottom">
      <div className="glass border-t border-border/40 backdrop-blur-lg">
        <div className="flex items-center justify-around py-1.5">
          {BOTTOM_NAV.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-medium transition ${
                  active ? "text-gold" : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
