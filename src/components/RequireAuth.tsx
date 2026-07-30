import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  /** If true, only staff (admin/crew) can access. Redirects non-staff to /profile. */
  staffOnly?: boolean;
}

export function RequireAuth({ children, staffOnly = false }: RequireAuthProps) {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
    } else if (staffOnly && !isStaff) {
      navigate({ to: "/profile" });
    }
  }, [loading, user, isStaff, staffOnly, navigate]);

  if (loading) {
    return (
      <section className="flex items-center justify-center min-h-[60svh]">
        <Loader2 size={28} className="animate-spin text-gold" />
      </section>
    );
  }

  if (!user) return null;
  if (staffOnly && !isStaff) return null;

  return <>{children}</>;
}
