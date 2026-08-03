import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserCog,
  GlassWater,
  BellRing,
  Cigarette,
  Camera,
  Siren,
} from "lucide-react";
import { listUsersWithRoles, grantRole, revokeRole } from "@/lib/admin-users.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/roles")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/people" });
  },
});

type Row = Awaited<ReturnType<typeof listUsersWithRoles>>[number];
type Role =
  | "admin"
  | "crew"
  | "bartender"
  | "waitress"
  | "shisha_distributor"
  | "content_manager"
  | "security";

const AREAS: { role: Role; label: string; desc: string; icon: React.ElementType }[] = [
  {
    role: "admin",
    label: "Admin",
    desc: "Full control — roles, payments, all dashboards",
    icon: ShieldCheck,
  },
  {
    role: "crew",
    label: "Crew",
    desc: "Reservations, SOS, crew chat, payments view",
    icon: Shield,
  },
  {
    role: "bartender",
    label: "Bartender",
    desc: "Order fulfilment, drink prep queue",
    icon: GlassWater,
  },
  {
    role: "waitress",
    label: "Waitress",
    desc: "Table service, reservations, orders",
    icon: BellRing,
  },
  {
    role: "shisha_distributor",
    label: "Shisha Dist.",
    desc: "Shisha prep, flavour inventory",
    icon: Cigarette,
  },
  {
    role: "content_manager",
    label: "Content Mgr",
    desc: "Recap media, slideshow, analytics",
    icon: Camera,
  },
  {
    role: "security",
    label: "Security",
    desc: "SOS response, surveillance, floor safety",
    icon: Siren,
  },
];

export function RolesPage() {
  const { user } = useAuth();
  const list = useServerFn(listUsersWithRoles);
  const grant = useServerFn(grantRole);
  const revoke = useServerFn(revokeRole);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (q = "") => {
    setLoading(true);
    try {
      const data = await list({ data: { search: q } });
      setRows(data);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = async (row: Row, role: Role, has: boolean) => {
    setBusy(`${row.id}:${role}`);
    try {
      if (has) await revoke({ data: { userId: row.id, role } });
      else await grant({ data: { userId: row.id, role } });
      toast.success(`${has ? "Revoked" : "Granted"} ${role}`);
      await load(search);
    } catch (e: any) {
      toast.error(e.message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">Access control</div>
        <h1 className="font-display text-3xl sm:text-4xl mt-1">Roles & Permissions</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Grant or revoke dashboard access per user. Admins see everything; Crew handle floor
          operations.
        </p>
      </header>

      <div className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-2">
        <Search size={16} className="text-foreground/50 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="bg-transparent outline-none text-sm w-full min-w-0"
        />
      </div>

      <div className="hidden md:block glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-foreground/50 bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Contact</th>
              {AREAS.map((a) => (
                <th key={a.role} className="px-4 py-3 text-center">
                  {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/30 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.display_name ?? "—"}</div>
                  <div className="text-[10px] text-foreground/50 font-mono">
                    {r.id.slice(0, 8)}…
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <div>{r.email ?? "—"}</div>
                  <div className="text-xs text-foreground/50">{r.phone ?? ""}</div>
                </td>
                {AREAS.map((a) => {
                  const has = r.roles.includes(a.role);
                  const isSelfAdmin = a.role === "admin" && r.id === user?.id;
                  return (
                    <td key={a.role} className="px-4 py-3 text-center">
                      <button
                        disabled={busy === `${r.id}:${a.role}` || isSelfAdmin}
                        onClick={() => toggle(r, a.role, has)}
                        title={
                          isSelfAdmin
                            ? "Can't revoke your own admin"
                            : has
                              ? `Revoke ${a.label}`
                              : `Grant ${a.label}`
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition ${
                          has
                            ? "bg-gold text-night-deep border-gold"
                            : "border-border/50 text-foreground/60 hover:text-foreground hover:border-foreground/40"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {has ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                        {has ? "Granted" : "Grant"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={2 + AREAS.length}
                  className="px-4 py-12 text-center text-foreground/50"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gold/15 text-gold grid place-items-center">
                <UserCog size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.display_name ?? r.email ?? "Unnamed"}</div>
                <div className="text-xs text-foreground/60 truncate">
                  {r.email ?? r.phone ?? "—"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((a) => {
                const has = r.roles.includes(a.role);
                const isSelfAdmin = a.role === "admin" && r.id === user?.id;
                return (
                  <button
                    key={a.role}
                    disabled={busy === `${r.id}:${a.role}` || isSelfAdmin}
                    onClick={() => toggle(r, a.role, has)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition ${
                      has
                        ? "bg-gold/15 border-gold text-gold"
                        : "border-border/50 text-foreground/70"
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <a.icon size={12} /> {a.label}
                    </div>
                    <div className="text-[10px] text-foreground/60 leading-tight">
                      {has ? "Access granted — tap to revoke" : "Tap to grant"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-foreground/50">
            No users found.
          </div>
        )}
      </div>

      {loading && <div className="text-center text-sm text-foreground/50 py-6">Loading users…</div>}
    </div>
  );
}
