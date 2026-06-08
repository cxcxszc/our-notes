"use client";

import { AnimatePresence } from "framer-motion";
import { SharedPhoto } from "@/types";
import { PhotoCard } from "@/components/photos/PhotoCard";
import { PhotoUploader } from "@/components/photos/PhotoUploader";

interface SharedPhotosPanelProps {
  photos: SharedPhoto[];
  loading: boolean;
  error: string | null;
  currentUserId: string;
  onUpload: (file: File, caption?: string) => Promise<void>;
  onDelete: (photo: SharedPhoto, currentUserId: string) => Promise<void>;
}

export function SharedPhotosPanel({ photos, loading, error, currentUserId, onUpload, onDelete }: SharedPhotosPanelProps) {
  return (
    <section className="mt-6 space-y-4">
      <PhotoUploader onUpload={onUpload} />

      {error ? (
        <div className="rounded-lg border p-4 text-sm font-semibold" style={{ background: "rgba(199, 95, 84, 0.10)", borderColor: "rgba(199, 95, 84, 0.28)", color: "var(--accent-strong)" }}>
          {error}
        </div>
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="card h-52 animate-pulse" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)", background: "rgba(255, 253, 248, 0.46)" }}>
          Share the first photo here.
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} currentUserId={currentUserId} onDelete={onDelete} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}