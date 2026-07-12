import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadsApi, resolveUploadUrl, ApiError, type UploadType } from "../api";
import { cn } from "../lib/utils";

interface ImageUploaderProps {
  type: UploadType;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

export default function ImageUploader({ type, value, onChange, max = 6, label }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const room = Math.max(0, max - value.length);
      const picked = Array.from(files).slice(0, room);
      const uploaded = await Promise.all(picked.map((f) => uploadsApi.uploadFile(type, f)));
      onChange([...value, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
            <img src={resolveUploadUrl(url)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-ink-muted hover:border-primary hover:text-primary",
              uploading && "opacity-60"
            )}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
