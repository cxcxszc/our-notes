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
    <section className="card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-label">Shared photos</p>
          <h2 className="text-xl font-bold">Photo drop</h2>
        </div>
        {uploading && <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>Uploading...</span>}
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ background: "rgba(199, 95, 84, 0.10)", borderColor: "rgba(199, 95, 84, 0.28)", color: "var(--accent-strong)" }}>
          {error}
        </div>
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <input
        className="input-base focus-ring"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Add a caption"
        maxLength={140}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          className="btn-ghost w-full"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading}
        >
          📸 Shared Photos
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          className="btn-primary w-full"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          ⚡ Instant Camera
        </motion.button>
      </div>
    </section>
  );
}