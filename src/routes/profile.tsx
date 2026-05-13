import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield, Calendar, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Sultan Park & Puff" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isStaff, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.display_name ?? "");
      setPhone(data?.phone ?? "");
    });
    supabase.from("reservations").select("*").eq("user_id", user.id).order("reservation_date", { ascending: false }).then(({ data }) => {
      setReservations(data ?? []);
    });
  }, [user]);

  if (loading || !user) return null;

  const save = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: name, phone }).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  return (
    <section className="mx-auto max-w-3xl px-5 lg:px-8 py-20 space-y-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Your space</div>
          <h1 className="font-display text-4xl mt-2">
            Hello, <span className="text-gold-gradient">{name || user.email?.split("@")[0]}</span>
          </h1>
        </div>
        <button onClick={() => signOut()} className="text-xs text-foreground/60 hover:text-gold flex items-center gap-1.5">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {isStaff && (
        <Link to="/admin" className="block glass rounded-3xl p-6 kente-border hover:bg-gold/5 transition">
          <div className="flex items-center gap-3">
            <Shield className="text-gold" />
            <div>
              <div className="font-display text-xl">Open the admin panel</div>
              <div className="text-sm text-foreground/60">Reservations, payments, crew chat — all in one place.</div>
            </div>
          </div>
        </Link>
      )}

      <div className="glass rounded-3xl p-7 space-y-4">
        <div className="font-display text-xl">Profile</div>
        <label className="block">
          <span className="eyebrow">Display name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
        </label>
        <label className="block">
          <span className="eyebrow">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
        </label>
        <button onClick={save} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night-deep">Save</button>
      </div>

      <div className="glass rounded-3xl p-7">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-xl flex items-center gap-2"><Calendar size={18} className="text-gold" /> Your reservations</div>
        </div>
        {reservations.length === 0 ? (
          <div className="text-sm text-foreground/60">No reservations yet. <Link to="/events" className="text-gold hover:underline">Book a table</Link>.</div>
        ) : (
          <ul className="divide-y divide-border/40">
            {reservations.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between text-sm">
                <span>{r.reservation_date} · {r.reservation_time?.slice(0,5)} · party of {r.party_size}</span>
                <span className="text-xs uppercase tracking-wider text-gold">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
