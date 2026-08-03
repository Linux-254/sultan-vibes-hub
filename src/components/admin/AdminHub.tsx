import { useState, type ComponentType } from "react";

export type AdminRole =
  | "admin"
  | "crew"
  | "bartender"
  | "waitress"
  | "shisha_distributor"
  | "content_manager"
  | "security";

export function canAccessTab(
  roles: readonly string[],
  isAdmin: boolean,
  adminOnly?: boolean,
  need?: AdminRole[],
) {
  if (adminOnly) return isAdmin;
  if (isAdmin || roles.includes("crew")) return true;
  if (!need || need.length === 0) return true;
  return need.some((r) => roles.includes(r));
}

export interface AdminHubTab {
  id: string;
  label: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  component: ComponentType;
  adminOnly?: boolean;
  roles?: AdminRole[];
}

interface AdminHubProps {
  eyebrow: string;
  title: string;
  description?: string;
  tabs: AdminHubTab[];
  defaultTab?: string;
}

export function AdminHub({ eyebrow, title, description, tabs, defaultTab }: AdminHubProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];
  const Active = activeTab?.component ?? (() => null);

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="font-display text-4xl mt-1">{title}</h1>
        {description && <p className="text-sm text-foreground/60 mt-1">{description}</p>}
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = t.id === activeTab?.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${
                isActive
                  ? "bg-gold text-night-deep"
                  : "bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {Icon && <Icon size={14} />}
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={activeTab?.id} className="space-y-6">
        <Active />
      </div>
    </div>
  );
}
