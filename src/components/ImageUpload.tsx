import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  folder: string;
  value: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  className?: string;
  label?: string;
}

export function ImageUpload({
  folder,
  value,
  onChange,
  onRemove,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  className = "",
  label = "Upload image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("site-media")
        .upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(`${data.publicUrl}?t=${Date.now()}`);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    onChange("");
    onRemove?.();
  };

  if (value) {
    return (
      <div
        className={`relative group rounded-2xl overflow-hidden border border-border/60 ${className}`}
      >
        <img src={value} alt="" className="w-full h-full object-cover" />
        <button
          onClick={remove}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-night-deep/80 text-lava flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 hover:border-gold/60 bg-night/40 transition cursor-pointer ${className}`}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      {uploading ? (
        <Loader2 size={20} className="text-gold animate-spin" />
      ) : (
        <ImageIcon size={20} className="text-foreground/30" />
      )}
      <span className="text-xs text-foreground/40">{uploading ? "Uploading..." : label}</span>
    </button>
  );
}
