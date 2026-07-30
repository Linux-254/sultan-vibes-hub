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
      <div className="bg-night/80 backdrop-blur-2xl border-t border-gold/10">
        <div className="flex items-center justify-around pb-1 pt-0.5">
          {BOTTOM_NAV.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative flex flex-col items-center gap-0 px-3 py-1.5 text-[10px] font-medium transition-all duration-150 active:scale-90 ${
                  active ? "text-gold" : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
                <n.icon size={20} className={active ? "drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]" : ""} />
                <span className="mt-0.5">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
