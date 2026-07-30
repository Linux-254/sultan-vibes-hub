import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import {
  LogOut,
  Shield,
  Calendar,
  Camera,
  Instagram,
  Music2,
  Twitter,
  Loader2,
  Check,
  User as UserIcon,
  Globe,
  AtSign,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Profile — Empire Kwa Sultan" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
}

const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  label: string;
  icon: typeof Instagram;
  placeholder: string;
}[] = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "@username" },
  { key: "tiktok", label: "TikTok", icon: Music2, placeholder: "@username" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "@username" },
  { key: "facebook", label: "Facebook", icon: AtSign, placeholder: "Profile URL" },
  { key: "website", label: "Website", icon: Globe, placeholder: "https://..." },
];

function ProfilePage() {
  const { user, isStaff, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [reservations, setReservations] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.display_name ?? "");
          setPhone(data.phone ?? "");
          setBio(data.bio ?? "");
          setAvatarUrl(data.avatar_url ?? null);
          setSocialLinks((data.social_links as SocialLinks) ?? {});
        }
      });
    supabase
      .from("reservations")
      .select("*")
      .eq("user_id", user.id)
      .order("reservation_date", { ascending: false })
      .then(({ data }) => {
        setReservations(data ?? []);
      });
  }, [user]);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const bustUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: bustUrl })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarUrl(bustUrl);
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !avatarUrl) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;
      setAvatarUrl(null);
      toast.success("Photo removed.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name || null,
          phone: phone || null,
          bio: bio || null,
          social_links: socialLinks,
        })
        .eq("id", user!.id);
      if (error) throw error;
      setDirty(false);
      setSaveSuccess(true);
      toast.success("Profile saved.");
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  const initials = (name || user.email?.split("@")[0] || "?").slice(0, 2).toUpperCase();
  const hasSocials = Object.values(socialLinks).some((v) => v?.trim());

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-5 lg:px-8 py-12 sm:py-20 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Your space</div>
          <h1 className="font-display text-3xl sm:text-4xl mt-2">
            Hello, <span className="text-gold-gradient">{name || user.email?.split("@")[0]}</span>
          </h1>
        </div>
        <button
          onClick={() => signOut()}
          className="shrink-0 text-xs text-foreground/60 hover:text-gold flex items-center gap-1.5 mt-2"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* Admin link */}
      {isStaff && (
        <Link
          to="/admin"
          className="block glass rounded-3xl p-4 sm:p-6 kente-border hover:bg-gold/5 transition"
        >
          <div className="flex items-center gap-3">
            <Shield className="text-gold shrink-0" />
            <div>
              <div className="font-display text-lg sm:text-xl">Open the admin panel</div>
              <div className="text-sm text-foreground/60">
                Reservations, payments, crew chat — all in one place.
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ──── Avatar + Basic Info ──── */}
      <div className="glass rounded-3xl p-5 sm:p-7 space-y-6">
        {/* Avatar section */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-gold/40 hover:border-gold transition flex items-center justify-center bg-night/60 shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-2xl sm:text-3xl text-gold/60">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                {uploading ? (
                  <Loader2 size={20} className="text-gold animate-spin" />
                ) : (
                  <Camera size={20} className="text-gold" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {avatarUrl && (
              <button
                onClick={removeAvatar}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-lava text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove photo"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg">{name || user.email?.split("@")[0]}</div>
            <div className="text-sm text-foreground/50 truncate">{user.email}</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-1.5 text-xs text-gold hover:text-gold-soft transition"
            >
              {avatarUrl ? "Change photo" : "Upload photo"}
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <span className="eyebrow">Display name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markDirty();
            }}
            placeholder="Your name"
            className="mt-1.5 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition"
          />
        </div>

        {/* Phone */}
        <div>
          <span className="eyebrow">Phone</span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              markDirty();
            }}
            placeholder="+254 7XX XXX XXX"
            className="mt-1.5 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition"
          />
        </div>

        {/* Bio */}
        <div>
          <span className="eyebrow">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              markDirty();
            }}
            placeholder="Tell the Empire community about yourself..."
            rows={3}
            maxLength={200}
            className="mt-1.5 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition resize-none"
          />
          <div className="text-right text-[10px] text-foreground/40 mt-1">{bio.length}/200</div>
        </div>

        {/* Social links */}
        <div>
          <span className="eyebrow">Social links</span>
          <div className="mt-2 space-y-2">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
              <div
                key={key}
                className="flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-3 py-2.5 focus-within:border-gold transition"
              >
                <Icon size={15} className="text-gold shrink-0" />
                <span className="text-xs text-foreground/50 w-20 shrink-0 hidden sm:block">
                  {label}
                </span>
                <input
                  value={socialLinks[key] ?? ""}
                  onChange={(e) => {
                    setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }));
                    markDirty();
                  }}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent focus:outline-none text-sm min-w-0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition flex items-center gap-2 ${
              saveSuccess
                ? "bg-savanna text-night-deep"
                : dirty
                  ? "bg-gold text-night-deep hover:shadow-[var(--shadow-glow)]"
                  : "bg-gold/30 text-night-deep/50 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              "Save profile"
            )}
          </button>
          {dirty && !saving && <span className="text-xs text-gold/70">Unsaved changes</span>}
        </div>
      </div>

      {/* ──── Reservations ──── */}
      <div className="glass rounded-3xl p-5 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-xl flex items-center gap-2">
            <Calendar size={18} className="text-gold" /> Reservations
          </div>
          <span className="text-xs text-foreground/50">{reservations.length} total</span>
        </div>
        {reservations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={32} className="text-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-foreground/60">No reservations yet.</p>
            <Link to="/events" className="inline-flex mt-3 text-sm text-gold hover:underline">
              Book a table →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {reservations.slice(0, 5).map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between text-sm gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {new Date(r.reservation_date).toLocaleDateString("en-KE", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {r.reservation_time ? ` · ${r.reservation_time.slice(0, 5)}` : ""}
                  </div>
                  <div className="text-xs text-foreground/50">Party of {r.party_size}</div>
                </div>
                <span
                  className={`shrink-0 text-xs uppercase tracking-wider font-mono ${
                    r.status === "confirmed"
                      ? "text-savanna"
                      : r.status === "pending"
                        ? "text-gold"
                        : r.status === "cancelled"
                          ? "text-lava"
                          : "text-foreground/50"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ──── Account Info ──── */}
      <div className="glass rounded-3xl p-5 sm:p-7">
        <div className="font-display text-xl mb-4">Account</div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Email</span>
            <span className="font-mono">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Role</span>
            <span className="uppercase tracking-wider text-gold text-xs font-mono">
              {isStaff ? "Crew" : "Guest"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Member since</span>
            <span>
              {new Date(user.created_at).toLocaleDateString("en-KE", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
