import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Image, Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/admin/slideshow")({
  head: () => ({
    meta: [{ title: "Slideshow — Empire Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSlideshow,
});

interface SiteImage {
  id: string;
  slot: "hero" | "auth";
  url: string;
  alt: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

function AdminSlideshow() {
  const { user } = useAuth();
  const [heroImages, setHeroImages] = useState<SiteImage[]>([]);
  const [authImages, setAuthImages] = useState<SiteImage[]>([]);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [slot, setSlot] = useState<"hero" | "auth">("hero");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    const { data, error } = await supabase.from("site_images").select("*").order("sort_order");
    if (error) {
      toast.error("Failed to load images");
      return;
    }
    setHeroImages(data.filter((i: SiteImage) => i.slot === "hero"));
    setAuthImages(data.filter((i: SiteImage) => i.slot === "auth"));
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Enter a URL");
      return;
    }
    if (slot === "auth" && authImages.length >= 5) {
      toast.error("Auth slot limited to max 5 images");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("site_images").insert({
      slot,
      url: url.trim(),
      alt: alt.trim(),
      sort_order: sortOrder,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to add image");
      return;
    }
    toast.success("Image added");
    setUrl("");
    setAlt("");
    fetchImages();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("site_images").update({ active: !current }).eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    fetchImages();
  };

  const updateSortOrder = async (id: string, newOrder: number) => {
    const { error } = await supabase
      .from("site_images")
      .update({ sort_order: newOrder })
      .eq("id", id);
    if (error) {
      toast.error("Failed to reorder");
      return;
    }
    fetchImages();
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase.from("site_images").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Image deleted");
    fetchImages();
  };

  const renderSection = (title: string, images: SiteImage[]) => (
    <div className="glass rounded-3xl p-5 sm:p-7 kente-border">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`relative rounded-2xl overflow-hidden border-2 ${
              img.active ? "border-yellow-500" : "border-neutral-700"
            } bg-neutral-900 group`}
          >
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-40 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white/80 px-2 truncate">{img.alt || "No alt"}</span>
            </div>
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                onClick={() => toggleActive(img.id, img.active)}
                className="p-1 bg-black/60 rounded-full hover:bg-yellow-600 transition"
              >
                {img.active ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => deleteImage(img.id)}
                className="p-1 bg-black/60 rounded-full hover:bg-red-600 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="p-2 flex items-center gap-2">
              <GripVertical size={12} className="text-neutral-500" />
              <input
                type="number"
                value={img.sort_order}
                onChange={(e) => updateSortOrder(img.id, parseInt(e.target.value) || 0)}
                className="w-14 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-xs text-center"
              />
              <span className={`text-xs ${img.active ? "text-yellow-400" : "text-neutral-500"}`}>
                {img.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <p className="text-neutral-500 text-sm col-span-full">No images yet</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Slideshow Management</h1>

      {slot === "auth" && authImages.length >= 5 && (
        <div className="bg-red-900/30 border border-red-600 rounded-xl p-3 text-red-400 text-sm">
          Warning: Auth slot limited to max 5 images.
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="glass rounded-3xl p-5 sm:p-7 kente-border flex flex-col sm:flex-row gap-3 items-end"
      >
        <div className="flex-1">
          <ImageUpload
            folder="slideshow"
            value={url}
            onChange={(uploadedUrl) => setUrl(uploadedUrl)}
            label="Upload image"
            className="h-32"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1 text-neutral-400">Alt Text</label>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe image"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-neutral-400">Slot</label>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as "hero" | "auth")}
            className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm"
          >
            <option value="hero">Hero</option>
            <option value="auth">Auth</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 text-neutral-400">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            className="w-20 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-xl px-4 py-2 flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {renderSection("Hero Slideshow", heroImages)}
      {renderSection("Auth Page Background", authImages)}
    </div>
  );
}
