"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface PhotoUploaderProps {
  onUpload: (file: File, caption?: string) => Promise<void>;
}

export function PhotoUploader({ onUpload }: PhotoUploaderProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setUploading(true);
    try {
      await onUpload(file, caption);
      setCaption("");
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="app-card space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--app-muted)" }}>
            Shared photos
          </p>
          <h2 className="text-xl font-bold" style={{ color: "var(--app-text)" }}>
            Photo drop
          </h2>
        </div>
        {uploading && (
          <span className="text-xs font-bold" style={{ color: "var(--app-muted)" }}>
            Uploading...
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border px-3 py-2 text-sm font-semibold" style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.22)", color: "var(--app-danger)" }}>
          {error}
        </div>
      )}

      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />

      <input
        className="w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none"
        style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Add a caption"
        maxLength={140}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          className="app-ghost-button w-full"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading}
        >
          Shared Photos
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          className="app-primary-button w-full"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          Instant Camera
        </motion.button>
      </div>
    </section>
  );
}
