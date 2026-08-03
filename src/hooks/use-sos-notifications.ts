import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SosNotification {
  id: string;
  incident_id: string;
  responder_id: string;
  read: boolean;
  created_at: string;
}

/**
 * Realtime-unread SOS notifications for the current responder (security + admin).
 * Subscribes to new sos_notifications rows targeting this user and keeps a
 * live unread count + the newest unread incident id.
 */
export function useSosNotifications(userId: string | null | undefined) {
  const [unread, setUnread] = useState<SosNotification[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const loadInitial = async () => {
      const { data } = await supabase
        .from("sos_notifications")
        .select("id,incident_id,responder_id,read,created_at")
        .eq("responder_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (mounted && data) setUnread(data as SosNotification[]);
      loaded.current = true;
    };

    loadInitial();

    const channel = supabase
      .channel(`sos-notify-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_notifications",
          filter: `responder_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as SosNotification;
          if (!row.read) setUnread((prev) => [row, ...prev]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAllRead = async () => {
    if (!userId || unread.length === 0) return;
    const ids = unread.map((n) => n.id);
    await supabase.from("sos_notifications").update({ read: true }).in("id", ids);
    setUnread([]);
  };

  return { unread, count: unread.length, markAllRead };
}

/**
 * Creates sos_notifications rows for every security-role user and every admin
 * so the SOS protocol reaches both groups — not just whoever has the admin
 * SOS page open.
 */
export async function notifySosResponders(incidentId: string) {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "security"] as never[]);
  if (!roles) return;
  const ids = [...new Set(roles.map((r) => r.user_id))].filter(Boolean) as string[];
  if (ids.length === 0) return;
  await supabase.from("sos_notifications").insert(
    ids.map((responder_id) => ({
      incident_id: incidentId,
      responder_id,
      read: false,
    })),
  );
}
