import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role =
  | "admin"
  | "crew"
  | "user"
  | "bartender"
  | "waitress"
  | "shisha_distributor"
  | "content_manager"
  | "security";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  isStaff: boolean;
  isAdmin: boolean;
  isContentManager: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        // defer to avoid recursive auth calls
        setTimeout(() => fetchRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
      // If the persisted session is dropped or can't be refreshed anymore
      // (expired or revoked), clear storage so the user is cleanly signed out
      // instead of being stuck in a loop of 401s that make data look "missing".
      if (event === "SIGNED_OUT") {
        setRoles([]);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.clear();
            window.sessionStorage.clear();
          } catch {
            // storage may be unavailable; session is still cleared in memory
          }
        }
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        // Validate the persisted token against Supabase. If it is stale or
        // revoked (e.g. keys rotated or the session predates a domain change),
        // clear it immediately so the user is cleanly signed out instead of
        // being stuck in a loop of 401s that make data look "missing".
        const { error } = await supabase.auth.getUser(data.session.access_token);
        if (error && (error.status === 401 || error.status === 403)) {
          try {
            await supabase.auth.signOut();
          } catch {
            // signOut may fail on an already-dead token; clear storage below
          }
          if (typeof window !== "undefined") {
            try {
              window.localStorage.clear();
              window.sessionStorage.clear();
            } catch {
              // storage may be unavailable; session is still cleared in memory
            }
          }
          setSession(null);
          setRoles([]);
        } else {
          fetchRoles(data.session.user.id);
        }
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error.status === 401 || error.status === 403)
      ) {
        // Session is stale/revoked — clear it so the user can sign in again
        // instead of being stuck in a loop of 401s that make data look "missing".
        try {
          await supabase.auth.signOut();
        } catch {
          // signOut may fail on an already-dead token; clear storage manually below
        }
        if (typeof window !== "undefined") {
          try {
            window.localStorage.clear();
            window.sessionStorage.clear();
          } catch {
            // storage may be unavailable; session is still cleared in memory
          }
        }
      }
      setRoles([]);
      return;
    }
    setRoles((data ?? []).map((r) => r.role as Role));
  };

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    roles,
    isStaff:
      roles.includes("admin") ||
      roles.includes("crew") ||
      roles.includes("bartender") ||
      roles.includes("waitress") ||
      roles.includes("shisha_distributor") ||
      roles.includes("content_manager") ||
      roles.includes("security"),
    isAdmin: roles.includes("admin"),
    isContentManager: roles.includes("content_manager"),
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      // Ensure a stale/invalid session can never lock the user into 401 loops
      // even if the client failed to clear its persisted session.
      if (typeof window !== "undefined") {
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
        } catch {
          // storage may be unavailable; session is still cleared in memory
        }
      }
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
